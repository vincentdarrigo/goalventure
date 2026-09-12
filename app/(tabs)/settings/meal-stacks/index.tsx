import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ListRow } from '@/src/components/settings/ListRow';
import { createMealStack, mealStacksQuery } from '@/src/db/repositories/mealStackRepo';

export default function MealStacksScreen() {
  const { data } = useLiveQuery(mealStacksQuery());

  async function handleAdd() {
    const stack = await createMealStack('New Stack');
    router.push(`/settings/meal-stacks/${stack.id}`);
  }

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <ScrollView>
        {data?.length === 0 && (
          <Text className="px-4 py-6 text-center text-neutral-500 dark:text-neutral-400">
            No meal stacks yet. Stacks bundle several presets into one log — like the Mega Meal
            Closer.
          </Text>
        )}
        {data?.map((stack) => (
          <ListRow
            key={stack.id}
            title={stack.name}
            onPress={() => router.push(`/settings/meal-stacks/${stack.id}`)}
          />
        ))}
      </ScrollView>
      <Pressable
        onPress={handleAdd}
        className="m-4 items-center rounded-full bg-neutral-900 py-4 active:opacity-80 dark:bg-white">
        <Text className="text-base font-semibold text-white dark:text-neutral-900">
          Add Meal Stack
        </Text>
      </Pressable>
    </View>
  );
}
