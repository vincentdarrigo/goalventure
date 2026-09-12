import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Settings' }} />
      <Stack.Screen name="day-types/index" options={{ title: 'Day Types' }} />
      <Stack.Screen name="day-types/[id]/index" options={{ title: 'Day Type' }} />
      <Stack.Screen name="day-types/[id]/routine" options={{ title: 'Routine Steps' }} />
      <Stack.Screen name="weekly-schedule/index" options={{ title: 'Weekly Schedule' }} />
      <Stack.Screen name="weekly-schedule/[weekday]" options={{ title: 'Choose Day Type' }} />
      <Stack.Screen name="overrides/index" options={{ title: 'Date Overrides' }} />
      <Stack.Screen name="overrides/new" options={{ title: 'New Override', presentation: 'modal' }} />
    </Stack>
  );
}
