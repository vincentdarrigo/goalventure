import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';
import { DateTime } from 'luxon';

import { foodLogsInRangeQuery } from '@/src/db/repositories/foodLogRepo';
import { computeMacroProgress, type MacroProgress } from '@/src/domain/nutrition/macros';
import type { ResolvedDayType } from '@/src/domain/types';

/** Today's consumed/remaining calories and protein, live. Undefined while loading. */
export function useTodayMacros(today: ResolvedDayType, zone: string): MacroProgress | undefined {
  const startOfDay = DateTime.fromISO(today.date, { zone }).startOf('day');
  const startIso = startOfDay.toUTC().toISO();
  const endIso = startOfDay.plus({ days: 1 }).toUTC().toISO();

  const { data } = useLiveQuery(foodLogsInRangeQuery(startIso ?? '', endIso ?? ''));

  if (!data) return undefined;
  return computeMacroProgress(data, today.dayType.calorieTarget, today.dayType.proteinTarget);
}
