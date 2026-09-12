import { Text, View } from 'react-native';

export default function SettingsScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-2 bg-white px-6 dark:bg-neutral-950">
      <Text className="text-2xl font-bold text-neutral-900 dark:text-white">Settings</Text>
      <Text className="text-center text-neutral-500 dark:text-neutral-400">
        Profile, day types, schedule, and meal presets will be editable here.
      </Text>
    </View>
  );
}
