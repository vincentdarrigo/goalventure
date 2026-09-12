import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { FormField } from '@/src/components/shared/FormField';
import {
  archiveDayType,
  createDayType,
  dayTypeByIdQuery,
  updateDayType,
} from '@/src/db/repositories/dayTypeRepo';

type WindowKind = 'timed' | 'flexible' | 'fasting';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const WINDOW_KIND_LABEL: Record<WindowKind, string> = {
  timed: 'Timed',
  flexible: 'Flexible',
  fasting: 'Fast day',
};

export default function DayTypeFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const dayTypeId = isNew ? null : Number(id);

  const [loaded, setLoaded] = useState(isNew);
  const [name, setName] = useState('');
  const [windowKind, setWindowKind] = useState<WindowKind>('timed');
  const [eatingWindowStart, setEatingWindowStart] = useState('08:00');
  const [eatingWindowEnd, setEatingWindowEnd] = useState('16:00');
  const [calorieTarget, setCalorieTarget] = useState('2000');
  const [proteinTarget, setProteinTarget] = useState('150');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isNew || dayTypeId === null) return;
    let cancelled = false;
    (async () => {
      const rows = await dayTypeByIdQuery(dayTypeId);
      const row = rows[0];
      if (!row || cancelled) return;
      setName(row.name);
      setWindowKind(
        row.isFastDay ? 'fasting' : !row.eatingWindowStart || !row.eatingWindowEnd ? 'flexible' : 'timed'
      );
      if (row.eatingWindowStart) setEatingWindowStart(row.eatingWindowStart);
      if (row.eatingWindowEnd) setEatingWindowEnd(row.eatingWindowEnd);
      setCalorieTarget(String(row.calorieTarget));
      setProteinTarget(String(row.proteinTarget));
      setNotes(row.notes ?? '');
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [isNew, dayTypeId]);

  const windowFieldsValid =
    windowKind !== 'timed' || (TIME_PATTERN.test(eatingWindowStart) && TIME_PATTERN.test(eatingWindowEnd));
  const canSubmit =
    name.trim().length > 0 &&
    windowFieldsValid &&
    Number.isFinite(Number(calorieTarget)) &&
    Number.isFinite(Number(proteinTarget)) &&
    !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const input = {
        name: name.trim(),
        isFastDay: windowKind === 'fasting',
        eatingWindowStart: windowKind === 'timed' ? eatingWindowStart : null,
        eatingWindowEnd: windowKind === 'timed' ? eatingWindowEnd : null,
        calorieTarget: Number(calorieTarget),
        proteinTarget: Number(proteinTarget),
        notes: notes.trim() || null,
      };
      if (isNew) {
        await createDayType(input);
      } else if (dayTypeId !== null) {
        await updateDayType(dayTypeId, input);
      }
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save.');
      setSubmitting(false);
    }
  }

  async function handleArchive() {
    if (dayTypeId === null) return;
    await archiveDayType(dayTypeId);
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
      <FormField label="Name" value={name} onChangeText={setName} placeholder="Go-To 16/8" />

      <View>
        <Text className="mb-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">
          Eating window
        </Text>
        <View className="flex-row gap-2">
          {(['timed', 'flexible', 'fasting'] as const).map((kind) => (
            <Pressable
              key={kind}
              onPress={() => setWindowKind(kind)}
              className={`flex-1 rounded-lg border px-3 py-3 ${
                windowKind === kind
                  ? 'border-neutral-900 bg-neutral-900 dark:border-white dark:bg-white'
                  : 'border-neutral-200 dark:border-neutral-800'
              }`}>
              <Text
                className={`text-center text-sm font-medium ${
                  windowKind === kind
                    ? 'text-white dark:text-neutral-900'
                    : 'text-neutral-900 dark:text-white'
                }`}>
                {WINDOW_KIND_LABEL[kind]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {windowKind === 'timed' && (
        <View className="flex-row gap-3">
          <View className="flex-1">
            <FormField
              label="Start (HH:mm)"
              value={eatingWindowStart}
              onChangeText={setEatingWindowStart}
              placeholder="08:00"
            />
          </View>
          <View className="flex-1">
            <FormField
              label="End (HH:mm)"
              value={eatingWindowEnd}
              onChangeText={setEatingWindowEnd}
              placeholder="16:00"
            />
          </View>
        </View>
      )}

      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField
            label="Calorie target"
            value={calorieTarget}
            onChangeText={setCalorieTarget}
            keyboardType="number-pad"
          />
        </View>
        <View className="flex-1">
          <FormField
            label="Protein target (g)"
            value={proteinTarget}
            onChangeText={setProteinTarget}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <FormField
        label="Notes — optional"
        value={notes}
        onChangeText={setNotes}
        placeholder="Bulk-prep closer"
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
            Archive this day type
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
