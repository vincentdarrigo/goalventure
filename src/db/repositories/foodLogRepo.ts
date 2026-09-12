import { and, desc, eq, gte, lt } from 'drizzle-orm';
import type { DateTime } from 'luxon';

import { db } from '@/src/db/client';
import { isWithinAnyEatingWindow } from '@/src/domain/fasting/fastingState';
import type { ResolvedDayType } from '@/src/domain/types';

import { ensureDailySnapshot } from './dailyLogSnapshotRepo';
import { foodLog } from '../schema';

export type FoodLogRow = typeof foodLog.$inferSelect;

export type LogFoodInput = {
  dateTime: DateTime;
  description: string;
  calories: number;
  proteinG: number;
  mealSlot?: string | null;
  sourcePresetId?: number | null;
  sourceIngredientId?: number | null;
  sourceStackId?: number | null;
  yesterday: ResolvedDayType;
  today: ResolvedDayType;
};

/** Live-query-able: food logs with an absolute UTC instant in [startIso, endIsoExclusive). */
export function foodLogsInRangeQuery(startIso: string, endIsoExclusive: string) {
  return db
    .select()
    .from(foodLog)
    .where(and(gte(foodLog.dateTime, startIso), lt(foodLog.dateTime, endIsoExclusive)))
    .orderBy(desc(foodLog.dateTime));
}

/**
 * Logs a meal, snapshotting calories/proteinG at write time (never a live
 * join to the source preset) so later editing or deleting that preset can
 * never mutate this historical entry. Flags `loggedOutsideWindow` rather
 * than rejecting the write — logging before/after the eating window must
 * always succeed.
 */
export async function logFood(input: LogFoodInput) {
  const isoInstant = input.dateTime.toUTC().toISO();
  if (!isoInstant) {
    throw new Error('Invalid dateTime passed to logFood');
  }
  await ensureDailySnapshot(input.today);
  const withinWindow = isWithinAnyEatingWindow(input.dateTime, input.yesterday, input.today);
  const rows = await db
    .insert(foodLog)
    .values({
      dateTime: isoInstant,
      description: input.description,
      calories: input.calories,
      proteinG: input.proteinG,
      mealSlot: input.mealSlot ?? null,
      sourcePresetId: input.sourcePresetId ?? null,
      sourceIngredientId: input.sourceIngredientId ?? null,
      sourceStackId: input.sourceStackId ?? null,
      loggedOutsideWindow: !withinWindow,
    })
    .returning();
  return rows[0];
}

export async function deleteFoodLog(id: number) {
  await db.delete(foodLog).where(eq(foodLog.id, id));
}
