import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { ListRow } from '@/src/components/settings/ListRow';
import { todayIsoInZone } from '@/src/domain/datetime';
import { useHistoryDays } from '@/src/hooks/useHistoryDays';
import { useUserProfile } from '@/src/hooks/useUserProfile';

export default function HistoryScreen() {
  const profile = useUserProfile();

  if (!profile) {
    return <View className="flex-1 bg-white dark:bg-neutral-950" />;
  }

  return <HistoryContent timezone={profile.timezone} />;
}

function HistoryContent({ timezone }: { timezone: string }) {
  const today = todayIsoInZone(timezone);
  const days = useHistoryDays(today, timezone);

  return (
    <ScrollView className="flex-1 bg-white dark:bg-neutral-950" contentContainerClassName="pt-16">
      <Text className="px-4 pb-2 text-2xl font-bold text-neutral-900 dark:text-white">History</Text>
      {days?.map((day) => (
        <ListRow
          key={day.date}
          title={day.date}
          subtitle={
            day.hasActivity
              ? `${day.dayTypeName ?? 'Unconfigured'} · ${day.caloriesConsumed}/${day.calorieTarget} kcal`
              : 'No logs yet'
          }
          onPress={() => router.push(`/history/${day.date}`)}
        />
      ))}
    </ScrollView>
  );
}
