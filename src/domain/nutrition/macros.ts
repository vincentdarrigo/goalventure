export interface MacroEntry {
  calories: number;
  proteinG: number;
}

export interface MacroTotals {
  caloriesConsumed: number;
  proteinConsumedG: number;
}

export interface MacroProgress extends MacroTotals {
  calorieTarget: number;
  proteinTarget: number;
  caloriesRemaining: number; // may go negative when over target
  proteinRemainingG: number; // may go negative when over target
  isOverCalorieTarget: boolean;
}

export function sumMacros(entries: readonly MacroEntry[]): MacroTotals {
  return entries.reduce(
    (totals, entry) => ({
      caloriesConsumed: totals.caloriesConsumed + entry.calories,
      proteinConsumedG: totals.proteinConsumedG + entry.proteinG,
    }),
    { caloriesConsumed: 0, proteinConsumedG: 0 }
  );
}

export function computeMacroProgress(
  entries: readonly MacroEntry[],
  calorieTarget: number,
  proteinTarget: number
): MacroProgress {
  const totals = sumMacros(entries);
  return {
    ...totals,
    calorieTarget,
    proteinTarget,
    caloriesRemaining: calorieTarget - totals.caloriesConsumed,
    proteinRemainingG: proteinTarget - totals.proteinConsumedG,
    isOverCalorieTarget: totals.caloriesConsumed > calorieTarget,
  };
}
