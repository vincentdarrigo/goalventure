import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { FormField } from '@/src/components/shared/FormField';
import { useAccountabilityCredential, useCheckInItems, usePutDailySummary } from '@/src/hooks/useAccountability';
import { useUserProfile } from '@/src/hooks/useUserProfile';
import { todayIsoInZone } from '@/src/domain/datetime';
import { deviceTimezone } from '@/src/lib/datetime';
import type { CheckInPayload } from '@/src/services/accountability';

export default function SendCheckInScreen() {
  const profile = useUserProfile();
  const { credential } = useAccountabilityCredential();
  const { data: items } = useCheckInItems(credential);
  const putSummary = usePutDailySummary();

  const [values, setValues] = useState<CheckInPayload>({});
  const [hydrated, setHydrated] = useState(false);

  // Default every configured item to a sane empty value exactly once, the
  // first time the list arrives — same "hydrate once, then locally controlled" pattern as every other form here.
  useEffect(() => {
    if (hydrated || !items) return;
    void (async () => {
      const defaults: CheckInPayload = {};
      for (const item of items) {
        defaults[item.key] = item.valueType === 'boolean' ? false : '';
      }
      setValues(defaults);
      setHydrated(true);
    })();
  }, [hydrated, items]);

  if (!credential || !items || !hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-950">
        <Text className="text-neutral-500 dark:text-neutral-400">Loading…</Text>
      </View>
    );
  }

  const zone = profile?.timezone ?? deviceTimezone();
  const today = todayIsoInZone(zone);

  async function handleSend() {
    const payload: CheckInPayload = {};
    for (const item of items!) {
      const raw = values[item.key];
      payload[item.key] = item.valueType === 'number' ? Number(raw) || 0 : raw ?? (item.valueType === 'boolean' ? false : '');
    }
    await putSummary.mutateAsync({ credential: credential!, date: today, payload });
    router.back();
  }

  return (
    <ScrollView className="flex-1 bg-white dark:bg-neutral-950" contentContainerClassName="gap-5 px-6 py-6">
      <Text className="text-sm text-neutral-500 dark:text-neutral-400">Sending for {today}</Text>

      {items.length === 0 && (
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">
          No check-in items configured yet — add some first.
        </Text>
      )}

      {items.map((item) => (
        <View key={item.id}>
          {item.valueType === 'boolean' ? (
            <View>
              <Text className="mb-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">{item.label}</Text>
              <View className="flex-row gap-2">
                {[true, false].map((option) => (
                  <Pressable
                    key={String(option)}
                    onPress={() => setValues((v) => ({ ...v, [item.key]: option }))}
                    className={`flex-1 rounded-lg border px-4 py-3 ${
                      values[item.key] === option
                        ? 'border-neutral-900 bg-neutral-900 dark:border-white dark:bg-white'
                        : 'border-neutral-200 dark:border-neutral-800'
                    }`}>
                    <Text
                      className={`text-center font-medium ${
                        values[item.key] === option ? 'text-white dark:text-neutral-900' : 'text-neutral-900 dark:text-white'
                      }`}>
                      {option ? 'Yes' : 'No'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <FormField
              label={item.label}
              value={String(values[item.key] ?? '')}
              onChangeText={(text) => setValues((v) => ({ ...v, [item.key]: text }))}
              keyboardType={item.valueType === 'number' ? 'decimal-pad' : 'default'}
            />
          )}
        </View>
      ))}

      {putSummary.isError && (
        <Text className="text-sm text-red-600 dark:text-red-400">
          {putSummary.error instanceof Error ? putSummary.error.message : 'Failed to send.'}
        </Text>
      )}

      <Pressable
        onPress={handleSend}
        disabled={items.length === 0 || putSummary.isPending}
        className={`items-center rounded-full px-8 py-4 ${
          items.length > 0 && !putSummary.isPending
            ? 'bg-neutral-900 active:opacity-80 dark:bg-white'
            : 'bg-neutral-300 dark:bg-neutral-800'
        }`}>
        <Text className="text-base font-semibold text-white dark:text-neutral-900">
          {putSummary.isPending ? 'Sending…' : "Send today's check-in"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
