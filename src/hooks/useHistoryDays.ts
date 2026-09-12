import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';
import { DateTime } from 'luxon';

import { dailyLogSnapshotsInRangeQuery } from '@/src/db/repositories/dailyLogSnapshotRepo';
import { foodLogsInRangeQuery } from '@/src/db/repositories/foodLogRepo';
import { enumerateDatesInRange } from '@/src/domain/datetime';
import { resolveDayType } from '@/src/domain/day-type/resolveDayType';
import { sumMacros } from '@/src/domain/nutrition/macros';

import { useDayTypeContext } from './useDayTypeContext';

export interface HistoryDaySummary {
  date: string;
  /** Null when the weekday has no configured day type and the date has no snapshot yet. */
  dayTypeName: string | null;
  calorieTarget: number;
  caloriesConsumed: number;
  hasActivity: boolean;
}

const HISTORY_WINDOW_DAYS = 14;

/** The last `HISTORY_WINDOW_DAYS` days (most recent first), snapshot-first like useWeeklyBudget. */
export function useHistoryDays(todayIso: string, zone: string): HistoryDaySummary[] | undefined {
  const context = useDayTypeContext();
  const startDate = DateTime.fromISO(todayIso).minus({ days: HISTORY_WINDOW_DAYS - 1 }).toISODate();

  const { data: snapshots } = useLiveQuery(
    dailyLogSnapshotsInRangeQuery(startDate ?? todayIso, todayIso)
  );

  const rangeStartUtc = DateTime.fromISO(startDate ?? todayIso, { zone }).startOf('day').toUTC().toISO() ?? '';
  const rangeEndUtc =
    DateTime.fromISO(todayIso, { zone }).plus({ days: 1 }).startOf('day').toUTC().toISO() ?? '';
  const { data: foodLogs } = useLiveQuery(foodLogsInRangeQuery(rangeStartUtc, rangeEndUtc));

  if (!context || !snapshots || !foodLogs || !startDate) {
    return undefined;
  }

  const snapshotsByDate = Object.fromEntries(snapshots.map((s) => [s.date, s]));
  const dates = enumerateDatesInRange(startDate, todayIso).reverse();

  return dates.map((date) => {
    const snapshot = snapshotsByDate[date];
    let dayTypeName: string | null = null;
    let calorieTarget = 0;
    if (snapshot) {
      dayTypeName = snapshot.dayTypeName;
      calorieTarget = snapshot.calorieTarget;
    } else {
      try {
        const resolved = resolveDayType(date, context.weeklySchedule, context.overrides, context.dayTypesById);
        dayTypeName = resolved.dayType.name;
        calorieTarget = resolved.dayType.calorieTarget;
      } catch {
        // Unconfigured weekday: shown as "Unconfigured" rather than crashing the list.
      }
    }

    const dayStartUtc = DateTime.fromISO(date, { zone }).startOf('day').toUTC();
    const dayEndUtc = dayStartUtc.plus({ days: 1 });
    const dayLogs = foodLogs.filter((log) => {
      const at = DateTime.fromISO(log.dateTime, { zone: 'utc' });
      return at >= dayStartUtc && at < dayEndUtc;
    });
    const { caloriesConsumed } = sumMacros(dayLogs);

    return {
      date,
      dayTypeName,
      calorieTarget,
      caloriesConsumed,
      hasActivity: dayLogs.length > 0 || Boolean(snapshot),
    };
  });
}
