import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

export function ListRow({
  title,
  subtitle,
  onPress,
  right,
}: {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between border-b border-neutral-100 px-4 py-4 active:bg-neutral-50 dark:border-neutral-900 dark:active:bg-neutral-900">
      <View className="flex-1">
        <Text className="text-base font-medium text-neutral-900 dark:text-white">{title}</Text>
        {subtitle && (
          <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</Text>
        )}
      </View>
      {right ?? <Text className="text-neutral-300 dark:text-neutral-700">›</Text>}
    </Pressable>
  );
}
