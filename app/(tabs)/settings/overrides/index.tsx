import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { dayTypesQuery } from '@/src/db/repositories/dayTypeRepo';
import { dateOverridesQuery, removeDateOverride } from '@/src/db/repositories/dateOverrideRepo';

export default function DateOverridesScreen() {
  const { data: overrides } = useLiveQuery(dateOverridesQuery());
  const { data: dayTypes } = useLiveQuery(dayTypesQuery());
  const dayTypesById = Object.fromEntries((dayTypes ?? []).map((dt) => [dt.id, dt]));

  function confirmRemove(id: number, date: string) {
    Alert.alert('Remove override?', `${date} will go back to its regular schedule.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeDateOverride(id) },
    ]);
  }

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <ScrollView>
        {overrides?.length === 0 && (
          <Text className="px-4 py-6 text-center text-neutral-500 dark:text-neutral-400">
            No overrides yet. Use these for one-off travel, holiday, or illness swaps without
            changing your recurring schedule.
          </Text>
        )}
        {overrides?.map((o) => (
          <View
            key={o.id}
            className="flex-row items-center justify-between border-b border-neutral-100 px-4 py-4 dark:border-neutral-900">
            <View className="flex-1">
              <Text className="text-base font-medium text-neutral-900 dark:text-white">{o.date}</Text>
              <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                {dayTypesById[o.overrideDayTypeId]?.name ?? 'Unknown day type'}
                {o.reason ? ` · ${o.reason}` : ''}
              </Text>
            </View>
            <Pressable onPress={() => confirmRemove(o.id, o.date)} className="px-2 py-1">
              <Text className="text-sm font-medium text-red-600 dark:text-red-400">Remove</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
      <Pressable
        onPress={() => router.push('/settings/overrides/new')}
        className="m-4 items-center rounded-full bg-neutral-900 py-4 active:opacity-80 dark:bg-white">
        <Text className="text-base font-semibold text-white dark:text-neutral-900">Add Override</Text>
      </Pressable>
    </View>
  );
}
