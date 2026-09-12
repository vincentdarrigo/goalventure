import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { FormField } from '@/src/components/shared/FormField';
import { updateUserProfile } from '@/src/db/repositories/userProfileRepo';
import { useUserProfile } from '@/src/hooks/useUserProfile';

export default function ProfileSettingsScreen() {
  const profile = useUserProfile();

  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [hydrationGoalOz, setHydrationGoalOz] = useState('');
  const [alcoholRule, setAlcoholRule] = useState('');
  const [healthFocus, setHealthFocus] = useState('');
  const [palateNotes, setPalateNotes] = useState('');
  const [units, setUnits] = useState<'imperial' | 'metric'>('imperial');
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill exactly once, the first time the live-queried row arrives — the
  // fields below are then locally controlled, same as every other edit
  // screen in Settings, so live updates elsewhere don't clobber in-progress typing.
  useEffect(() => {
    if (hydrated || !profile) return;
    // Deferred to a microtask (rather than called synchronously in the
    // effect body) so this hydrate-once prefill doesn't trigger a
    // synchronous cascading render — same idiom as supplements/[id].tsx.
    void (async () => {
      setCurrentWeight(profile.currentWeight != null ? String(profile.currentWeight) : '');
      setTargetWeight(profile.targetWeight != null ? String(profile.targetWeight) : '');
      setHydrationGoalOz(String(profile.hydrationGoalOz));
      setAlcoholRule(profile.alcoholRule ?? '');
      setHealthFocus(profile.healthFocus ?? '');
      setPalateNotes(profile.palateNotes ?? '');
      setUnits(profile.units);
      setHydrated(true);
    })();
  }, [hydrated, profile]);

  const canSubmit = Number(hydrationGoalOz) > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit || !profile) return;
    setSubmitting(true);
    setError(null);
    setSaved(false);
    try {
      await updateUserProfile(profile.id, {
        currentWeight: currentWeight ? Number(currentWeight) : null,
        targetWeight: targetWeight ? Number(targetWeight) : null,
        hydrationGoalOz: Number(hydrationGoalOz),
        alcoholRule: alcoholRule.trim() || null,
        healthFocus: healthFocus.trim() || null,
        palateNotes: palateNotes.trim() || null,
        units,
      });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated || !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-950">
        <Text className="text-neutral-500 dark:text-neutral-400">Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white dark:bg-neutral-950" contentContainerClassName="gap-5 px-6 py-6">
      <View>
        <Text className="mb-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">Units</Text>
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
                  units === option ? 'text-white dark:text-neutral-900' : 'text-neutral-900 dark:text-white'
                }`}>
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FormField
        label={`Current weight (${units === 'imperial' ? 'lb' : 'kg'}) — optional`}
        value={currentWeight}
        onChangeText={setCurrentWeight}
        keyboardType="decimal-pad"
        placeholder="265"
      />

      <FormField
        label={`Target weight (${units === 'imperial' ? 'lb' : 'kg'}) — optional`}
        value={targetWeight}
        onChangeText={setTargetWeight}
        keyboardType="decimal-pad"
        placeholder="200"
      />

      <FormField
        label={`Daily hydration goal (${units === 'imperial' ? 'oz' : 'mL'})`}
        value={hydrationGoalOz}
        onChangeText={setHydrationGoalOz}
        keyboardType="decimal-pad"
        placeholder="100"
      />

      <FormField label="Alcohol rule — optional" value={alcoholRule} onChangeText={setAlcoholRule} placeholder="Strict: 0" />

      <FormField
        label="Health focus — optional"
        value={healthFocus}
        onChangeText={setHealthFocus}
        placeholder="Shoulder/back stability, vascular recovery"
        multiline
      />

      <FormField
        label="Palate notes — optional"
        value={palateNotes}
        onChangeText={setPalateNotes}
        placeholder="Simple/repeatable: chicken, beef, potatoes"
        multiline
      />

      {error && <Text className="text-sm text-red-600 dark:text-red-400">{error}</Text>}
      {saved && !error && <Text className="text-sm text-emerald-600 dark:text-emerald-400">Saved.</Text>}

      <Pressable
        onPress={handleSubmit}
        disabled={!canSubmit}
        className={`items-center rounded-full px-8 py-4 ${
          canSubmit ? 'bg-neutral-900 active:opacity-80 dark:bg-white' : 'bg-neutral-300 dark:bg-neutral-800'
        }`}>
        <Text className={`text-base font-semibold ${canSubmit ? 'text-white dark:text-neutral-900' : 'text-neutral-500'}`}>
          {submitting ? 'Saving…' : 'Save'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
