import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import type { HydrationProgress } from '@/src/domain/hydration/hydration';

const QUICK_ADD_OZ = [8, 16, 24];

export function HydrationCard({
  progress,
  onAdd,
}: {
  progress: HydrationProgress;
  onAdd: (ounces: number) => void;
}) {
  const [customAmount, setCustomAmount] = useState('');

  function handleAddCustom() {
    const ounces = Number(customAmount);
    if (Number.isFinite(ounces) && ounces > 0) {
      onAdd(ounces);
      setCustomAmount('');
    }
  }

  return (
    <View className="gap-2 rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <Text className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Water</Text>
      <Text
        className={`text-lg font-semibold ${
          progress.overGoal ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-900 dark:text-white'
        }`}>
        {progress.consumedOz} / {progress.goalOz} oz
      </Text>
      <Text className="text-xs text-neutral-400 dark:text-neutral-600">
        {progress.overGoal
          ? `${-progress.remainingOz} oz past goal`
          : `${progress.remainingOz} oz remaining`}
      </Text>

      <View className="mt-1 flex-row flex-wrap items-center gap-2">
        {QUICK_ADD_OZ.map((amount) => (
          <Pressable
            key={amount}
            onPress={() => onAdd(amount)}
            className="rounded-full border border-neutral-200 px-3 py-1.5 active:opacity-70 dark:border-neutral-800">
            <Text className="text-sm font-medium text-neutral-900 dark:text-white">+{amount} oz</Text>
          </Pressable>
        ))}
        <TextInput
          value={customAmount}
          onChangeText={setCustomAmount}
          onSubmitEditing={handleAddCustom}
          keyboardType="number-pad"
          placeholder="oz"
          placeholderTextColor="#9ca3af"
          className="w-16 rounded-full border border-neutral-200 px-3 py-1.5 text-sm text-neutral-900 dark:border-neutral-800 dark:text-white"
        />
        <Pressable onPress={handleAddCustom} className="rounded-full bg-neutral-900 px-3 py-1.5 active:opacity-80 dark:bg-white">
          <Text className="text-sm font-medium text-white dark:text-neutral-900">Add</Text>
        </Pressable>
      </View>
    </View>
  );
}
