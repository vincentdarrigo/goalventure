import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { MealLogGrid } from '@/src/components/today/MealLogGrid';
import { RoutineChecklist } from '@/src/components/today/RoutineChecklist';
import { todayIsoInZone } from '@/src/domain/datetime';
import type { DayType, ResolvedDayType } from '@/src/domain/types';
import { useFastingState } from '@/src/hooks/useFastingState';
import { type LogMealInput, useLogMeal } from '@/src/hooks/useLogMeal';
import { useTodayMacros } from '@/src/hooks/useTodayMacros';
import { useTodayRoutine } from '@/src/hooks/useTodayRoutine';
import { useUserProfile } from '@/src/hooks/useUserProfile';
import { formatDuration } from '@/src/lib/formatDuration';

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

  // Hooks must run unconditionally: fall back to placeholders until ready.
  const fallbackDate = todayIsoInZone(timezone);
  const yesterday = result.status === 'ready' ? result.yesterday : placeholderResolved(fallbackDate);
  const today = result.status === 'ready' ? result.today : placeholderResolved(fallbackDate);

  const routine = useTodayRoutine(today.dayType.id, today.date);
  const macros = useTodayMacros(today, timezone);
  const logMeal = useLogMeal(yesterday, today, timezone);

  async function handleLog(input: LogMealInput) {
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

  const { fastingState } = result;
  const isEating = fastingState.phase === 'eating';

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-neutral-950"
      contentContainerClassName="gap-4 px-6 pb-12 pt-16">
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

      {macros && (
        <View className="mt-1 flex-row gap-6">
          <View>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">Calories</Text>
            <Text
              className={`text-xl font-semibold ${
                macros.isOverCalorieTarget ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-white'
              }`}>
              {macros.caloriesConsumed} / {macros.calorieTarget}
            </Text>
            <Text className="text-xs text-neutral-400 dark:text-neutral-600">
              {macros.caloriesRemaining >= 0
                ? `${macros.caloriesRemaining} remaining`
                : `${-macros.caloriesRemaining} over`}
            </Text>
          </View>
          <View>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">Protein</Text>
            <Text className="text-xl font-semibold text-neutral-900 dark:text-white">
              {macros.proteinConsumedG}g / {macros.proteinTarget}g
            </Text>
            <Text className="text-xs text-neutral-400 dark:text-neutral-600">
              {macros.proteinRemainingG >= 0
                ? `${macros.proteinRemainingG}g remaining`
                : `${-macros.proteinRemainingG}g over`}
            </Text>
          </View>
        </View>
      )}

      <View className="mt-2 gap-3">
        <Text className="text-lg font-semibold text-neutral-900 dark:text-white">Log a meal</Text>
        <MealLogGrid onLog={handleLog} />
      </View>

      {routine.status === 'ready' && routine.steps.length > 0 && (
        <View className="mt-4 gap-3">
          <Text className="text-lg font-semibold text-neutral-900 dark:text-white">
            {routine.next ? `Next: ${routine.next.label}` : 'All done for today 🎉'}
          </Text>
          <RoutineChecklist steps={routine.steps} onSetStatus={routine.setStepStatus} />
        </View>
      )}
    </ScrollView>
  );
}
