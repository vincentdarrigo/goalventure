import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';
import { DateTime } from 'luxon';
import { useMemo } from 'react';

import { hydrationLogsInRangeQuery, logHydration } from '@/src/db/repositories/hydrationLogRepo';
import { computeHydrationProgress, type HydrationProgress } from '@/src/domain/hydration/hydration';
import type { ResolvedDayType } from '@/src/domain/types';
import { onceGuard } from '@/src/domain/util/onceGuard';

export interface UseTodayHydrationResult {
  progress: HydrationProgress | undefined;
  addOunces: (ounces: number) => Promise<unknown>;
}

/** Today's hydration progress against the profile's goal, live, plus a guarded add-water action. */
export function useTodayHydration(today: ResolvedDayType, zone: string, goalOz: number): UseTodayHydrationResult {
  const startOfDay = DateTime.fromISO(today.date, { zone }).startOf('day');
  const startIso = startOfDay.toUTC().toISO() ?? '';
  const endIso = startOfDay.plus({ days: 1 }).toUTC().toISO() ?? '';

  const { data } = useLiveQuery(hydrationLogsInRangeQuery(startIso, endIso));
  const progress = data ? computeHydrationProgress(data, goalOz) : undefined;

  const addOunces = useMemo(
    () =>
      onceGuard((ounces: number) =>
        logHydration({ dateTime: DateTime.now().setZone(zone), ounces, today })
      ),
    [zone, today]
  );

  return { progress, addOunces };
}
