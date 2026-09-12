import { Text, View } from 'react-native';

export default function TodayScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-2 bg-white px-6 dark:bg-neutral-950">
      <Text className="text-2xl font-bold text-neutral-900 dark:text-white">Today</Text>
      <Text className="text-center text-neutral-500 dark:text-neutral-400">
        Eating window, habit stack, and macro progress will live here.
      </Text>
    </View>
  );
}
