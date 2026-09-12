import { router } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { createUserProfile } from '@/src/db/repositories/userProfileRepo';
import { deviceTimezone } from '@/src/lib/datetime';

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <Text className="mb-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">
      {children}
    </Text>
  );
}

const inputClassName =
  'rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white';

export default function OnboardingProfileScreen() {
  const [timezone, setTimezone] = useState(deviceTimezone());
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [hydrationGoalOz, setHydrationGoalOz] = useState('100');
  const [units, setUnits] = useState<'imperial' | 'metric'>('imperial');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = timezone.trim().length > 0 && Number(hydrationGoalOz) > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await createUserProfile({
        timezone: timezone.trim(),
        currentWeight: currentWeight ? Number(currentWeight) : null,
        targetWeight: targetWeight ? Number(targetWeight) : null,
        hydrationGoalOz: Number(hydrationGoalOz),
        units,
      });
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save profile.');
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-neutral-950"
      contentContainerClassName="gap-5 px-6 pb-12 pt-16">
      <Text className="text-2xl font-bold text-neutral-900 dark:text-white">Your profile</Text>

      <View>
        <FieldLabel>Units</FieldLabel>
        <View className="flex-row gap-2">
          {(['imperial', 'metric'] as const).map((option) => (
            <Pressable
              key={option}
              onPress={() => setUnits(option)}
              className={`flex-1 rounded-lg border px-4 py-3 ${
                units === option
                  ? 'border-neutral-900 bg-neutral-900 dark:border-white dark:bg-white'
                  : 'border-neutral-200 dark:border-neutral-800'
              }`}>
              <Text
                className={`text-center font-medium capitalize ${
                  units === option
                    ? 'text-white dark:text-neutral-900'
                    : 'text-neutral-900 dark:text-white'
                }`}>
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View>
        <FieldLabel>Timezone</FieldLabel>
        <TextInput
          value={timezone}
          onChangeText={setTimezone}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="America/Chicago"
          className={inputClassName}
        />
      </View>

      <View>
        <FieldLabel>Current weight ({units === 'imperial' ? 'lb' : 'kg'}) — optional</FieldLabel>
        <TextInput
          value={currentWeight}
          onChangeText={setCurrentWeight}
          keyboardType="decimal-pad"
          placeholder="265"
          className={inputClassName}
        />
      </View>

      <View>
        <FieldLabel>Target weight ({units === 'imperial' ? 'lb' : 'kg'}) — optional</FieldLabel>
        <TextInput
          value={targetWeight}
          onChangeText={setTargetWeight}
          keyboardType="decimal-pad"
          placeholder="200"
          className={inputClassName}
        />
      </View>

      <View>
        <FieldLabel>Daily hydration goal ({units === 'imperial' ? 'oz' : 'mL'})</FieldLabel>
        <TextInput
          value={hydrationGoalOz}
          onChangeText={setHydrationGoalOz}
          keyboardType="decimal-pad"
          placeholder="100"
          className={inputClassName}
        />
      </View>

      {error && <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text>}

      <Pressable
        onPress={handleSubmit}
        disabled={!canSubmit}
        className={`mt-2 items-center rounded-full px-8 py-4 ${
          canSubmit ? 'bg-neutral-900 active:opacity-80 dark:bg-white' : 'bg-neutral-300 dark:bg-neutral-800'
        }`}>
        <Text
          className={`text-base font-semibold ${
            canSubmit ? 'text-white dark:text-neutral-900' : 'text-neutral-500'
          }`}>
          {submitting ? 'Saving…' : 'Save and continue'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
