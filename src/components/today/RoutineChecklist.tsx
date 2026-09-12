import { Pressable, Text, View } from 'react-native';

import type { TodayRoutineStep } from '@/src/hooks/useTodayRoutine';
import type { RoutineStepStatus } from '@/src/domain/routine/nextStep';

function Checkbox({ status }: { status: RoutineStepStatus }) {
  if (status === 'completed') {
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

export function RoutineChecklist({
  steps,
  onSetStatus,
}: {
  steps: TodayRoutineStep[];
  onSetStatus: (stepId: number, status: RoutineStepStatus) => void;
}) {
  if (steps.length === 0) return null;

  return (
    <View className="gap-1">
      {steps.map((step) => {
        const isResolved = step.status === 'completed' || step.status === 'skipped';
        return (
          <View
            key={step.id}
            className="flex-row items-center gap-3 border-b border-neutral-100 py-3 dark:border-neutral-900">
            <Pressable
              onPress={() => onSetStatus(step.id, isResolved ? 'pending' : 'completed')}
              hitSlop={8}>
              <Checkbox status={step.status} />
            </Pressable>
            <View className="flex-1">
              <Text
                className={`text-base ${
                  step.status === 'completed'
                    ? 'text-neutral-400 line-through dark:text-neutral-600'
                    : 'text-neutral-900 dark:text-white'
                }`}>
                {step.label}
              </Text>
              {step.scheduledTime && (
                <Text className="text-xs text-neutral-400 dark:text-neutral-600">
                  {step.scheduledTime}
                </Text>
              )}
            </View>
            {!isResolved && (
              <Pressable onPress={() => onSetStatus(step.id, 'skipped')} hitSlop={8}>
                <Text className="text-sm text-neutral-400 dark:text-neutral-600">Skip</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}
