import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ListRow } from '@/src/components/settings/ListRow';
import { FormField } from '@/src/components/shared/FormField';
import {
  createRoutineStep,
  deleteRoutineStep,
  type RoutineStepRow,
  routineStepsByDayTypeQuery,
  updateRoutineStep,
} from '@/src/db/repositories/routineStepRepo';

export default function DayTypeRoutineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dayTypeId = Number(id);
  const { data: steps } = useLiveQuery(routineStepsByDayTypeQuery(dayTypeId));

  const [editingId, setEditingId] = useState<number | 'new' | null>(null);

  return (
    <ScrollView className="flex-1 bg-white dark:bg-neutral-950">
      {steps?.length === 0 && editingId !== 'new' && (
        <Text className="px-4 py-6 text-center text-neutral-500 dark:text-neutral-400">
          No routine steps yet. Add the first one below.
        </Text>
      )}
      {steps?.map((step) =>
        editingId === step.id ? (
          <StepForm
            key={step.id}
            dayTypeId={dayTypeId}
            step={step}
            onDone={() => setEditingId(null)}
          />
        ) : (
          <ListRow
            key={step.id}
            title={step.label}
            subtitle={[step.scheduledTime, step.category].filter(Boolean).join(' · ') || undefined}
            onPress={() => setEditingId(step.id)}
          />
        )
      )}
      {editingId === 'new' ? (
        <StepForm
          dayTypeId={dayTypeId}
          defaultOrder={(steps?.length ?? 0) + 1}
          onDone={() => setEditingId(null)}
        />
      ) : (
        <Pressable
          onPress={() => setEditingId('new')}
          className="m-4 items-center rounded-full bg-neutral-900 py-4 active:opacity-80 dark:bg-white">
          <Text className="text-base font-semibold text-white dark:text-neutral-900">
            Add Step
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function StepForm({
  dayTypeId,
  step,
  defaultOrder,
  onDone,
}: {
  dayTypeId: number;
  step?: RoutineStepRow;
  defaultOrder?: number;
  onDone: () => void;
}) {
  const [label, setLabel] = useState(step?.label ?? '');
  const [scheduledTime, setScheduledTime] = useState(step?.scheduledTime ?? '');
  const [order, setOrder] = useState(String(step?.order ?? defaultOrder ?? 1));
  const [category, setCategory] = useState(step?.category ?? '');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = label.trim().length > 0 && !submitting;

  async function handleSave() {
    if (!canSubmit) return;
    setSubmitting(true);
    const input = {
      dayTypeId,
      label: label.trim(),
      scheduledTime: scheduledTime.trim() || null,
      order: Number(order) || 1,
      category: category.trim() || null,
    };
    if (step) {
      await updateRoutineStep(step.id, input);
    } else {
      await createRoutineStep(input);
    }
    onDone();
  }

  async function handleDelete() {
    if (step) await deleteRoutineStep(step.id);
    onDone();
  }

  return (
    <View className="gap-3 border-b border-neutral-100 px-4 py-4 dark:border-neutral-900">
      <FormField label="Label" value={label} onChangeText={setLabel} placeholder="Fasted Workout" />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField
            label="Time (HH:mm) — optional"
            value={scheduledTime}
            onChangeText={setScheduledTime}
            placeholder="06:00"
          />
        </View>
        <View className="flex-1">
          <FormField label="Order" value={order} onChangeText={setOrder} keyboardType="number-pad" />
        </View>
      </View>
      <FormField
        label="Category — optional"
        value={category}
        onChangeText={setCategory}
        placeholder="workout"
      />
      <View className="flex-row gap-2">
        <Pressable
          onPress={handleSave}
          disabled={!canSubmit}
          className={`flex-1 items-center rounded-full py-3 ${
            canSubmit ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-300 dark:bg-neutral-800'
          }`}>
          <Text
            className={`font-semibold ${
              canSubmit ? 'text-white dark:text-neutral-900' : 'text-neutral-500'
            }`}>
            Save
          </Text>
        </Pressable>
        {step && (
          <Pressable
            onPress={handleDelete}
            className="flex-1 items-center rounded-full border border-red-200 py-3 dark:border-red-900">
            <Text className="font-semibold text-red-600 dark:text-red-400">Delete</Text>
          </Pressable>
        )}
        <Pressable
          onPress={onDone}
          className="flex-1 items-center rounded-full border border-neutral-200 py-3 dark:border-neutral-800">
          <Text className="font-semibold text-neutral-700 dark:text-neutral-300">Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}
