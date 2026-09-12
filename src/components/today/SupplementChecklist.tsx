import { Pressable, Text, View } from 'react-native';

import type {
  SupplementChecklistItem,
  SupplementDoseStatus,
  SupplementUrgency,
} from '@/src/domain/supplements/timing';

function Checkbox({ status }: { status: SupplementDoseStatus }) {
  if (status === 'taken') {
    return (
      <View className="h-6 w-6 items-center justify-center rounded-full bg-neutral-900 dark:bg-white">
        <Text className="text-xs font-bold text-white dark:text-neutral-900">✓</Text>
      </View>
    );
  }
  if (status === 'skipped') {
    return (
      <View className="h-6 w-6 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700">
        <Text className="text-xs font-bold text-neutral-400 dark:text-neutral-600">–</Text>
      </View>
    );
  }
  return <View className="h-6 w-6 rounded-full border border-neutral-300 dark:border-neutral-700" />;
}

function urgencyLabel(urgency: SupplementUrgency): string | null {
  if (urgency === 'missed_window') return 'missed fasting window';
  if (urgency === 'overdue') return 'overdue';
  return null;
}

export function SupplementChecklist({
  items,
  onSetStatus,
}: {
  items: SupplementChecklistItem[];
  onSetStatus: (supplementId: number, status: SupplementDoseStatus) => void;
}) {
  if (items.length === 0) return null;

  return (
    <View className="gap-1">
      {items.map((item) => {
        const isResolved = item.status !== 'pending';
        const urgency = urgencyLabel(item.urgency);
        return (
          <View
            key={item.supplementId}
            className="flex-row items-center gap-3 border-b border-neutral-100 py-3 dark:border-neutral-900">
            <Pressable
              onPress={() => onSetStatus(item.supplementId, isResolved ? 'pending' : 'taken')}
              hitSlop={8}>
              <Checkbox status={item.status} />
            </Pressable>
            <View className="flex-1">
              <Text
                className={`text-base ${
                  item.status === 'taken'
                    ? 'text-neutral-400 line-through dark:text-neutral-600'
                    : 'text-neutral-900 dark:text-white'
                }`}>
                {item.name}
              </Text>
              <Text
                className={`text-xs ${
                  urgency ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-400 dark:text-neutral-600'
                }`}>
                {item.dosageLabel}
                {urgency ? ` · ${urgency}` : ''}
              </Text>
            </View>
            {!isResolved && (
              <Pressable onPress={() => onSetStatus(item.supplementId, 'skipped')} hitSlop={8}>
                <Text className="text-sm text-neutral-400 dark:text-neutral-600">Skip</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}
