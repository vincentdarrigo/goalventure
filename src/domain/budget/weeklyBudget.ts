export interface DayBudgetEntry {
  date: string;
  calorieTarget: number;
  proteinTarget: number;
  caloriesConsumed: number;
  proteinConsumedG: number;
}

export interface WeeklyBudget {
  days: DayBudgetEntry[];
  calorieTargetTotal: number;
  proteinTargetTotal: number;
  caloriesConsumedTotal: number;
  proteinConsumedTotal: number;
  /** consumed - target; positive means over budget for the week. */
  calorieVariance: number;
  isOverBudget: boolean;
}

export function computeWeeklyBudget(days: readonly DayBudgetEntry[]): WeeklyBudget {
  const totals = days.reduce(
    (acc, day) => ({
      calorieTargetTotal: acc.calorieTargetTotal + day.calorieTarget,
      proteinTargetTotal: acc.proteinTargetTotal + day.proteinTarget,
      caloriesConsumedTotal: acc.caloriesConsumedTotal + day.caloriesConsumed,
      proteinConsumedTotal: acc.proteinConsumedTotal + day.proteinConsumedG,
    }),
    { calorieTargetTotal: 0, proteinTargetTotal: 0, caloriesConsumedTotal: 0, proteinConsumedTotal: 0 }
  );
  const calorieVariance = totals.caloriesConsumedTotal - totals.calorieTargetTotal;

  return {
    days: [...days],
    ...totals,
    calorieVariance,
    isOverBudget: calorieVariance > 0,
  };
}
