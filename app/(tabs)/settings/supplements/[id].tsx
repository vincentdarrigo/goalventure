import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { FormField } from '@/src/components/shared/FormField';
import {
  archiveSupplement,
  createSupplement,
  supplementByIdQuery,
  updateSupplement,
} from '@/src/db/repositories/supplementRepo';

type Timing = 'fasted' | 'with_meal' | 'bedtime' | 'pre_workout' | 'specific_time';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const TIMING_OPTIONS: { value: Timing; label: string }[] = [
  { value: 'fasted', label: 'Fasted' },
  { value: 'with_meal', label: 'With meal' },
  { value: 'bedtime', label: 'Bedtime' },
  { value: 'pre_workout', label: 'Pre-workout' },
  { value: 'specific_time', label: 'Specific time' },
];

export default function SupplementFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const supplementId = isNew ? null : Number(id);

  const [loaded, setLoaded] = useState(isNew);
  const [name, setName] = useState('');
  const [dosageAmount, setDosageAmount] = useState('');
  const [dosageUnit, setDosageUnit] = useState('');
  const [timing, setTiming] = useState<Timing>('with_meal');
  const [specificTime, setSpecificTime] = useState('08:00');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isNew || supplementId === null) return;
    let cancelled = false;
    (async () => {
      const rows = await supplementByIdQuery(supplementId);
      const row = rows[0];
      if (!row || cancelled) return;
      setName(row.name);
      setDosageAmount(String(row.dosageAmount));
      setDosageUnit(row.dosageUnit);
      setTiming(row.timing);
      if (row.specificTime) setSpecificTime(row.specificTime);
      setNotes(row.notes ?? '');
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [isNew, supplementId]);

  const timeFieldValid = timing !== 'specific_time' || TIME_PATTERN.test(specificTime);
  const canSubmit =
    name.trim().length > 0 &&
    dosageUnit.trim().length > 0 &&
    Number.isFinite(Number(dosageAmount)) &&
    timeFieldValid &&
    !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const input = {
        name: name.trim(),
        dosageAmount: Number(dosageAmount),
        dosageUnit: dosageUnit.trim(),
        timing,
        specificTime: timing === 'specific_time' ? specificTime : null,
        notes: notes.trim() || null,
      };
      if (isNew) {
        await createSupplement(input);
      } else if (supplementId !== null) {
        await updateSupplement(supplementId, input);
      }
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save.');
      setSubmitting(false);
    }
  }

  async function handleArchive() {
    if (supplementId === null) return;
    await archiveSupplement(supplementId);
    router.back();
  }

  if (!loaded) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-950">
        <Text className="text-neutral-500 dark:text-neutral-400">Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-neutral-950"
      contentContainerClassName="gap-5 px-6 py-6">
      <FormField label="Name" value={name} onChangeText={setName} placeholder="Magnesium Glycinate" />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField
            label="Dosage amount"
            value={dosageAmount}
            onChangeText={setDosageAmount}
            keyboardType="decimal-pad"
            placeholder="300"
          />
        </View>
        <View className="flex-1">
          <FormField label="Unit" value={dosageUnit} onChangeText={setDosageUnit} placeholder="mg" />
        </View>
      </View>

      <View>
        <Text className="mb-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">Timing</Text>
        <View className="flex-row flex-wrap gap-2">
          {TIMING_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setTiming(option.value)}
              className={`rounded-full border px-3 py-2 ${
                timing === option.value
                  ? 'border-neutral-900 bg-neutral-900 dark:border-white dark:bg-white'
                  : 'border-neutral-200 dark:border-neutral-800'
              }`}>
              <Text
                className={`text-sm font-medium ${
                  timing === option.value
                    ? 'text-white dark:text-neutral-900'
                    : 'text-neutral-900 dark:text-white'
                }`}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {timing === 'specific_time' && (
        <FormField
          label="Time (HH:mm)"
          value={specificTime}
          onChangeText={setSpecificTime}
          placeholder="07:00"
        />
      )}

      <FormField
        label="Notes — optional"
        value={notes}
        onChangeText={setNotes}
        placeholder="Take with water"
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
          {submitting ? 'Saving…' : 'Save'}
        </Text>
      </Pressable>

      {!isNew && (
        <Pressable
          onPress={handleArchive}
          className="items-center rounded-full border border-red-200 py-4 active:opacity-70 dark:border-red-900">
          <Text className="text-base font-semibold text-red-600 dark:text-red-400">
            Archive this supplement
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
