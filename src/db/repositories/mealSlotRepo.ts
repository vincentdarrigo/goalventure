import { asc, isNull } from 'drizzle-orm';

import { db } from '@/src/db/client';

import { mealSlot } from '../schema';

export type MealSlotRow = typeof mealSlot.$inferSelect;

const DEFAULT_MEAL_SLOT_NAMES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

/** Live-query-able: all non-archived meal slots, in display order. */
export function mealSlotsQuery() {
  return db
    .select()
    .from(mealSlot)
    .where(isNull(mealSlot.archivedAt))
    .orderBy(asc(mealSlot.order), asc(mealSlot.id));
}

/**
 * Seeds the four default slots the first time Meal Planning is opened, if
 * none exist yet — user-editable data from that point on, never a hardcoded
 * constant the app logic depends on.
 */
export async function ensureDefaultMealSlots() {
  const existing = await db.select().from(mealSlot).limit(1);
  if (existing.length > 0) return;
  await db
    .insert(mealSlot)
    .values(DEFAULT_MEAL_SLOT_NAMES.map((name, index) => ({ name, order: index })));
}
