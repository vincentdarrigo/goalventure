import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { FormField } from '@/src/components/shared/FormField';
import { ingredientsQuery } from '@/src/db/repositories/ingredientRepo';
import {
  addMealPresetIngredient,
  mealPresetIngredientItemsQuery,
  removeMealPresetIngredient,
} from '@/src/db/repositories/mealPresetIngredientRepo';
import {
  archiveMealPreset,
  createMealPreset,
  mealPresetByIdQuery,
  updateMealPreset,
} from '@/src/db/repositories/mealPresetRepo';
import { computeStackTotals } from '@/src/domain/nutrition/mealStack';

export default function MealPresetFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const presetId = isNew ? null : Number(id);

  const [loaded, setLoaded] = useState(isNew);
  const [isComposed, setIsComposed] = useState(false);
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [servingDescription, setServingDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isNew || presetId === null) return;
    let cancelled = false;
    (async () => {
      const rows = await mealPresetByIdQuery(presetId);
      const row = rows[0];
      if (!row || cancelled) return;
      setName(row.name);
      setIsComposed(row.isComposed);
      setCalories(String(row.calories));
      setProteinG(String(row.proteinG));
      setServingDescription(row.servingDescription ?? '');
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [isNew, presetId]);

  const canSubmit =
    name.trim().length > 0 &&
    Number.isFinite(Number(calories)) &&
    Number.isFinite(Number(proteinG)) &&
    !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const input = {
        name: name.trim(),
        calories: Number(calories),
        proteinG: Number(proteinG),
        servingDescription: servingDescription.trim() || null,
      };
      if (isNew) {
        await createMealPreset(input);
      } else if (presetId !== null) {
        await updateMealPreset(presetId, input);
      }
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save.');
      setSubmitting(false);
    }
  }

  async function handleArchive() {
    if (presetId === null) return;
    await archiveMealPreset(presetId);
    router.back();
  }

  if (!loaded) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-950">
        <Text className="text-neutral-500 dark:text-neutral-400">Loading…</Text>
      </View>
    );
  }

  if (isComposed && presetId !== null) {
    return <ComposedPresetEditor presetId={presetId} name={name} onArchive={handleArchive} />;
  }

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-neutral-950"
      contentContainerClassName="gap-5 px-6 py-6">
      <FormField label="Name" value={name} onChangeText={setName} placeholder="Proats" />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField label="Calories" value={calories} onChangeText={setCalories} keyboardType="number-pad" />
        </View>
        <View className="flex-1">
          <FormField
            label="Protein (g)"
            value={proteinG}
            onChangeText={setProteinG}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <FormField
        label="Serving description — optional"
        value={servingDescription}
        onChangeText={setServingDescription}
        placeholder="1 bowl"
      />

      {error && <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text>}

      <Pressable
        onPress={handleSubmit}
        disabled={!canSubmit}
        className={`items-center rounded-full px-8 py-4 ${
          canSubmit ? 'bg-neutral-900 active:opacity-80 dark:bg-white' : 'bg-neutral-300 dark:bg-neutral-800'
        }`}>
        <Text
          className={`text-base font-semibold ${
            canSubmit ? 'text-white dark:text-neutral-900' : 'text-neutral-500'
          }`}>
          {submitting ? 'Saving…' : 'Save'}
        </Text>
      </Pressable>

      {!isNew && (
        <Pressable
          onPress={handleArchive}
          className="items-center rounded-full border border-red-200 py-4 active:opacity-70 dark:border-red-900">
          <Text className="text-base font-semibold text-red-600 dark:text-red-400">
            Archive this preset
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function ComposedPresetEditor({
  presetId,
  name: initialName,
  onArchive,
}: {
  presetId: number;
  name: string;
  onArchive: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [pickingIngredient, setPickingIngredient] = useState(false);

  const { data: items } = useLiveQuery(mealPresetIngredientItemsQuery(presetId));
  const { data: ingredients } = useLiveQuery(ingredientsQuery());
  const totals = items ? computeStackTotals(items) : null;

  async function handleRename(newName: string) {
    setName(newName);
    await updateMealPreset(presetId, { name: newName });
  }

  async function handleAddIngredient(ingredientId: number) {
    const nextOrder = (items?.length ?? 0) + 1;
    await addMealPresetIngredient(presetId, ingredientId, 1, nextOrder);
    setPickingIngredient(false);
  }

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-neutral-950"
      contentContainerClassName="gap-5 px-6 py-6">
      <FormField label="Preset name" value={name} onChangeText={handleRename} />

      {totals && (
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">
          Live total: {Math.round(totals.calories)} kcal · {Math.round(totals.proteinG * 10) / 10}g
          protein
        </Text>
      )}

      <View>
        <Text className="mb-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">
          Ingredients
        </Text>
        {items?.length === 0 && (
          <Text className="text-neutral-500 dark:text-neutral-400">No ingredients yet.</Text>
        )}
        {items?.map((item) => (
          <View
            key={item.id}
            className="flex-row items-center justify-between border-b border-neutral-100 py-3 dark:border-neutral-900">
            <Text className="flex-1 text-neutral-900 dark:text-white">
              {item.ingredientName} × {item.quantity}
            </Text>
            <Pressable onPress={() => removeMealPresetIngredient(item.id)}>
              <Text className="text-sm text-red-600 dark:text-red-400">Remove</Text>
            </Pressable>
          </View>
        ))}
      </View>

      {pickingIngredient ? (
        <View className="gap-2">
          {ingredients?.length === 0 && (
            <Text className="text-neutral-500 dark:text-neutral-400">
              No pantry ingredients yet — add some in Settings › Pantry first.
            </Text>
          )}
          {ingredients?.map((ingredient) => (
            <Pressable
              key={ingredient.id}
              onPress={() => handleAddIngredient(ingredient.id)}
              className="rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <Text className="text-neutral-900 dark:text-white">{ingredient.name}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => setPickingIngredient(false)}>
            <Text className="text-center text-neutral-500 dark:text-neutral-400">Cancel</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => setPickingIngredient(true)}
          className="items-center rounded-full bg-neutral-900 py-3 active:opacity-80 dark:bg-white">
          <Text className="font-semibold text-white dark:text-neutral-900">Add ingredient</Text>
        </Pressable>
      )}

      <Pressable
        onPress={onArchive}
        className="items-center rounded-full border border-red-200 py-4 active:opacity-70 dark:border-red-900">
        <Text className="text-base font-semibold text-red-600 dark:text-red-400">
          Archive this preset
        </Text>
      </Pressable>
    </ScrollView>
  );
}
