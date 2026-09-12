import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ListRow } from '@/src/components/settings/ListRow';
import { type SupplementRow, supplementsQuery } from '@/src/db/repositories/supplementRepo';

const TIMING_LABEL: Record<SupplementRow['timing'], string> = {
  fasted: 'Fasted',
  with_meal: 'With meal',
  bedtime: 'Bedtime',
  pre_workout: 'Pre-workout',
  specific_time: 'Specific time',
};

function describeSupplement(s: SupplementRow): string {
  const timing = s.timing === 'specific_time' && s.specificTime ? s.specificTime : TIMING_LABEL[s.timing];
  return `${s.dosageAmount}${s.dosageUnit} · ${timing}`;
}

export default function SupplementsScreen() {
  const { data } = useLiveQuery(supplementsQuery());

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <ScrollView>
        {data?.length === 0 && (
          <Text className="px-4 py-6 text-center text-neutral-500 dark:text-neutral-400">
            No supplements yet. Add one to start tracking doses on Today.
          </Text>
        )}
        {data?.map((s) => (
          <ListRow
            key={s.id}
            title={s.name}
            subtitle={describeSupplement(s)}
            onPress={() => router.push(`/settings/supplements/${s.id}`)}
          />
        ))}
      </ScrollView>
      <Pressable
        onPress={() => router.push('/settings/supplements/new')}
        className="m-4 items-center rounded-full bg-neutral-900 py-4 active:opacity-80 dark:bg-white">
        <Text className="text-base font-semibold text-white dark:text-neutral-900">
          Add Supplement
        </Text>
      </Pressable>
    </View>
  );
}
