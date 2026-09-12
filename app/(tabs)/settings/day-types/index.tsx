import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ListRow } from '@/src/components/settings/ListRow';
import { type DayTypeRow, dayTypesQuery } from '@/src/db/repositories/dayTypeRepo';

function describeDayType(dt: DayTypeRow): string {
  if (dt.isFastDay) return `Fast · ${dt.calorieTarget} kcal`;
  if (!dt.eatingWindowStart || !dt.eatingWindowEnd) {
    return `Flexible · ${dt.calorieTarget} kcal / ${dt.proteinTarget}g`;
  }
  return `${dt.eatingWindowStart}–${dt.eatingWindowEnd} · ${dt.calorieTarget} kcal / ${dt.proteinTarget}g`;
}

export default function DayTypesScreen() {
  const { data } = useLiveQuery(dayTypesQuery());

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <ScrollView>
        {data?.length === 0 && (
          <Text className="px-4 py-6 text-center text-neutral-500 dark:text-neutral-400">
            No day types yet. Add one to start building your weekly schedule.
          </Text>
        )}
        {data?.map((dt) => (
          <ListRow
            key={dt.id}
            title={dt.name}
            subtitle={describeDayType(dt)}
            onPress={() => router.push(`/settings/day-types/${dt.id}`)}
          />
        ))}
      </ScrollView>
      <Pressable
        onPress={() => router.push('/settings/day-types/new')}
        className="m-4 items-center rounded-full bg-neutral-900 py-4 active:opacity-80 dark:bg-white">
        <Text className="text-base font-semibold text-white dark:text-neutral-900">
          Add Day Type
        </Text>
      </Pressable>
    </View>
  );
}
