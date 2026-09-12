import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { FormField } from '@/src/components/shared/FormField';
import {
  archiveIngredient,
  createIngredient,
  ingredientByIdQuery,
  updateIngredient,
} from '@/src/db/repositories/ingredientRepo';

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export default function IngredientFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const ingredientId = isNew ? null : Number(id);

  const [loaded, setLoaded] = useState(isNew);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [servingSizeAmount, setServingSizeAmount] = useState('100');
  const [servingSizeUnit, setServingSizeUnit] = useState('g');
  const [servingDescription, setServingDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [carbsG, setCarbsG] = useState('');
  const [fatG, setFatG] = useState('');
  const [fiberG, setFiberG] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isNew || ingredientId === null) return;
    let cancelled = false;
    (async () => {
      const rows = await ingredientByIdQuery(ingredientId);
      const row = rows[0];
      if (!row || cancelled) return;
      setName(row.name);
      setBrand(row.brand ?? '');
      setServingSizeAmount(String(row.servingSizeAmount));
      setServingSizeUnit(row.servingSizeUnit);
      setServingDescription(row.servingDescription ?? '');
      setCalories(String(row.calories));
      setProteinG(String(row.proteinG));
      setCarbsG(row.carbsG !== null ? String(row.carbsG) : '');
      setFatG(row.fatG !== null ? String(row.fatG) : '');
      setFiberG(row.fiberG !== null ? String(row.fiberG) : '');
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [isNew, ingredientId]);

  const canSubmit =
    name.trim().length > 0 &&
    servingSizeUnit.trim().length > 0 &&
    Number.isFinite(Number(servingSizeAmount)) &&
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
        brand: brand.trim() || null,
        servingSizeAmount: Number(servingSizeAmount),
        servingSizeUnit: servingSizeUnit.trim(),
        servingDescription: servingDescription.trim() || null,
        calories: Number(calories),
        proteinG: Number(proteinG),
        carbsG: parseOptionalNumber(carbsG),
        fatG: parseOptionalNumber(fatG),
        fiberG: parseOptionalNumber(fiberG),
      };
      if (isNew) {
        await createIngredient(input);
      } else if (ingredientId !== null) {
        await updateIngredient(ingredientId, input);
      }
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save.');
      setSubmitting(false);
    }
  }

  async function handleArchive() {
    if (ingredientId === null) return;
    await archiveIngredient(ingredientId);
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
      <FormField label="Name" value={name} onChangeText={setName} placeholder="Chicken Breast" />
      <FormField label="Brand — optional" value={brand} onChangeText={setBrand} placeholder="Kirkland" />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField
            label="Serving size"
            value={servingSizeAmount}
            onChangeText={setServingSizeAmount}
            keyboardType="decimal-pad"
            placeholder="100"
          />
        </View>
        <View className="flex-1">
          <FormField
            label="Unit"
            value={servingSizeUnit}
            onChangeText={setServingSizeUnit}
            placeholder="g"
          />
        </View>
      </View>

      <FormField
        label="Serving description — optional"
        value={servingDescription}
        onChangeText={setServingDescription}
        placeholder="1 breast (100g)"
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField label="Calories" value={calories} onChangeText={setCalories} keyboardType="decimal-pad" />
        </View>
        <View className="flex-1">
          <FormField
            label="Protein (g)"
            value={proteinG}
            onChangeText={setProteinG}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField
            label="Carbs (g) — optional"
            value={carbsG}
            onChangeText={setCarbsG}
            keyboardType="decimal-pad"
          />
        </View>
        <View className="flex-1">
          <FormField
            label="Fat (g) — optional"
            value={fatG}
            onChangeText={setFatG}
            keyboardType="decimal-pad"
          />
        </View>
        <View className="flex-1">
          <FormField
            label="Fiber (g) — optional"
            value={fiberG}
            onChangeText={setFiberG}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

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
            Archive this ingredient
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
