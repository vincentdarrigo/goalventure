import { DateTime } from 'luxon';

import type { DayType, ResolvedDayType } from '../types';
import { computeFastingState, isWithinEatingWindow } from './fastingState';

const ZONE = 'America/Chicago';

const GO_TO: DayType = {
  id: 1,
  name: 'Go-To 16/8',
  eatingWindowStart: '08:00',
  eatingWindowEnd: '16:00',
  isFastDay: false,
  calorieTarget: 2100,
  proteinTarget: 200,
};

const FAST: DayType = {
  id: 2,
  name: '24-Hour Fast',
  eatingWindowStart: null,
  eatingWindowEnd: null,
  isFastDay: true,
  calorieTarget: 0,
  proteinTarget: 0,
};

const TRAVEL: DayType = {
  id: 3,
  name: 'Travel/Wildcard',
  eatingWindowStart: null,
  eatingWindowEnd: null,
  isFastDay: false,
  calorieTarget: 2500,
  proteinTarget: 150,
};

const CROSSING: DayType = {
  id: 4,
  name: 'Late Shift',
  eatingWindowStart: '20:00',
  eatingWindowEnd: '04:00',
  isFastDay: false,
  calorieTarget: 2200,
  proteinTarget: 180,
};

function resolved(date: string, dayType: DayType): ResolvedDayType {
  return { date, dayType, source: 'schedule' };
}

function at(isoDate: string, hhmm: string): DateTime {
  const [hour, minute] = hhmm.split(':').map(Number);
  return DateTime.fromISO(isoDate, { zone: ZONE }).set({ hour, minute });
}

describe('computeFastingState — normal timed window', () => {
  const yesterday = resolved('2025-06-15', GO_TO);
  const today = resolved('2025-06-16', GO_TO);
  const tomorrow = resolved('2025-06-17', GO_TO);

  test('before the window opens: fasting, counts down to the window start', () => {
    const state = computeFastingState(at('2025-06-16', '06:00'), yesterday, today, tomorrow);
    expect(state.phase).toBe('fasting');
    expect(state.isFastDay).toBe(false);
    expect(state.windowStartsAt?.toISO()).toBe(at('2025-06-16', '08:00').toISO());
    expect(state.timeRemaining.as('hours')).toBe(2);
  });

  test('inside the window: eating, counts down to the window close', () => {
    const state = computeFastingState(at('2025-06-16', '12:00'), yesterday, today, tomorrow);
    expect(state.phase).toBe('eating');
    expect(state.windowEndsAt?.toISO()).toBe(at('2025-06-16', '16:00').toISO());
    expect(state.timeRemaining.as('hours')).toBe(4);
  });

  test('after the window closes: fasting, counts down to tomorrow’s window start', () => {
    const state = computeFastingState(at('2025-06-16', '18:00'), yesterday, today, tomorrow);
    expect(state.phase).toBe('fasting');
    expect(state.windowStartsAt?.toISO()).toBe(at('2025-06-17', '08:00').toISO());
  });
});

describe('computeFastingState — hard fast day', () => {
  test('fasts all day, counting down to tomorrow’s real window, not a fixed 24h', () => {
    const yesterday = resolved('2025-06-16', GO_TO);
    const today = resolved('2025-06-17', FAST);
    const tomorrow = resolved('2025-06-18', GO_TO);

    // Only ~14 hours from noon Tuesday to 8am Wednesday, not 24h.
    const state = computeFastingState(at('2025-06-17', '12:00'), yesterday, today, tomorrow);
    expect(state.phase).toBe('fasting');
    expect(state.isFastDay).toBe(true);
    expect(state.windowStartsAt?.toISO()).toBe(at('2025-06-18', '08:00').toISO());
    expect(state.timeRemaining.as('hours')).toBe(20);
  });

  test('a Fast -> flexible override on the following day counts down to midnight, not a fixed window time', () => {
    const yesterday = resolved('2025-06-16', GO_TO);
    const today = resolved('2025-06-17', FAST);
    const tomorrow = resolved('2025-06-18', TRAVEL); // e.g. Tuesday fast overridden by a Travel day next

    const state = computeFastingState(at('2025-06-17', '12:00'), yesterday, today, tomorrow);
    expect(state.phase).toBe('fasting');
    expect(state.windowStartsAt?.toISO()).toBe(
      DateTime.fromISO('2025-06-18', { zone: ZONE }).startOf('day').toISO()
    );
  });

  test('back-to-back fast days: no known next start, time remaining is zero', () => {
    const yesterday = resolved('2025-06-16', GO_TO);
    const today = resolved('2025-06-17', FAST);
    const tomorrow = resolved('2025-06-18', FAST);

    const state = computeFastingState(at('2025-06-17', '12:00'), yesterday, today, tomorrow);
    expect(state.phase).toBe('fasting');
    expect(state.windowStartsAt).toBeNull();
    expect(state.timeRemaining.as('milliseconds')).toBe(0);
  });
});

describe('computeFastingState — flexible/unrestricted day', () => {
  test('is always "eating" with no countdown, regardless of time of day', () => {
    const yesterday = resolved('2025-06-20', GO_TO);
    const today = resolved('2025-06-21', TRAVEL);
    const tomorrow = resolved('2025-06-22', TRAVEL);

    for (const time of ['00:30', '12:00', '23:59']) {
      const state = computeFastingState(at('2025-06-21', time), yesterday, today, tomorrow);
      expect(state.phase).toBe('eating');
      expect(state.isFastDay).toBe(false);
      expect(state.windowStartsAt).toBeNull();
      expect(state.windowEndsAt).toBeNull();
    }
  });
});

describe('computeFastingState — midnight-crossing window', () => {
  test('a window opened the previous evening is still "eating" in the early hours, even if today is a hard fast', () => {
    const yesterday = resolved('2025-06-16', CROSSING); // 20:00 -> 04:00 next day
    const today = resolved('2025-06-17', FAST); // unrelated to yesterday's window
    const tomorrow = resolved('2025-06-18', GO_TO);

    const state = computeFastingState(at('2025-06-17', '02:00'), yesterday, today, tomorrow);
    expect(state.phase).toBe('eating');
    expect(state.windowEndsAt?.toISO()).toBe(at('2025-06-17', '04:00').toISO());
  });

  test('once yesterday’s crossing window closes, today’s own state takes over', () => {
    const yesterday = resolved('2025-06-16', CROSSING);
    const today = resolved('2025-06-17', GO_TO);
    const tomorrow = resolved('2025-06-18', GO_TO);

    // 05:00 is after yesterday's window closed (04:00) and before today's own window opens (08:00).
    const state = computeFastingState(at('2025-06-17', '05:00'), yesterday, today, tomorrow);
    expect(state.phase).toBe('fasting');
    expect(state.windowStartsAt?.toISO()).toBe(at('2025-06-17', '08:00').toISO());
  });

  test('a same-day crossing window is open late at night', () => {
    const yesterday = resolved('2025-06-16', GO_TO);
    const today = resolved('2025-06-17', CROSSING);
    const tomorrow = resolved('2025-06-18', GO_TO);

    const state = computeFastingState(at('2025-06-17', '23:30'), yesterday, today, tomorrow);
    expect(state.phase).toBe('eating');
    expect(state.windowEndsAt?.toISO()).toBe(at('2025-06-18', '04:00').toISO());
  });
});

describe('computeFastingState — DST transition', () => {
  test('the countdown reflects actual elapsed time across the US spring-forward transition', () => {
    // 2024-03-10: America/Chicago clocks jump from 02:00 to 03:00 (CST -> CDT).
    const yesterday = resolved('2024-03-09', GO_TO);
    const today = resolved('2024-03-10', GO_TO);
    const tomorrow = resolved('2024-03-11', GO_TO);

    // Wall-clock gap from 01:00 to 08:00 looks like 7 hours, but the
    // transition happens in between, so only 6 hours actually elapse.
    const state = computeFastingState(at('2024-03-10', '01:00'), yesterday, today, tomorrow);
    expect(state.phase).toBe('fasting');
    expect(state.timeRemaining.as('hours')).toBe(6);
  });
});

describe('isWithinEatingWindow', () => {
  test('always false on a hard fast day', () => {
    expect(isWithinEatingWindow(at('2025-06-17', '12:00'), resolved('2025-06-17', FAST))).toBe(
      false
    );
  });

  test('always true on a flexible day', () => {
    expect(isWithinEatingWindow(at('2025-06-21', '03:00'), resolved('2025-06-21', TRAVEL))).toBe(
      true
    );
  });

  test('true inside, false outside a timed window', () => {
    const day = resolved('2025-06-16', GO_TO);
    expect(isWithinEatingWindow(at('2025-06-16', '12:00'), day)).toBe(true);
    expect(isWithinEatingWindow(at('2025-06-16', '18:00'), day)).toBe(false);
  });

  test('a midnight-crossing window is true on both sides of midnight for the same resolved date', () => {
    const day = resolved('2025-06-16', CROSSING); // 20:00 -> 04:00 next day
    expect(isWithinEatingWindow(at('2025-06-16', '23:30'), day)).toBe(true);
    expect(isWithinEatingWindow(at('2025-06-17', '02:00'), day)).toBe(true);
    expect(isWithinEatingWindow(at('2025-06-17', '05:00'), day)).toBe(false);
  });
});
