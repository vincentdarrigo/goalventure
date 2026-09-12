import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ListRow } from '@/src/components/settings/ListRow';
import { mealPresetsQuery } from '@/src/db/repositories/mealPresetRepo';

export default function MealPresetsScreen() {
  const { data } = useLiveQuery(mealPresetsQuery());

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <ScrollView>
        {data?.length === 0 && (
          <Text className="px-4 py-6 text-center text-neutral-500 dark:text-neutral-400">
            No meal presets yet. Add your go-to meals so logging them is one tap.
          </Text>
        )}
        {data?.map((preset) => (
          <ListRow
            key={preset.id}
            title={preset.name}
            subtitle={`${preset.calories} kcal · ${preset.proteinG}g protein${
              preset.servingDescription ? ` · ${preset.servingDescription}` : ''
            }`}
            onPress={() => router.push(`/settings/meal-presets/${preset.id}`)}
          />
        ))}
      </ScrollView>
      <Pressable
        onPress={() => router.push('/settings/meal-presets/new')}
        className="m-4 items-center rounded-full bg-neutral-900 py-4 active:opacity-80 dark:bg-white">
        <Text className="text-base font-semibold text-white dark:text-neutral-900">
          Add Meal Preset
        </Text>
      </Pressable>
    </View>
  );
}
