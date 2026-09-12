import { and, asc, eq, gte, lte } from 'drizzle-orm';

import { db } from '@/src/db/client';

import { mealPlanEntry } from '../schema';

export type MealPlanEntryRow = typeof mealPlanEntry.$inferSelect;

/** Exactly one of these three is set on a plan entry — enforced here, not by a SQL CHECK constraint. */
export type MealPlanEntrySource =
  | { kind: 'ingredient'; ingredientId: number }
  | { kind: 'preset'; mealPresetId: number }
  | { kind: 'stack'; mealStackId: number };

export type CreateMealPlanEntryInput = {
  date: string;
  mealSlotId: number;
  quantity: number;
  order: number;
  source: MealPlanEntrySource;
};

/** Live-query-able: raw plan entries in a date range — the UI resolves display/nutrition per source type. */
export function mealPlanEntriesInRangeQuery(startDate: string, endDate: string) {
  return db
    .select()
    .from(mealPlanEntry)
    .where(and(gte(mealPlanEntry.date, startDate), lte(mealPlanEntry.date, endDate)))
    .orderBy(asc(mealPlanEntry.date), asc(mealPlanEntry.order));
}

export async function createMealPlanEntry(input: CreateMealPlanEntryInput) {
  const rows = await db
    .insert(mealPlanEntry)
    .values({
      date: input.date,
      mealSlotId: input.mealSlotId,
      quantity: input.quantity,
      order: input.order,
      ingredientId: input.source.kind === 'ingredient' ? input.source.ingredientId : null,
      mealPresetId: input.source.kind === 'preset' ? input.source.mealPresetId : null,
      mealStackId: input.source.kind === 'stack' ? input.source.mealStackId : null,
    })
    .returning();
  return rows[0];
}

export async function deleteMealPlanEntry(id: number) {
  await db.delete(mealPlanEntry).where(eq(mealPlanEntry.id, id));
}

/** Marks a plan entry as converted, once its nutrition has been logged via the normal logFood path. */
export async function markMealPlanEntryLogged(entryId: number, foodLogId: number) {
  await db.update(mealPlanEntry).set({ loggedFoodLogId: foodLogId }).where(eq(mealPlanEntry.id, entryId));
}
