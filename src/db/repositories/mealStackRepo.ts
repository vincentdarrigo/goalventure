import { asc, eq } from 'drizzle-orm';

import { db } from '@/src/db/client';

import { mealPreset, mealStack, mealStackItem } from '../schema';

export type MealStackRow = typeof mealStack.$inferSelect;

export function mealStacksQuery() {
  return db.select().from(mealStack).orderBy(asc(mealStack.name));
}

export function mealStackByIdQuery(id: number) {
  return db.select().from(mealStack).where(eq(mealStack.id, id)).limit(1);
}

/** Live-query-able: a stack's items joined with their current preset nutrition (computed live, not snapshotted). */
export function mealStackItemsQuery(mealStackId: number) {
  return db
    .select({
      id: mealStackItem.id,
      order: mealStackItem.order,
      quantity: mealStackItem.quantity,
      presetId: mealPreset.id,
      presetName: mealPreset.name,
      calories: mealPreset.calories,
      proteinG: mealPreset.proteinG,
    })
    .from(mealStackItem)
    .innerJoin(mealPreset, eq(mealStackItem.mealPresetId, mealPreset.id))
    .where(eq(mealStackItem.mealStackId, mealStackId))
    .orderBy(asc(mealStackItem.order));
}

export async function createMealStack(name: string) {
  const rows = await db.insert(mealStack).values({ name }).returning();
  return rows[0];
}

export async function renameMealStack(id: number, name: string) {
  await db.update(mealStack).set({ name }).where(eq(mealStack.id, id));
}

/** Deleting a stack cascades to its items (mealStackItem has onDelete: 'cascade'). */
export async function deleteMealStack(id: number) {
  await db.delete(mealStack).where(eq(mealStack.id, id));
}

export async function addMealStackItem(
  mealStackId: number,
  mealPresetId: number,
  quantity: number,
  order: number
) {
  const rows = await db
    .insert(mealStackItem)
    .values({ mealStackId, mealPresetId, quantity, order })
    .returning();
  return rows[0];
}

export async function removeMealStackItem(id: number) {
  await db.delete(mealStackItem).where(eq(mealStackItem.id, id));
}
