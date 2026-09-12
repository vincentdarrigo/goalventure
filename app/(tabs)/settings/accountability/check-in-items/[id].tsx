import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { FormField } from '@/src/components/shared/FormField';
import {
  useAccountabilityCredential,
  useArchiveCheckInItem,
  useCheckInItems,
  useCreateCheckInItem,
  useUpdateCheckInItem,
} from '@/src/hooks/useAccountability';
import type { CheckInValueType } from '@/src/services/accountability';

const KEY_PATTERN = /^[a-z][a-z0-9_]*$/;

const VALUE_TYPE_OPTIONS: { value: CheckInValueType; label: string }[] = [
  { value: 'boolean', label: 'Yes/No' },
  { value: 'number', label: 'Number' },
  { value: 'text', label: 'Text' },
];

export default function CheckInItemFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const { credential } = useAccountabilityCredential();
  const { data: items } = useCheckInItems(credential);
  const existing = isNew ? null : items?.find((i) => i.id === id);

  const createItem = useCreateCheckInItem(credential);
  const updateItem = useUpdateCheckInItem(credential);
  const archiveItem = useArchiveCheckInItem(credential);

  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const [valueType, setValueType] = useState<CheckInValueType>('boolean');
  const [hydrated, setHydrated] = useState(isNew);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated || !existing) return;
    void (async () => {
      setKey(existing.key);
      setLabel(existing.label);
      setValueType(existing.valueType);
      setHydrated(true);
    })();
  }, [hydrated, existing]);

  const keyValid = isNew ? KEY_PATTERN.test(key.trim()) : true;
  const canSubmit = label.trim().length > 0 && keyValid && !createItem.isPending && !updateItem.isPending;

  async function handleSubmit() {
    if (!credential || !canSubmit) return;
    setError(null);
    try {
      if (isNew) {
        await createItem.mutateAsync({ key: key.trim(), label: label.trim(), valueType });
      } else if (existing) {
        await updateItem.mutateAsync({ id: existing.id, input: { label: label.trim() } });
      }
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save.');
    }
  }

  async function handleArchive() {
    if (!existing) return;
    await archiveItem.mutateAsync(existing.id);
    router.back();
  }

  if (!credential || (!isNew && !hydrated)) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-950">
        <Text className="text-neutral-500 dark:text-neutral-400">Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white dark:bg-neutral-950" contentContainerClassName="gap-5 px-6 py-6">
      <FormField
        label="Key — lowercase, no spaces (used in your daily summary)"
        value={key}
        onChangeText={setKey}
        editable={isNew}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="water_100oz"
      />
      {isNew && !keyValid && key.length > 0 && (
        <Text className="-mt-3 text-xs text-red-600 dark:text-red-400">
          Lowercase letters, numbers, and underscores only, starting with a letter.
        </Text>
      )}

      <FormField label="Label" value={label} onChangeText={setLabel} placeholder="100oz water" />

      <View>
        <Text className="mb-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">Type</Text>
        <View className="flex-row gap-2">
          {VALUE_TYPE_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => isNew && setValueType(option.value)}
              disabled={!isNew}
              className={`flex-1 rounded-lg border px-3 py-3 ${
                valueType === option.value
                  ? 'border-neutral-900 bg-neutral-900 dark:border-white dark:bg-white'
                  : 'border-neutral-200 dark:border-neutral-800'
              }`}>
              <Text
                className={`text-center text-sm font-medium ${
                  valueType === option.value ? 'text-white dark:text-neutral-900' : 'text-neutral-900 dark:text-white'
                }`}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
        {!isNew && (
          <Text className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
            Key and type can&apos;t change after creation — archive and re-create instead.
          </Text>
        )}
      </View>

      {error && <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text>}

      <Pressable
        onPress={handleSubmit}
        disabled={!canSubmit}
        className={`items-center rounded-full px-8 py-4 ${
          canSubmit ? 'bg-neutral-900 active:opacity-80 dark:bg-white' : 'bg-neutral-300 dark:bg-neutral-800'
        }`}>
        <Text className={`text-base font-semibold ${canSubmit ? 'text-white dark:text-neutral-900' : 'text-neutral-500'}`}>
          {createItem.isPending || updateItem.isPending ? 'Saving…' : 'Save'}
        </Text>
      </Pressable>

      {!isNew && existing && (
        <Pressable
          onPress={handleArchive}
          className="items-center rounded-full border border-red-200 py-4 active:opacity-70 dark:border-red-900">
          <Text className="text-base font-semibold text-red-600 dark:text-red-400">Archive this item</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
