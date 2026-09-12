import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/components/useColorScheme';
import { useDbMigrations } from '@/src/db/migrate';
import { useHasProfile } from '@/src/hooks/useHasProfile';
import { queryClient } from '@/src/lib/queryClient';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function CenteredMessage({ text }: { text: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-white px-8 dark:bg-neutral-950">
      <Text className="text-center text-neutral-500 dark:text-neutral-400">{text}</Text>
    </View>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <MigrationGate />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

function MigrationGate() {
  const { success, error } = useDbMigrations();

  if (error) {
    return <CenteredMessage text={`Couldn't set up the local database: ${error.message}`} />;
  }
  if (!success) {
    return <CenteredMessage text="Setting up…" />;
  }
  return <ProfileGate />;
}

function ProfileGate() {
  const colorScheme = useColorScheme();
  const hasProfile = useHasProfile();

  if (hasProfile === undefined) {
    return <CenteredMessage text="Loading…" />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Protected guard={hasProfile}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={!hasProfile}>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
