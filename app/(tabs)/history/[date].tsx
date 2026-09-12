import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { FormField } from '@/src/components/shared/FormField';
import { deleteFoodLog } from '@/src/db/repositories/foodLogRepo';
import { deleteHydrationLog } from '@/src/db/repositories/hydrationLogRepo';
import { deleteWeightLog, logWeight, weightLogsQuery } from '@/src/db/repositories/weightLogRepo';
import { useDayDetail } from '@/src/hooks/useDayDetail';
import { useUserProfile } from '@/src/hooks/useUserProfile';

export default function DayDetailScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const profile = useUserProfile();

  if (!profile) {
    return <View className="flex-1 bg-white dark:bg-neutral-950" />;
  }

  return <DayDetailContent date={date} timezone={profile.timezone} />;
}

export function DayDetailContent({ date, timezone }: { date: string; timezone: string }) {
  const detail = useDayDetail(date, timezone);
  const { data: weightRows } = useLiveQuery(weightLogsQuery());
  const weightForDate = weightRows?.find((w) => w.date === date);
  const [weightInput, setWeightInput] = useState('');

  async function handleSaveWeight() {
    const value = Number(weightInput);
    if (!Number.isFinite(value) || value <= 0) return;
    try {
      await logWeight(date, value);
      setWeightInput('');
    } catch (e) {
      Alert.alert('Couldn’t save weight', e instanceof Error ? e.message : String(e));
    }
  }

  function confirmDeleteFood(id: number) {
    Alert.alert('Delete this entry?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteFoodLog(id) },
    ]);
  }

  function confirmDeleteHydration(id: number) {
    Alert.alert('Delete this entry?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteHydrationLog(id) },
    ]);
  }

  if (detail.status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-950">
        <Text className="text-neutral-500 dark:text-neutral-400">Loading…</Text>
      </View>
    );
  }

  const hasAnyLogs = detail.foodLogs.length > 0 || detail.hydrationLogs.length > 0;

  return (
    <ScrollView className="flex-1 bg-white dark:bg-neutral-950" contentContainerClassName="gap-5 px-6 py-6">
      <View>
        <Text className="text-2xl font-bold text-neutral-900 dark:text-white">{date}</Text>
        <Text className="mt-1 text-neutral-500 dark:text-neutral-400">
          {detail.dayTypeName ?? 'Unconfigured day'} · target {detail.calorieTarget} kcal /{' '}
          {detail.proteinTarget}g
        </Text>
      </View>

      {!hasAnyLogs && (
        <Text className="text-center text-neutral-500 dark:text-neutral-400">
          No logs for this date yet.
        </Text>
      )}

      {detail.foodLogs.length > 0 && (
        <View>
          <Text className="mb-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">Meals</Text>
          {detail.foodLogs.map((log) => (
            <View
              key={log.id}
              className="flex-row items-center justify-between border-b border-neutral-100 py-3 dark:border-neutral-900">
              <View className="flex-1">
                <Text className="text-neutral-900 dark:text-white">{log.description}</Text>
                <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                  {log.calories} kcal · {log.proteinG}g
                  {log.loggedOutsideWindow ? ' · outside window' : ''}
                </Text>
              </View>
              <Pressable onPress={() => confirmDeleteFood(log.id)}>
                <Text className="text-sm text-red-600 dark:text-red-400">Delete</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {detail.hydrationLogs.length > 0 && (
        <View>
          <Text className="mb-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">Water</Text>
          {detail.hydrationLogs.map((log) => (
            <View
              key={log.id}
              className="flex-row items-center justify-between border-b border-neutral-100 py-3 dark:border-neutral-900">
              <Text className="text-neutral-900 dark:text-white">{log.ounces} oz</Text>
              <Pressable onPress={() => confirmDeleteHydration(log.id)}>
                <Text className="text-sm text-red-600 dark:text-red-400">Delete</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View className="gap-2">
        <Text className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Weight</Text>
        {weightForDate ? (
          <View className="flex-row items-center justify-between">
            <Text className="text-neutral-900 dark:text-white">{weightForDate.weight}</Text>
            <Pressable onPress={() => deleteWeightLog(weightForDate.id)}>
              <Text className="text-sm text-red-600 dark:text-red-400">Delete</Text>
            </Pressable>
          </View>
        ) : (
          <View className="flex-row gap-2">
            <View className="flex-1">
              <FormField
                label=""
                value={weightInput}
                onChangeText={setWeightInput}
                keyboardType="decimal-pad"
                placeholder="Weight"
              />
            </View>
            <Pressable
              onPress={handleSaveWeight}
              className="items-center justify-center rounded-full bg-neutral-900 px-4 dark:bg-white">
              <Text className="font-semibold text-white dark:text-neutral-900">Save</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
