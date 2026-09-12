import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';

import { ingredientByIdQuery } from '@/src/db/repositories/ingredientRepo';
import { mealPresetIngredientItemsQuery } from '@/src/db/repositories/mealPresetIngredientRepo';
import { mealPresetByIdQuery } from '@/src/db/repositories/mealPresetRepo';
import type { MealPlanEntryRow } from '@/src/db/repositories/mealPlanEntryRepo';
import { mealStackByIdQuery, mealStackItemsQuery } from '@/src/db/repositories/mealStackRepo';
import { computeStackTotals } from '@/src/domain/nutrition/mealStack';

export interface MealPlanEntryDetails {
  description: string;
  calories: number;
  proteinG: number;
  sourcePresetId?: number;
  sourceIngredientId?: number;
  sourceStackId?: number;
}

/**
 * Resolves what a plan entry actually amounts to, live — the single place
 * this resolution happens, reused for both display and convert-to-log so the
 * two can never disagree. Runs all three lookups unconditionally (rules of
 * hooks); the two that don't apply query id 0, a harmless no-op.
 */
export function useMealPlanEntryDetails(entry: MealPlanEntryRow): MealPlanEntryDetails | undefined {
  const ingredientResult = useLiveQuery(ingredientByIdQuery(entry.ingredientId ?? 0));
  const presetResult = useLiveQuery(mealPresetByIdQuery(entry.mealPresetId ?? 0));
  const presetIngredientsResult = useLiveQuery(mealPresetIngredientItemsQuery(entry.mealPresetId ?? 0));
  const stackResult = useLiveQuery(mealStackByIdQuery(entry.mealStackId ?? 0));
  const stackItemsResult = useLiveQuery(mealStackItemsQuery(entry.mealStackId ?? 0));

  if (entry.ingredientId) {
    const row = ingredientResult.data?.[0];
    if (!row) return undefined;
    return {
      description: row.name,
      calories: row.calories * entry.quantity,
      proteinG: row.proteinG * entry.quantity,
      sourceIngredientId: row.id,
    };
  }

  if (entry.mealPresetId) {
    const preset = presetResult.data?.[0];
    if (!preset) return undefined;
    if (preset.isComposed) {
      const items = presetIngredientsResult.data;
      if (!items) return undefined;
      const totals = computeStackTotals(items);
      return {
        description: preset.name,
        calories: totals.calories * entry.quantity,
        proteinG: totals.proteinG * entry.quantity,
        sourcePresetId: preset.id,
      };
    }
    return {
      description: preset.name,
      calories: preset.calories * entry.quantity,
      proteinG: preset.proteinG * entry.quantity,
      sourcePresetId: preset.id,
    };
  }

  if (entry.mealStackId) {
    const stack = stackResult.data?.[0];
    const items = stackItemsResult.data;
    if (!stack || !items) return undefined;
    const totals = computeStackTotals(items);
    return {
      description: stack.name,
      calories: totals.calories * entry.quantity,
      proteinG: totals.proteinG * entry.quantity,
      sourceStackId: stack.id,
    };
  }

  return undefined;
}
