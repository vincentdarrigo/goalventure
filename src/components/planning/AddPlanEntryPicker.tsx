import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ingredientsQuery } from '@/src/db/repositories/ingredientRepo';
import { mealPresetsQuery } from '@/src/db/repositories/mealPresetRepo';
import { mealStacksQuery } from '@/src/db/repositories/mealStackRepo';
import type { MealPlanEntrySource } from '@/src/db/repositories/mealPlanEntryRepo';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-1">
      <Text className="text-xs font-medium uppercase text-neutral-400 dark:text-neutral-600">
        {title}
      </Text>
      {children}
    </View>
  );
}

function Row({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <Text className="text-neutral-900 dark:text-white">{label}</Text>
    </Pressable>
  );
}

export function AddPlanEntryPicker({
  onSelect,
  onCancel,
}: {
  onSelect: (source: MealPlanEntrySource) => void;
  onCancel: () => void;
}) {
  const { data: presets } = useLiveQuery(mealPresetsQuery());
  const { data: stacks } = useLiveQuery(mealStacksQuery());
  const { data: ingredients } = useLiveQuery(ingredientsQuery());

  return (
    <ScrollView className="max-h-96 gap-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
      {stacks && stacks.length > 0 && (
        <Section title="Meal stacks">
          {stacks.map((s) => (
            <Row key={`stack-${s.id}`} label={s.name} onPress={() => onSelect({ kind: 'stack', mealStackId: s.id })} />
          ))}
        </Section>
      )}
      {presets && presets.length > 0 && (
        <Section title="Meal presets">
          {presets.map((p) => (
            <Row
              key={`preset-${p.id}`}
              label={p.name}
              onPress={() => onSelect({ kind: 'preset', mealPresetId: p.id })}
            />
          ))}
        </Section>
      )}
      {ingredients && ingredients.length > 0 && (
        <Section title="Pantry ingredients">
          {ingredients.map((i) => (
            <Row
              key={`ingredient-${i.id}`}
              label={i.name}
              onPress={() => onSelect({ kind: 'ingredient', ingredientId: i.id })}
            />
          ))}
        </Section>
      )}
      {(presets?.length ?? 0) === 0 && (stacks?.length ?? 0) === 0 && (ingredients?.length ?? 0) === 0 && (
        <Text className="text-neutral-500 dark:text-neutral-400">
          Nothing to add yet — create a meal preset or pantry ingredient first.
        </Text>
      )}
      <Pressable onPress={onCancel} className="items-center py-2">
        <Text className="text-neutral-500 dark:text-neutral-400">Cancel</Text>
      </Pressable>
    </ScrollView>
  );
}
