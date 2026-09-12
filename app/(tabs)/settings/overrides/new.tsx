import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { FormField } from '@/src/components/shared/FormField';
import { dayTypesQuery } from '@/src/db/repositories/dayTypeRepo';
import { setDateOverride } from '@/src/db/repositories/dateOverrideRepo';
import { todayIsoInZone } from '@/src/domain/datetime';
import { useUserProfile } from '@/src/hooks/useUserProfile';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default function NewOverrideScreen() {
  const profile = useUserProfile();
  const { data: dayTypes } = useLiveQuery(dayTypesQuery());

  const [date, setDate] = useState(() => todayIsoInZone(profile?.timezone ?? 'UTC'));
  const [dayTypeId, setDayTypeId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = DATE_PATTERN.test(date) && dayTypeId !== null && !submitting;

  async function handleSubmit() {
    if (!canSubmit || dayTypeId === null) return;
    setSubmitting(true);
    setError(null);
    try {
      await setDateOverride(date, dayTypeId, reason.trim() || undefined);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save.');
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-neutral-950"
      contentContainerClassName="gap-5 px-6 py-6">
      <FormField
        label="Date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
        placeholder="2025-07-04"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View>
        <Text className="mb-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">
          Day type for this date
        </Text>
        <View className="gap-2">
          {dayTypes?.length === 0 && (
            <Text className="text-neutral-500 dark:text-neutral-400">
              No day types yet — add one in Settings › Day Types first.
            </Text>
          )}
          {dayTypes?.map((dt) => (
            <Pressable
              key={dt.id}
              onPress={() => setDayTypeId(dt.id)}
              className={`rounded-lg border px-4 py-3 ${
                dayTypeId === dt.id
                  ? 'border-neutral-900 bg-neutral-900 dark:border-white dark:bg-white'
                  : 'border-neutral-200 dark:border-neutral-800'
              }`}>
              <Text
                className={`font-medium ${
                  dayTypeId === dt.id ? 'text-white dark:text-neutral-900' : 'text-neutral-900 dark:text-white'
                }`}>
                {dt.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FormField
        label="Reason — optional"
        value={reason}
        onChangeText={setReason}
        placeholder="Travel"
      />

      {error && <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text>}

      <Pressable
        onPress={handleSubmit}
        disabled={!canSubmit}
        className={`items-center rounded-full px-8 py-4 ${
          canSubmit ? 'bg-neutral-900 active:opacity-80 dark:bg-white' : 'bg-neutral-300 dark:bg-neutral-800'
        }`}>
        <Text
          className={`text-base font-semibold ${
            canSubmit ? 'text-white dark:text-neutral-900' : 'text-neutral-500'
          }`}>
          {submitting ? 'Saving…' : 'Save override'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
