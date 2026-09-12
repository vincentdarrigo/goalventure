import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function OnboardingWelcomeScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-white px-8 dark:bg-neutral-950">
      <Text className="text-center text-3xl font-bold text-neutral-900 dark:text-white">
        Welcome to BetterLife
      </Text>
      <Text className="text-center text-neutral-500 dark:text-neutral-400">
        Let&apos;s set up your profile. Everything here is yours to change later in Settings.
      </Text>
      <Pressable
        onPress={() => router.push('/onboarding/profile')}
        className="mt-4 rounded-full bg-neutral-900 px-8 py-3 active:opacity-80 dark:bg-white">
        <Text className="text-base font-semibold text-white dark:text-neutral-900">
          Get started
        </Text>
      </Pressable>
    </View>
  );
}
