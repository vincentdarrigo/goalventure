import { Pressable, Text, View } from 'react-native';

import type { MealPlanEntryRow } from '@/src/db/repositories/mealPlanEntryRepo';
import { useMealPlanEntryDetails, type MealPlanEntryDetails } from '@/src/hooks/useMealPlanEntryDetails';

export function PlanEntryCard({
  entry,
  onLogNow,
  onRemove,
}: {
  entry: MealPlanEntryRow;
  onLogNow: (entry: MealPlanEntryRow, details: MealPlanEntryDetails) => void;
  onRemove: (id: number) => void;
}) {
  const details = useMealPlanEntryDetails(entry);
  const isLogged = entry.loggedFoodLogId !== null;

  if (!details) return null;

  return (
    <View className="flex-row items-center justify-between border-b border-neutral-100 py-3 dark:border-neutral-900">
      <View className="flex-1">
        <Text className={`text-neutral-900 dark:text-white ${isLogged ? 'line-through opacity-60' : ''}`}>
          {details.description}
          {entry.quantity !== 1 ? ` × ${entry.quantity}` : ''}
        </Text>
        <Text className="text-xs text-neutral-500 dark:text-neutral-400">
          {Math.round(details.calories)} kcal · {Math.round(details.proteinG * 10) / 10}g
        </Text>
      </View>
      {isLogged ? (
        <Text className="text-sm text-neutral-400 dark:text-neutral-600">Logged ✓</Text>
      ) : (
        <Pressable onPress={() => onLogNow(entry, details)} hitSlop={8}>
          <Text className="text-sm font-medium text-neutral-900 dark:text-white">Log it</Text>
        </Pressable>
      )}
      <Pressable onPress={() => onRemove(entry.id)} hitSlop={8} className="ml-3">
        <Text className="text-sm text-red-600 dark:text-red-400">Remove</Text>
      </Pressable>
    </View>
  );
}
