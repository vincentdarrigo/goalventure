import { Alert, ScrollView, Text, View } from 'react-native';

import { DiscoveryList } from '@/src/components/travel/DiscoveryList';
import { ManualFoodEntryForm } from '@/src/components/travel/ManualFoodEntryForm';
import { WildcardControl } from '@/src/components/travel/WildcardControl';
import { todayIsoInZone } from '@/src/domain/datetime';
import type { DayType, ResolvedDayType } from '@/src/domain/types';
import { useFastingState } from '@/src/hooks/useFastingState';
import { useHighProteinFood, useMovementDestinations } from '@/src/hooks/useLocationDiscovery';
import { type LogMealInput, useLogMeal } from '@/src/hooks/useLogMeal';
import { useUserProfile } from '@/src/hooks/useUserProfile';

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-white px-8 dark:bg-neutral-950">
      {children}
    </View>
  );
}

// Harmless placeholder used only until the real fasting state has loaded —
// hooks below must run unconditionally, before we know the real day type.
const PLACEHOLDER_DAY_TYPE: DayType = {
  id: 0,
  name: '',
  eatingWindowStart: null,
  eatingWindowEnd: null,
  isFastDay: true,
  calorieTarget: 0,
  proteinTarget: 0,
};

function placeholderResolved(date: string): ResolvedDayType {
  return { date, dayType: PLACEHOLDER_DAY_TYPE, source: 'schedule' };
}

export default function TravelScreen() {
  const profile = useUserProfile();

  if (!profile) {
    return (
      <Centered>
        <Text className="text-neutral-500 dark:text-neutral-400">Loading…</Text>
      </Centered>
    );
  }

  return <TravelContent timezone={profile.timezone} />;
}

function TravelContent({ timezone }: { timezone: string }) {
  const result = useFastingState(timezone);

  const fallbackDate = todayIsoInZone(timezone);
  const yesterday = result.status === 'ready' ? result.yesterday : placeholderResolved(fallbackDate);
  const today = result.status === 'ready' ? result.today : placeholderResolved(fallbackDate);

  const logMeal = useLogMeal(yesterday, today, timezone);
  const foodQuery = useHighProteinFood();
  const movementQuery = useMovementDestinations();

  async function handleManualLog(input: LogMealInput) {
    try {
      await logMeal(input);
    } catch (e) {
      Alert.alert('Couldn’t log that meal', e instanceof Error ? e.message : String(e));
    }
  }

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
          Set up a schedule first
        </Text>
        <Text className="text-center text-neutral-500 dark:text-neutral-400">
          Travel mode needs at least one day type and a weekly schedule to know what today would
          normally be.
        </Text>
      </Centered>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-neutral-950"
      contentContainerClassName="gap-5 px-6 pb-12 pt-16">
      <Text className="text-3xl font-bold text-neutral-900 dark:text-white">Travel</Text>

      <WildcardControl today={today} />

      <DiscoveryList
        title="High-protein food nearby"
        query={foodQuery}
        emptyLabel="No suggestions nearby right now."
        renderItem={(item) => ({
          key: item.id,
          primary: item.name,
          secondary: `${item.cuisineOrCategory} · ${Math.round(item.distanceMeters)}m${
            item.estimatedProteinFriendly ? ' · protein-friendly' : ''
          }`,
        })}
      />

      <DiscoveryList
        title="Nearby movement"
        query={movementQuery}
        emptyLabel="No suggestions nearby right now."
        renderItem={(item) => ({
          key: item.id,
          primary: item.name,
          secondary: `${Math.round(item.distanceMeters)}m${
            item.estimatedWalkMinutes ? ` · ~${item.estimatedWalkMinutes} min walk` : ''
          }`,
        })}
      />

      <ManualFoodEntryForm onLog={handleManualLog} />
    </ScrollView>
  );
}
