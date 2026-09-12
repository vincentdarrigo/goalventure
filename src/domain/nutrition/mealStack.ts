export interface MealStackItemEntry {
  calories: number;
  proteinG: number;
  quantity: number;
}

/**
 * A MealStack's totals are computed live from its current items/presets — a
 * stack is a reusable logging shortcut, not itself a historical log, so it
 * does not get the FoodLog anti-mutation/snapshot treatment. The same math
 * (sum of calories/proteinG × quantity) applies unchanged to a composed
 * MealPreset's ingredients, so this is reused there too rather than
 * duplicated — see mealPresetIngredientRepo.ts.
 */
export function computeStackTotals(items: readonly MealStackItemEntry[]): {
  calories: number;
  proteinG: number;
} {
  return items.reduce(
    (totals, item) => ({
      calories: totals.calories + item.calories * item.quantity,
      proteinG: totals.proteinG + item.proteinG * item.quantity,
    }),
    { calories: 0, proteinG: 0 }
  );
}
