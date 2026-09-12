import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { formatDuration } from '@/src/lib/formatDuration';
import { useFastingState } from '@/src/hooks/useFastingState';
import { useUserProfile } from '@/src/hooks/useUserProfile';

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-white px-8 dark:bg-neutral-950">
      {children}
    </View>
  );
}

export default function TodayScreen() {
  const profile = useUserProfile();

  if (!profile) {
    return (
      <Centered>
        <Text className="text-neutral-500 dark:text-neutral-400">Loading…</Text>
      </Centered>
    );
  }

  return <TodayContent timezone={profile.timezone} />;
}

function TodayContent({ timezone }: { timezone: string }) {
  const result = useFastingState(timezone);

  if (result.status === 'loading') {
    return (
      <Centered>
        <Text className="text-neutral-500 dark:text-neutral-400">Loading…</Text>
      </Centered>
    );
  }

  if (result.status === 'error') {
    return (
      <Centered>
        <Text className="text-center text-lg font-semibold text-neutral-900 dark:text-white">
          Today isn&apos;t set up yet
        </Text>
        <Text className="text-center text-neutral-500 dark:text-neutral-400">
          Add a day type and map it to each weekday in Settings to see today&apos;s plan here.
        </Text>
        <Pressable
          onPress={() => router.push('/settings/weekly-schedule')}
          className="mt-2 rounded-full bg-neutral-900 px-6 py-3 active:opacity-80 dark:bg-white">
          <Text className="font-semibold text-white dark:text-neutral-900">Set up schedule</Text>
        </Pressable>
      </Centered>
    );
  }

  const { fastingState, today } = result;
  const isEating = fastingState.phase === 'eating';

  return (
    <View className="flex-1 gap-4 bg-white px-6 pt-16 dark:bg-neutral-950">
      <View className="self-start rounded-full bg-neutral-100 px-3 py-1 dark:bg-neutral-900">
        <Text className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
          {today.dayType.name}
        </Text>
      </View>

      <Text className="text-3xl font-bold text-neutral-900 dark:text-white">
        {isEating ? 'Eating window open' : 'Fasting'}
      </Text>

      {fastingState.timeRemaining.as('milliseconds') > 0 && (
        <Text className="text-neutral-500 dark:text-neutral-400">
          {isEating
            ? `Closes in ${formatDuration(fastingState.timeRemaining)}`
            : `Opens in ${formatDuration(fastingState.timeRemaining)}`}
        </Text>
      )}

      <View className="mt-4 flex-row gap-6">
        <View>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">Calorie target</Text>
          <Text className="text-xl font-semibold text-neutral-900 dark:text-white">
            {today.dayType.calorieTarget} kcal
          </Text>
        </View>
        <View>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">Protein target</Text>
          <Text className="text-xl font-semibold text-neutral-900 dark:text-white">
            {today.dayType.proteinTarget}g
          </Text>
        </View>
      </View>
    </View>
  );
}
