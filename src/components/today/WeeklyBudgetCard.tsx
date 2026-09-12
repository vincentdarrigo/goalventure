import { Text, View } from 'react-native';

import type { WeeklyBudget } from '@/src/domain/budget/weeklyBudget';

export function WeeklyBudgetCard({ budget }: { budget: WeeklyBudget }) {
  return (
    <View className="gap-1 rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <Text className="text-sm font-medium text-neutral-500 dark:text-neutral-400">This week</Text>
      <Text
        className={`text-lg font-semibold ${
          budget.isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-white'
        }`}>
        {budget.caloriesConsumedTotal} / {budget.calorieTargetTotal} kcal
      </Text>
      <Text className="text-xs text-neutral-400 dark:text-neutral-600">
        {budget.isOverBudget
          ? `${budget.calorieVariance} kcal over the weekly budget`
          : `${-budget.calorieVariance} kcal of runway left this week`}
      </Text>
    </View>
  );
}
