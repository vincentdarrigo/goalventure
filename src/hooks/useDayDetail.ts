import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';
import { DateTime } from 'luxon';

import { dailyLogSnapshotByDateQuery } from '@/src/db/repositories/dailyLogSnapshotRepo';
import { foodLogsInRangeQuery, type FoodLogRow } from '@/src/db/repositories/foodLogRepo';
import { hydrationLogsInRangeQuery, type HydrationLogRow } from '@/src/db/repositories/hydrationLogRepo';
import { resolveDayType, UnconfiguredWeekdayError } from '@/src/domain/day-type/resolveDayType';

import { useDayTypeContext } from './useDayTypeContext';

export type UseDayDetailResult =
  | { status: 'loading' }
  | {
      status: 'ready';
      dayTypeName: string | null;
      calorieTarget: number;
      proteinTarget: number;
      foodLogs: FoodLogRow[];
      hydrationLogs: HydrationLogRow[];
    };

/** A single arbitrary date's logs and (snapshot-first) targets, for History's day-detail view. */
export function useDayDetail(date: string, zone: string): UseDayDetailResult {
  const context = useDayTypeContext();
  const { data: snapshotRows } = useLiveQuery(dailyLogSnapshotByDateQuery(date));

  const dayStartUtc = DateTime.fromISO(date, { zone }).startOf('day').toUTC().toISO() ?? '';
  const dayEndUtc =
    DateTime.fromISO(date, { zone }).plus({ days: 1 }).startOf('day').toUTC().toISO() ?? '';
  const { data: foodLogs } = useLiveQuery(foodLogsInRangeQuery(dayStartUtc, dayEndUtc));
  const { data: hydrationLogs } = useLiveQuery(hydrationLogsInRangeQuery(dayStartUtc, dayEndUtc));

  if (!context || !snapshotRows || !foodLogs || !hydrationLogs) {
    return { status: 'loading' };
  }

  const snapshot = snapshotRows[0];
  let dayTypeName: string | null = null;
  let calorieTarget = 0;
  let proteinTarget = 0;

  if (snapshot) {
    dayTypeName = snapshot.dayTypeName;
    calorieTarget = snapshot.calorieTarget;
    proteinTarget = snapshot.proteinTarget;
  } else {
    try {
      const resolved = resolveDayType(date, context.weeklySchedule, context.overrides, context.dayTypesById);
      dayTypeName = resolved.dayType.name;
      calorieTarget = resolved.dayType.calorieTarget;
      proteinTarget = resolved.dayType.proteinTarget;
    } catch (e) {
      if (!(e instanceof UnconfiguredWeekdayError)) throw e;
      // Unconfigured weekday and no snapshot: leave targets at zero, name null.
    }
  }

  return { status: 'ready', dayTypeName, calorieTarget, proteinTarget, foodLogs, hydrationLogs };
}
