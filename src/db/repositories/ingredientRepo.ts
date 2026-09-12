import { asc, eq, isNull } from 'drizzle-orm';

import { db } from '@/src/db/client';

import { ingredient } from '../schema';

export type IngredientRow = typeof ingredient.$inferSelect;

export type IngredientInput = {
  name: string;
  brand?: string | null;
  servingSizeAmount: number;
  servingSizeUnit: string;
  servingDescription?: string | null;
  calories: number;
  proteinG: number;
  carbsG?: number | null;
  fatG?: number | null;
  fiberG?: number | null;
  sourceProvider?: string | null;
  sourceExternalId?: string | null;
};

/** Live-query-able: all non-archived ingredients, alphabetical. */
export function ingredientsQuery() {
  return db
    .select()
    .from(ingredient)
    .where(isNull(ingredient.archivedAt))
    .orderBy(asc(ingredient.name));
}

export function ingredientByIdQuery(id: number) {
  return db.select().from(ingredient).where(eq(ingredient.id, id)).limit(1);
}

export async function createIngredient(input: IngredientInput) {
  const rows = await db.insert(ingredient).values(input).returning();
  return rows[0];
}

export async function updateIngredient(id: number, input: Partial<IngredientInput>) {
  const rows = await db.update(ingredient).set(input).where(eq(ingredient.id, id)).returning();
  return rows[0];
}

/** Soft-delete only — mealPresetIngredient/foodLog rows may reference this ingredient. */
export async function archiveIngredient(id: number) {
  await db
    .update(ingredient)
    .set({ archivedAt: new Date().toISOString() })
    .where(eq(ingredient.id, id));
}
