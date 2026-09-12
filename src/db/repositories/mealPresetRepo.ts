import { asc, eq, isNull } from 'drizzle-orm';

import { db } from '@/src/db/client';
import { mealPreset } from '../schema';

export type MealPresetRow = typeof mealPreset.$inferSelect;

export type MealPresetInput = {
  name: string;
  calories: number;
  proteinG: number;
  servingDescription?: string | null;
  tags?: string[];
};

export function mealPresetsQuery() {
  return db
    .select()
    .from(mealPreset)
    .where(isNull(mealPreset.archivedAt))
    .orderBy(asc(mealPreset.name));
}

export function mealPresetByIdQuery(id: number) {
  return db.select().from(mealPreset).where(eq(mealPreset.id, id)).limit(1);
}

export async function createMealPreset(input: MealPresetInput) {
  const rows = await db.insert(mealPreset).values(input).returning();
  return rows[0];
}

/**
 * A composed preset's flat calories/proteinG are placeholders (never read —
 * live totals come from mealPresetIngredient instead). Mirrors
 * createMealStack's "create now, populate items next" flow.
 */
export async function createComposedMealPreset(name: string) {
  const rows = await db
    .insert(mealPreset)
    .values({ name, isComposed: true, calories: 0, proteinG: 0 })
    .returning();
  return rows[0];
}

export async function updateMealPreset(id: number, input: Partial<MealPresetInput>) {
  const rows = await db.update(mealPreset).set(input).where(eq(mealPreset.id, id)).returning();
  return rows[0];
}

/** Soft-delete only — FoodLog rows may reference a preset via sourcePresetId. */
export async function archiveMealPreset(id: number) {
  await db
    .update(mealPreset)
    .set({ archivedAt: new Date().toISOString() })
    .where(eq(mealPreset.id, id));
}
