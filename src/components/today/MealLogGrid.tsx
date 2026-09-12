import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';
import { Pressable, Text, View } from 'react-native';

import { mealPresetIngredientItemsQuery } from '@/src/db/repositories/mealPresetIngredientRepo';
import { type MealPresetRow, mealPresetsQuery } from '@/src/db/repositories/mealPresetRepo';
import { mealStackItemsQuery, mealStacksQuery, type MealStackRow } from '@/src/db/repositories/mealStackRepo';
import { computeStackTotals } from '@/src/domain/nutrition/mealStack';
import type { LogMealInput } from '@/src/hooks/useLogMeal';

function Card({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="min-w-[45%] flex-1 rounded-xl border border-neutral-200 px-4 py-3 active:opacity-70 dark:border-neutral-800">
      <Text className="font-medium text-neutral-900 dark:text-white" numberOfLines={1}>
        {title}
      </Text>
      <Text className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</Text>
    </Pressable>
  );
}

function FlatPresetCard({
  preset,
  onLog,
}: {
  preset: MealPresetRow;
  onLog: (input: LogMealInput) => void;
}) {
  return (
    <Card
      title={preset.name}
      subtitle={`${preset.calories} kcal · ${preset.proteinG}g`}
      onPress={() =>
        onLog({
          description: preset.name,
          calories: preset.calories,
          proteinG: preset.proteinG,
          sourcePresetId: preset.id,
        })
      }
    />
  );
}

/** A composed preset's nutrition is always computed live from its current ingredients. */
function ComposedPresetCard({
  preset,
  onLog,
}: {
  preset: MealPresetRow;
  onLog: (input: LogMealInput) => void;
}) {
  const { data: items } = useLiveQuery(mealPresetIngredientItemsQuery(preset.id));
  if (!items || items.length === 0) return null;

  const totals = computeStackTotals(items);
  return (
    <Card
      title={preset.name}
      subtitle={`${Math.round(totals.calories)} kcal · ${Math.round(totals.proteinG * 10) / 10}g`}
      onPress={() =>
        onLog({
          description: preset.name,
          calories: totals.calories,
          proteinG: totals.proteinG,
          sourcePresetId: preset.id,
        })
      }
    />
  );
}

function StackCard({ stack, onLog }: { stack: MealStackRow; onLog: (input: LogMealInput) => void }) {
  const { data: items } = useLiveQuery(mealStackItemsQuery(stack.id));
  if (!items || items.length === 0) return null;

  const totals = computeStackTotals(items);
  return (
    <Card
      title={stack.name}
      subtitle={`${totals.calories} kcal · ${totals.proteinG}g`}
      onPress={() =>
        onLog({
          description: stack.name,
          calories: totals.calories,
          proteinG: totals.proteinG,
          sourceStackId: stack.id,
        })
      }
    />
  );
}

export function MealLogGrid({ onLog }: { onLog: (input: LogMealInput) => void }) {
  const { data: presets } = useLiveQuery(mealPresetsQuery());
  const { data: stacks } = useLiveQuery(mealStacksQuery());

  if ((presets?.length ?? 0) === 0 && (stacks?.length ?? 0) === 0) {
    return (
      <Text className="text-sm text-neutral-500 dark:text-neutral-400">
        No meal presets yet — add some in Settings › Meal Presets to log meals in one tap.
      </Text>
    );
  }

  return (
    <View className="flex-row flex-wrap gap-2">
      {stacks?.map((stack) => <StackCard key={`stack-${stack.id}`} stack={stack} onLog={onLog} />)}
      {presets?.map((preset) =>
        preset.isComposed ? (
          <ComposedPresetCard key={`preset-${preset.id}`} preset={preset} onLog={onLog} />
        ) : (
          <FlatPresetCard key={`preset-${preset.id}`} preset={preset} onLog={onLog} />
        )
      )}
    </View>
  );
}
