import { DateTime, Duration } from 'luxon';

import { anchorTimeToDate } from '../datetime';
import type { ResolvedDayType } from '../types';

export type FastingPhase = 'eating' | 'fasting';

export interface FastingState {
  phase: FastingPhase;
  isFastDay: boolean;
  /** When the current or next eating window opens. Null if unbounded (flexible) or unknown. */
  windowStartsAt: DateTime | null;
  /** When the current eating window closes. Null while fasting, or during a flexible/unbounded day. */
  windowEndsAt: DateTime | null;
  /** Time until the next transition. Zero when there is none to count down to. */
  timeRemaining: Duration;
}

interface WindowBounds {
  start: DateTime;
  end: DateTime;
}

type DayClassification =
  | { kind: 'fasting' } // isFastDay: true — no eating at all
  | { kind: 'flexible' } // isFastDay: false, no configured window — unrestricted eating (e.g. Travel/Wildcard)
  | { kind: 'timed'; bounds: WindowBounds }; // a specific eating window applies

function classifyDay(resolved: ResolvedDayType, zone: string): DayClassification {
  if (resolved.dayType.isFastDay) {
    return { kind: 'fasting' };
  }
  const { eatingWindowStart, eatingWindowEnd } = resolved.dayType;
  if (!eatingWindowStart || !eatingWindowEnd) {
    return { kind: 'flexible' };
  }
  const start = anchorTimeToDate(resolved.date, eatingWindowStart, zone);
  let end = anchorTimeToDate(resolved.date, eatingWindowEnd, zone);
  // A window "crosses midnight" whenever the end clock-time is not strictly
  // after the start clock-time on the same date; treat it as ending the next
  // calendar day, with no special-casing beyond this one comparison.
  if (end <= start) {
    end = end.plus({ days: 1 });
  }
  return { kind: 'timed', bounds: { start, end } };
}

function isWithin(now: DateTime, bounds: WindowBounds): boolean {
  return now >= bounds.start && now < bounds.end;
}

/**
 * Computes the current eating/fasting state and time remaining until the next
 * transition. `yesterday`/`today`/`tomorrow` must be pre-resolved (see
 * resolveDayType) so this function stays pure and DB-free.
 *
 * `yesterday` is required, not optional: a midnight-crossing window (e.g.
 * 20:00-04:00) opened the previous evening must still register as "eating"
 * in the early hours of today, even if today's own DayType is a fast day or
 * an unrelated window. Checking yesterday's window first — generically, for
 * every DayType, not just ones flagged as crossing — is what makes this work
 * without special-casing.
 *
 * A fast day's countdown runs to tomorrow's *real* configured window (or the
 * start of tomorrow, if tomorrow is flexible), never a fixed 24 hours, so a
 * Fast -> Travel override on the following day is reflected automatically.
 */
export function computeFastingState(
  now: DateTime,
  yesterday: ResolvedDayType,
  today: ResolvedDayType,
  tomorrow: ResolvedDayType
): FastingState {
  const zone = now.zone.name;
  const yesterdayC = classifyDay(yesterday, zone);
  const todayC = classifyDay(today, zone);
  const tomorrowC = classifyDay(tomorrow, zone);

  if (yesterdayC.kind === 'timed' && isWithin(now, yesterdayC.bounds)) {
    return {
      phase: 'eating',
      isFastDay: false,
      windowStartsAt: yesterdayC.bounds.start,
      windowEndsAt: yesterdayC.bounds.end,
      timeRemaining: yesterdayC.bounds.end.diff(now),
    };
  }

  if (todayC.kind === 'flexible') {
    return {
      phase: 'eating',
      isFastDay: false,
      windowStartsAt: null,
      windowEndsAt: null,
      timeRemaining: Duration.fromMillis(0),
    };
  }

  if (todayC.kind === 'timed') {
    const { start, end } = todayC.bounds;
    if (isWithin(now, todayC.bounds)) {
      return { phase: 'eating', isFastDay: false, windowStartsAt: start, windowEndsAt: end, timeRemaining: end.diff(now) };
    }
    if (now < start) {
      return { phase: 'fasting', isFastDay: false, windowStartsAt: start, windowEndsAt: end, timeRemaining: start.diff(now) };
    }
    // now >= end: today's window already closed — fall through to "what's next".
  }

  const nextStart =
    tomorrowC.kind === 'timed'
      ? tomorrowC.bounds.start
      : tomorrowC.kind === 'flexible'
        ? DateTime.fromISO(tomorrow.date, { zone }).startOf('day')
        : null;

  return {
    phase: 'fasting',
    isFastDay: todayC.kind === 'fasting',
    windowStartsAt: nextStart,
    windowEndsAt: null,
    timeRemaining: nextStart ? nextStart.diff(now) : Duration.fromMillis(0),
  };
}

/** Whether `at` falls inside `resolved`'s own eating window (ignores any carry-over from the previous day). */
export function isWithinEatingWindow(at: DateTime, resolved: ResolvedDayType): boolean {
  const classification = classifyDay(resolved, at.zone.name);
  if (classification.kind === 'fasting') return false;
  if (classification.kind === 'flexible') return true;
  return isWithin(at, classification.bounds);
}

/**
 * Whether `at` falls inside either today's window or a midnight-crossing
 * window carried over from yesterday. Use this (not `isWithinEatingWindow`
 * alone) whenever the check might land in the early hours of a day, e.g.
 * flagging a food log as inside/outside the eating window.
 */
export function isWithinAnyEatingWindow(
  at: DateTime,
  yesterday: ResolvedDayType,
  today: ResolvedDayType
): boolean {
  return isWithinEatingWindow(at, yesterday) || isWithinEatingWindow(at, today);
}
