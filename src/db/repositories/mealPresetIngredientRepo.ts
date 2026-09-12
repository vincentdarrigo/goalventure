import { asc, eq } from 'drizzle-orm';

import { db } from '@/src/db/client';

import { ingredient, mealPresetIngredient } from '../schema';

/** Live-query-able: a composed preset's ingredients joined with their current nutrition (computed live, not snapshotted). */
export function mealPresetIngredientItemsQuery(mealPresetId: number) {
  return db
    .select({
      id: mealPresetIngredient.id,
      order: mealPresetIngredient.order,
      quantity: mealPresetIngredient.quantity,
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      calories: ingredient.calories,
      proteinG: ingredient.proteinG,
    })
    .from(mealPresetIngredient)
    .innerJoin(ingredient, eq(mealPresetIngredient.ingredientId, ingredient.id))
    .where(eq(mealPresetIngredient.mealPresetId, mealPresetId))
    .orderBy(asc(mealPresetIngredient.order));
}

export async function addMealPresetIngredient(
  mealPresetId: number,
  ingredientId: number,
  quantity: number,
  order: number
) {
  const rows = await db
    .insert(mealPresetIngredient)
    .values({ mealPresetId, ingredientId, quantity, order })
    .returning();
  return rows[0];
}

export async function removeMealPresetIngredient(id: number) {
  await db.delete(mealPresetIngredient).where(eq(mealPresetIngredient.id, id));
}
