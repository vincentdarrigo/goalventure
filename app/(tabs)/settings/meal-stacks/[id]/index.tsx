import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { FormField } from '@/src/components/shared/FormField';
import { mealPresetsQuery } from '@/src/db/repositories/mealPresetRepo';
import {
  addMealStackItem,
  deleteMealStack,
  mealStackByIdQuery,
  mealStackItemsQuery,
  removeMealStackItem,
  renameMealStack,
} from '@/src/db/repositories/mealStackRepo';
import { computeStackTotals } from '@/src/domain/nutrition/mealStack';

export default function MealStackDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const stackId = Number(id);

  const { data: stackRows } = useLiveQuery(mealStackByIdQuery(stackId));
  const { data: items } = useLiveQuery(mealStackItemsQuery(stackId));
  const { data: presets } = useLiveQuery(mealPresetsQuery());
  // `name` overrides the loaded value once the user edits it; until then the
  // field displays whatever the live query has loaded (or '' while loading).
  const [name, setName] = useState<string | null>(null);
  const [pickingPreset, setPickingPreset] = useState(false);
  const displayName = name ?? stackRows?.[0]?.name ?? '';

  const totals = items ? computeStackTotals(items) : null;

  async function handleRename(newName: string) {
    setName(newName);
    await renameMealStack(stackId, newName);
  }

  async function handleAddItem(presetId: number) {
    const nextOrder = (items?.length ?? 0) + 1;
    await addMealStackItem(stackId, presetId, 1, nextOrder);
    setPickingPreset(false);
  }

  async function handleDeleteStack() {
    await deleteMealStack(stackId);
    router.back();
  }

  return (
    <ScrollView className="flex-1 bg-white dark:bg-neutral-950" contentContainerClassName="gap-5 px-6 py-6">
      <FormField label="Stack name" value={displayName} onChangeText={handleRename} />

      {totals && (
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">
          Total: {totals.calories} kcal · {totals.proteinG}g protein
        </Text>
      )}

      <View>
        <Text className="mb-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">Items</Text>
        {items?.length === 0 && (
          <Text className="text-neutral-500 dark:text-neutral-400">No items yet.</Text>
        )}
        {items?.map((item) => (
          <View
            key={item.id}
            className="flex-row items-center justify-between border-b border-neutral-100 py-3 dark:border-neutral-900">
            <Text className="flex-1 text-neutral-900 dark:text-white">
              {item.presetName} × {item.quantity}
            </Text>
            <Pressable onPress={() => removeMealStackItem(item.id)}>
              <Text className="text-sm text-red-600 dark:text-red-400">Remove</Text>
            </Pressable>
          </View>
        ))}
      </View>

      {pickingPreset ? (
        <View className="gap-2">
          {presets?.map((preset) => (
            <Pressable
              key={preset.id}
              onPress={() => handleAddItem(preset.id)}
              className="rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <Text className="text-neutral-900 dark:text-white">{preset.name}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => setPickingPreset(false)}>
            <Text className="text-center text-neutral-500 dark:text-neutral-400">Cancel</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => setPickingPreset(true)}
          className="items-center rounded-full bg-neutral-900 py-3 active:opacity-80 dark:bg-white">
          <Text className="font-semibold text-white dark:text-neutral-900">Add item</Text>
        </Pressable>
      )}

      <Pressable
        onPress={handleDeleteStack}
        className="items-center rounded-full border border-red-200 py-4 active:opacity-70 dark:border-red-900">
        <Text className="text-base font-semibold text-red-600 dark:text-red-400">
          Delete this stack
        </Text>
      </Pressable>
    </ScrollView>
  );
}
