import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ListRow } from '@/src/components/settings/ListRow';
import { useAccountabilityCredential, useCheckInItems } from '@/src/hooks/useAccountability';

const VALUE_TYPE_LABEL: Record<string, string> = { boolean: 'Yes/No', number: 'Number', text: 'Text' };

export default function CheckInItemsScreen() {
  const { status, credential } = useAccountabilityCredential();
  const { data } = useCheckInItems(credential);

  if (status !== 'ready' || !credential) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-950">
        <Text className="text-neutral-500 dark:text-neutral-400">Loading…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-neutral-950">
      <ScrollView>
        {data?.length === 0 && (
          <Text className="px-4 py-6 text-center text-neutral-500 dark:text-neutral-400">
            No check-in items yet. Add one, like &quot;100oz water&quot; or &quot;Kitchen closed by 4pm&quot;.
          </Text>
        )}
        {data?.map((item) => (
          <ListRow
            key={item.id}
            title={item.label}
            subtitle={`${item.key} · ${VALUE_TYPE_LABEL[item.valueType]}`}
            onPress={() => router.push(`/settings/accountability/check-in-items/${item.id}`)}
          />
        ))}
      </ScrollView>
      <Pressable
        onPress={() => router.push('/settings/accountability/check-in-items/new')}
        className="m-4 items-center rounded-full bg-neutral-900 py-4 active:opacity-80 dark:bg-white">
        <Text className="text-base font-semibold text-white dark:text-neutral-900">Add Check-In Item</Text>
      </Pressable>
    </View>
  );
}
