import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { resetAllData } from '@/src/db/reset';

export default function DataScreen() {
  const [resetting, setResetting] = useState(false);

  function confirmReset() {
    Alert.alert(
      'Reset all data?',
      'This permanently deletes your profile, schedule, presets, and logs. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: handleReset },
      ]
    );
  }

  async function handleReset() {
    setResetting(true);
    try {
      await resetAllData();
    } catch (e) {
      Alert.alert('Couldn’t reset data', e instanceof Error ? e.message : String(e));
      setResetting(false);
    }
  }

  return (
    <View className="flex-1 gap-4 bg-white px-6 py-6 dark:bg-neutral-950">
      <Text className="text-sm text-neutral-500 dark:text-neutral-400">
        For development and QA: wipes everything on this device — profile, day types, schedule,
        overrides, routine steps, meal presets/stacks, and every log — and returns you to
        onboarding. There is no cloud backup, so this cannot be undone.
      </Text>
      <Pressable
        onPress={confirmReset}
        disabled={resetting}
        className="items-center rounded-full border border-red-200 py-4 active:opacity-70 dark:border-red-900">
        <Text className="text-base font-semibold text-red-600 dark:text-red-400">
          {resetting ? 'Resetting…' : 'Reset all data'}
        </Text>
      </Pressable>
    </View>
  );
}
