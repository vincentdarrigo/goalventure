import type { DateOverrideRecord, DayType } from '../types';
import { resolveDayType, UnconfiguredWeekdayError } from './resolveDayType';

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

const dayTypesById = { [GO_TO.id]: GO_TO, [FAST.id]: FAST, [TRAVEL.id]: TRAVEL };

// Mon=1 GoTo, Tue=2 Fast, Wed-Fri GoTo, Sat=6 Travel, Sun=7 GoTo
const weeklySchedule: Record<number, number> = {
  1: GO_TO.id,
  2: FAST.id,
  3: GO_TO.id,
  4: GO_TO.id,
  5: GO_TO.id,
  6: TRAVEL.id,
  7: GO_TO.id,
};

describe('resolveDayType', () => {
  test('resolves a Monday to the scheduled DayType', () => {
    // 2025-06-16 is a Monday.
    const resolved = resolveDayType('2025-06-16', weeklySchedule, [], dayTypesById);
    expect(resolved).toEqual({ date: '2025-06-16', dayType: GO_TO, source: 'schedule' });
  });

  test('resolves a Tuesday to the fast DayType', () => {
    // 2025-06-17 is a Tuesday.
    const resolved = resolveDayType('2025-06-17', weeklySchedule, [], dayTypesById);
    expect(resolved.dayType).toBe(FAST);
    expect(resolved.source).toBe('schedule');
  });

  test('resolves a Saturday to the Travel DayType', () => {
    // 2025-06-21 is a Saturday.
    const resolved = resolveDayType('2025-06-21', weeklySchedule, [], dayTypesById);
    expect(resolved.dayType).toBe(TRAVEL);
  });

  test('an override on a specific date wins over the recurring schedule', () => {
    // 2025-06-17 is a Tuesday, normally Fast; override it to Travel for this date only.
    const overrides: DateOverrideRecord[] = [
      { id: 100, date: '2025-06-17', overrideDayTypeId: TRAVEL.id },
    ];

    const resolved = resolveDayType('2025-06-17', weeklySchedule, overrides, dayTypesById);
    expect(resolved).toEqual({
      date: '2025-06-17',
      dayType: TRAVEL,
      source: 'override',
      sourceOverrideId: 100,
    });
  });

  test('an override never corrupts the recurring weekly schedule for other dates', () => {
    const overrides: DateOverrideRecord[] = [
      { id: 100, date: '2025-06-17', overrideDayTypeId: TRAVEL.id },
    ];

    // The following Tuesday (2025-06-24), with no override, must still resolve to Fast.
    const nextTuesday = resolveDayType('2025-06-24', weeklySchedule, overrides, dayTypesById);
    expect(nextTuesday.dayType).toBe(FAST);
    expect(nextTuesday.source).toBe('schedule');
  });

  test('throws UnconfiguredWeekdayError when a weekday has no scheduled DayType', () => {
    const incompleteSchedule = { ...weeklySchedule };
    delete incompleteSchedule[1]; // remove Monday

    expect(() => resolveDayType('2025-06-16', incompleteSchedule, [], dayTypesById)).toThrow(
      UnconfiguredWeekdayError
    );
  });

  test('throws when an override references an unknown DayType id', () => {
    const overrides: DateOverrideRecord[] = [
      { id: 100, date: '2025-06-17', overrideDayTypeId: 999 },
    ];

    expect(() => resolveDayType('2025-06-17', weeklySchedule, overrides, dayTypesById)).toThrow(
      /unknown DayType 999/
    );
  });

  test('throws when the weekly schedule references an unknown DayType id', () => {
    const brokenSchedule = { ...weeklySchedule, 1: 999 };

    expect(() => resolveDayType('2025-06-16', brokenSchedule, [], dayTypesById)).toThrow(
      /unknown DayType 999/
    );
  });
});
