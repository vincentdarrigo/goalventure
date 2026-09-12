import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { FormField } from '@/src/components/shared/FormField';
import { createIngredient } from '@/src/db/repositories/ingredientRepo';
import { createNutritionDataProvider, type NutritionSearchResult } from '@/src/services/nutrition-data';

const provider = createNutritionDataProvider();

export default function PantrySearchScreen() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [importingId, setImportingId] = useState<string | null>(null);

  const searchQuery = useQuery({
    queryKey: ['nutrition-search', submittedQuery],
    queryFn: () => provider.search(submittedQuery),
    enabled: submittedQuery.trim().length > 0,
  });

  async function handleImport(result: NutritionSearchResult) {
    setImportingId(result.externalId);
    try {
      const detail = await provider.getDetail(result.externalId);
      const created = await createIngredient({
        name: detail.description,
        brand: detail.brand ?? null,
        servingSizeAmount: detail.servingSizeAmount,
        servingSizeUnit: detail.servingSizeUnit,
        servingDescription: detail.servingDescription ?? null,
        calories: detail.calories,
        proteinG: detail.proteinG,
        carbsG: detail.carbsG ?? null,
        fatG: detail.fatG ?? null,
        fiberG: detail.fiberG ?? null,
        sourceProvider: detail.provider,
        sourceExternalId: detail.externalId,
      });
      router.replace(`/settings/pantry/${created.id}`);
    } catch (e) {
      Alert.alert('Couldn’t import that item', e instanceof Error ? e.message : String(e));
      setImportingId(null);
    }
  }

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <View className="gap-3 px-6 pb-2 pt-6">
        <FormField
          label="Search USDA FoodData Central"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => setSubmittedQuery(query)}
          placeholder="chicken breast"
          autoFocus
        />
        <Pressable
          onPress={() => setSubmittedQuery(query)}
          className="items-center rounded-full bg-neutral-900 py-3 active:opacity-80 dark:bg-white">
          <Text className="font-semibold text-white dark:text-neutral-900">Search</Text>
        </Pressable>
        <Text className="text-xs text-neutral-400 dark:text-neutral-600">
          Tap a result to import it into your pantry — you can edit every value afterward.
        </Text>
      </View>

      <ScrollView className="flex-1">
        {searchQuery.isLoading && (
          <Text className="px-6 py-4 text-neutral-500 dark:text-neutral-400">Searching…</Text>
        )}
        {searchQuery.isError && (
          <Text className="px-6 py-4 text-sm text-red-600 dark:text-red-400">
            Couldn&apos;t search right now. You can still add ingredients manually.
          </Text>
        )}
        {searchQuery.data?.length === 0 && (
          <Text className="px-6 py-4 text-neutral-500 dark:text-neutral-400">No matches.</Text>
        )}
        {searchQuery.data?.map((result) => (
          <Pressable
            key={result.externalId}
            onPress={() => handleImport(result)}
            disabled={importingId !== null}
            className="border-b border-neutral-100 px-6 py-4 active:bg-neutral-50 dark:border-neutral-900 dark:active:bg-neutral-900">
            <Text className="font-medium text-neutral-900 dark:text-white">
              {result.description}
              {result.brand ? ` (${result.brand})` : ''}
            </Text>
            {result.dataType && (
              <Text className="text-xs text-neutral-400 dark:text-neutral-600">{result.dataType}</Text>
            )}
            {importingId === result.externalId && (
              <Text className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Importing…</Text>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
