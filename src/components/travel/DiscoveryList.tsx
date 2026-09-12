import type { UseQueryResult } from '@tanstack/react-query';
import { Text, View } from 'react-native';

export function DiscoveryList<T>({
  title,
  query,
  renderItem,
  emptyLabel,
}: {
  title: string;
  query: UseQueryResult<T[]>;
  renderItem: (item: T) => { key: string; primary: string; secondary: string };
  emptyLabel: string;
}) {
  return (
    <View className="gap-2">
      <Text className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</Text>

      {query.isLoading && (
        <Text className="text-neutral-500 dark:text-neutral-400">Loading nearby options…</Text>
      )}

      {query.isError && (
        <Text className="text-sm text-red-600 dark:text-red-400">
          Couldn&apos;t load nearby options right now. You can still log manually below.
        </Text>
      )}

      {query.data?.length === 0 && (
        <Text className="text-neutral-500 dark:text-neutral-400">{emptyLabel}</Text>
      )}

      {query.data?.map((item) => {
        const { key, primary, secondary } = renderItem(item);
        return (
          <View
            key={key}
            className="rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
            <Text className="font-medium text-neutral-900 dark:text-white">{primary}</Text>
            <Text className="text-xs text-neutral-500 dark:text-neutral-400">{secondary}</Text>
          </View>
        );
      })}
    </View>
  );
}
