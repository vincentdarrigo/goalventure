import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { FormField } from '@/src/components/shared/FormField';
import type { LogMealInput } from '@/src/hooks/useLogMeal';

/**
 * Always rendered regardless of discovery state — the Travel screen's
 * manual-logging fallback must remain usable even when nearby-place
 * discovery is unavailable (offline, no API key, provider error).
 */
export function ManualFoodEntryForm({ onLog }: { onLog: (input: LogMealInput) => void }) {
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [proteinG, setProteinG] = useState('');

  const canSubmit =
    description.trim().length > 0 &&
    Number.isFinite(Number(calories)) &&
    Number.isFinite(Number(proteinG));

  function handleSubmit() {
    if (!canSubmit) return;
    onLog({ description: description.trim(), calories: Number(calories), proteinG: Number(proteinG) });
    setDescription('');
    setCalories('');
    setProteinG('');
  }

  return (
    <View className="gap-3 rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <Text className="text-sm font-medium text-neutral-500 dark:text-neutral-400">I ate this</Text>
      <FormField
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="Diner burger"
        testID="manual-food-description"
      />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField
            label="Calories"
            value={calories}
            onChangeText={setCalories}
            keyboardType="number-pad"
            testID="manual-food-calories"
          />
        </View>
        <View className="flex-1">
          <FormField
            label="Protein (g)"
            value={proteinG}
            onChangeText={setProteinG}
            keyboardType="number-pad"
            testID="manual-food-protein"
          />
        </View>
      </View>
      <Pressable
        onPress={handleSubmit}
        disabled={!canSubmit}
        testID="manual-food-submit"
        className={`items-center rounded-full py-3 ${
          canSubmit ? 'bg-neutral-900 active:opacity-80 dark:bg-white' : 'bg-neutral-300 dark:bg-neutral-800'
        }`}>
        <Text
          className={`font-semibold ${canSubmit ? 'text-white dark:text-neutral-900' : 'text-neutral-500'}`}>
          Log it
        </Text>
      </Pressable>
    </View>
  );
}
