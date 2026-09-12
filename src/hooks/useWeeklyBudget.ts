import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';
import { DateTime } from 'luxon';

import { dailyLogSnapshotsInRangeQuery } from '@/src/db/repositories/dailyLogSnapshotRepo';
import { foodLogsInRangeQuery } from '@/src/db/repositories/foodLogRepo';
import { computeWeeklyBudget, type DayBudgetEntry, type WeeklyBudget } from '@/src/domain/budget/weeklyBudget';
import { enumerateDatesInRange, getWeekRange } from '@/src/domain/datetime';
import { resolveDayType } from '@/src/domain/day-type/resolveDayType';
import { sumMacros } from '@/src/domain/nutrition/macros';

import { useDayTypeContext } from './useDayTypeContext';

/**
 * The Monday..Sunday week containing today, in `zone`. For each date, prefers
 * a frozen dailyLogSnapshot (a day that already has activity) over a live
 * resolveDayType() call, so a later DayType/schedule edit never retroactively
 * changes a day that's already been logged — see dailyLogSnapshotRepo.
 */
export function useWeeklyBudget(todayIso: string, zone: string): WeeklyBudget | undefined {
  const context = useDayTypeContext();
  const { start, end } = getWeekRange(todayIso);

  const { data: snapshots } = useLiveQuery(dailyLogSnapshotsInRangeQuery(start, end));

  const rangeStartUtc = DateTime.fromISO(start, { zone }).startOf('day').toUTC().toISO() ?? '';
  const rangeEndUtc =
    DateTime.fromISO(end, { zone }).plus({ days: 1 }).startOf('day').toUTC().toISO() ?? '';
  const { data: foodLogs } = useLiveQuery(foodLogsInRangeQuery(rangeStartUtc, rangeEndUtc));

  if (!context || !snapshots || !foodLogs) {
    return undefined;
  }

  const snapshotsByDate = Object.fromEntries(snapshots.map((s) => [s.date, s]));

  const days: DayBudgetEntry[] = enumerateDatesInRange(start, end).map((date) => {
    const snapshot = snapshotsByDate[date];
    let calorieTarget = 0;
    let proteinTarget = 0;
    if (snapshot) {
      calorieTarget = snapshot.calorieTarget;
      proteinTarget = snapshot.proteinTarget;
    } else {
      try {
        const resolved = resolveDayType(date, context.weeklySchedule, context.overrides, context.dayTypesById);
        calorieTarget = resolved.dayType.calorieTarget;
        proteinTarget = resolved.dayType.proteinTarget;
      } catch {
        // Unconfigured weekday: contributes zero to the budget rather than
        // breaking the whole week view.
      }
    }

    const dayStartUtc = DateTime.fromISO(date, { zone }).startOf('day').toUTC();
    const dayEndUtc = dayStartUtc.plus({ days: 1 });
    const dayLogs = foodLogs.filter((log) => {
      const at = DateTime.fromISO(log.dateTime, { zone: 'utc' });
      return at >= dayStartUtc && at < dayEndUtc;
    });
    const { caloriesConsumed, proteinConsumedG } = sumMacros(dayLogs);

    return { date, calorieTarget, proteinTarget, caloriesConsumed, proteinConsumedG };
  });

  return computeWeeklyBudget(days);
}
