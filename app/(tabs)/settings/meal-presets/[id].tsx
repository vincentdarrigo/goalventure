import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { FormField } from '@/src/components/shared/FormField';
import {
  archiveMealPreset,
  createMealPreset,
  mealPresetByIdQuery,
  updateMealPreset,
} from '@/src/db/repositories/mealPresetRepo';

export default function MealPresetFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const presetId = isNew ? null : Number(id);

  const [loaded, setLoaded] = useState(isNew);
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
