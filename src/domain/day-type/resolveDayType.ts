import { DateTime } from 'luxon';

import type { DateOverrideRecord, DayType, ResolvedDayType } from '../types';

export class UnconfiguredWeekdayError extends Error {
  constructor(public readonly weekday: number) {
    super(`No DayType mapped for weekday ${weekday}`);
    this.name = 'UnconfiguredWeekdayError';
  }
}

/**
 * Resolves a calendar date to a DayType. A DateOverride for the exact date
 * always wins over the recurring weekly schedule; overrides live in their own
 * table and are only ever read here, so writing one is structurally incapable
 * of touching (or corrupting) the recurring `weeklySchedule` mapping.
 */
export function resolveDayType(
  isoDate: string,
  weeklySchedule: Record<number, number>,
  overrides: readonly DateOverrideRecord[],
  dayTypesById: Record<number, DayType>
): ResolvedDayType {
  const override = overrides.find((o) => o.date === isoDate);
  if (override) {
    const dayType = dayTypesById[override.overrideDayTypeId];
    if (!dayType) {
      throw new Error(
        `DateOverride ${override.id} references unknown DayType ${override.overrideDayTypeId}`
      );
    }
    return { date: isoDate, dayType, source: 'override', sourceOverrideId: override.id };
  }

  // Luxon weekday convention: 1 = Monday .. 7 = Sunday. This is pure calendar
  // math on a date string, never a wall-clock instant, so it is DST-immune.
  const weekday = DateTime.fromISO(isoDate).weekday;
  const dayTypeId = weeklySchedule[weekday];
  if (!dayTypeId) {
    throw new UnconfiguredWeekdayError(weekday);
  }
  const dayType = dayTypesById[dayTypeId];
  if (!dayType) {
    throw new Error(`weeklySchedule references unknown DayType ${dayTypeId}`);
  }
  return { date: isoDate, dayType, source: 'schedule' };
}
