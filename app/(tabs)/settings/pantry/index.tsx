import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ListRow } from '@/src/components/settings/ListRow';
import { type IngredientRow, ingredientsQuery } from '@/src/db/repositories/ingredientRepo';

function describeIngredient(i: IngredientRow): string {
  const serving = i.servingDescription ?? `${i.servingSizeAmount}${i.servingSizeUnit}`;
  return `${i.calories} kcal · ${i.proteinG}g protein · ${serving}`;
}

export default function PantryScreen() {
  const { data } = useLiveQuery(ingredientsQuery());

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <ScrollView>
        {data?.length === 0 && (
          <Text className="px-4 py-6 text-center text-neutral-500 dark:text-neutral-400">
            No ingredients yet. Add your pantry staples to build meal presets from real nutrition
            data.
          </Text>
        )}
        {data?.map((i) => (
          <ListRow
            key={i.id}
            title={i.brand ? `${i.name} (${i.brand})` : i.name}
            subtitle={describeIngredient(i)}
            onPress={() => router.push(`/settings/pantry/${i.id}`)}
          />
        ))}
      </ScrollView>
      <Pressable
        onPress={() => router.push('/settings/pantry/new')}
        className="m-4 items-center rounded-full bg-neutral-900 py-4 active:opacity-80 dark:bg-white">
        <Text className="text-base font-semibold text-white dark:text-neutral-900">
          Add Ingredient
        </Text>
      </Pressable>
    </View>
  );
}
