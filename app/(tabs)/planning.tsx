import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { AddPlanEntryPicker } from '@/src/components/planning/AddPlanEntryPicker';
import { PlanEntryCard } from '@/src/components/planning/PlanEntryCard';
import { logFood } from '@/src/db/repositories/foodLogRepo';
import {
  createMealPlanEntry,
  deleteMealPlanEntry,
  markMealPlanEntryLogged,
  type MealPlanEntryRow,
  mealPlanEntriesInRangeQuery,
} from '@/src/db/repositories/mealPlanEntryRepo';
import { ensureDefaultMealSlots, mealSlotsQuery } from '@/src/db/repositories/mealSlotRepo';
import { enumerateDatesInRange, getWeekRange, todayIsoInZone } from '@/src/domain/datetime';
import { resolveDayType } from '@/src/domain/day-type/resolveDayType';
import { useDayTypeContext } from '@/src/hooks/useDayTypeContext';
import type { MealPlanEntryDetails } from '@/src/hooks/useMealPlanEntryDetails';
import { useUserProfile } from '@/src/hooks/useUserProfile';

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-white px-8 dark:bg-neutral-950">
      {children}
    </View>
  );
}

export default function PlanningScreen() {
  const profile = useUserProfile();

  useEffect(() => {
    ensureDefaultMealSlots();
  }, []);

  if (!profile) {
    return (
      <Centered>
        <Text className="text-neutral-500 dark:text-neutral-400">Loading…</Text>
      </Centered>
    );
  }

  return <PlanningContent timezone={profile.timezone} />;
}

function PlanningContent({ timezone }: { timezone: string }) {
  const today = todayIsoInZone(timezone);
  const { start, end } = getWeekRange(today);
  const weekDates = enumerateDatesInRange(start, end);
  const [selectedDate, setSelectedDate] = useState(today);

  const dayTypeContext = useDayTypeContext();
  const { data: slots } = useLiveQuery(mealSlotsQuery());
  const { data: entries } = useLiveQuery(mealPlanEntriesInRangeQuery(selectedDate, selectedDate));
  const [addingToSlotId, setAddingToSlotId] = useState<number | null>(null);

  async function handleAddEntry(slotId: number, source: Parameters<typeof createMealPlanEntry>[0]['source']) {
    const entriesInSlot = entries?.filter((e) => e.mealSlotId === slotId) ?? [];
    await createMealPlanEntry({
      date: selectedDate,
      mealSlotId: slotId,
      quantity: 1,
      order: entriesInSlot.length + 1,
      source,
    });
    setAddingToSlotId(null);
  }

  async function handleLogNow(entry: MealPlanEntryRow, details: MealPlanEntryDetails) {
    if (!dayTypeContext) return;
    try {
      // A plan entry has no specific time, only a date+slot — anchor the log
      // to noon of the PLANNED date (not "now"), so it counts toward that
      // date's totals even if "Log it" is tapped on a different day.
      const dateTime = DateTime.fromISO(selectedDate, { zone: timezone }).set({ hour: 12 });
      const yesterdayIso = DateTime.fromISO(selectedDate, { zone: timezone }).minus({ days: 1 }).toISODate();
      if (!yesterdayIso) return;
      const yesterday = resolveDayType(yesterdayIso, dayTypeContext.weeklySchedule, dayTypeContext.overrides, dayTypeContext.dayTypesById);
      const resolvedToday = resolveDayType(selectedDate, dayTypeContext.weeklySchedule, dayTypeContext.overrides, dayTypeContext.dayTypesById);

      const logged = await logFood({
        dateTime,
        description: details.description,
        calories: details.calories,
        proteinG: details.proteinG,
        sourcePresetId: details.sourcePresetId,
        sourceIngredientId: details.sourceIngredientId,
        sourceStackId: details.sourceStackId,
        yesterday,
        today: resolvedToday,
      });
      await markMealPlanEntryLogged(entry.id, logged.id);
    } catch (e) {
      Alert.alert('Couldn’t log that', e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <View className="flex-1 bg-white pt-16 dark:bg-neutral-950">
      <Text className="px-6 pb-2 text-2xl font-bold text-neutral-900 dark:text-white">Plan</Text>

      <View className="flex-row gap-1 px-4 pb-3">
        {weekDates.map((date) => {
          const label = DateTime.fromISO(date, { zone: timezone }).toFormat('ccc d');
          const isSelected = date === selectedDate;
          return (
            <Pressable
              key={date}
              onPress={() => setSelectedDate(date)}
              className={`flex-1 items-center rounded-lg py-2 ${
                isSelected ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-100 dark:bg-neutral-900'
              }`}>
              <Text
                className={`text-xs font-medium ${
                  isSelected ? 'text-white dark:text-neutral-900' : 'text-neutral-600 dark:text-neutral-300'
                }`}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView className="flex-1 px-6" contentContainerClassName="gap-5 pb-12">
        {slots?.map((slot) => {
          const slotEntries = entries?.filter((e) => e.mealSlotId === slot.id) ?? [];
          return (
            <View key={slot.id} className="gap-2">
              <Text className="text-lg font-semibold text-neutral-900 dark:text-white">{slot.name}</Text>
              {slotEntries.length === 0 && (
                <Text className="text-sm text-neutral-400 dark:text-neutral-600">Nothing planned</Text>
              )}
              {slotEntries.map((entry) => (
                <PlanEntryCard
                  key={entry.id}
                  entry={entry}
                  onLogNow={handleLogNow}
                  onRemove={deleteMealPlanEntry}
                />
              ))}
              {addingToSlotId === slot.id ? (
                <AddPlanEntryPicker
                  onSelect={(source) => handleAddEntry(slot.id, source)}
                  onCancel={() => setAddingToSlotId(null)}
                />
              ) : (
                <Pressable
                  onPress={() => setAddingToSlotId(slot.id)}
                  className="items-center rounded-lg border border-dashed border-neutral-300 py-2 dark:border-neutral-700">
                  <Text className="text-sm text-neutral-500 dark:text-neutral-400">+ Add</Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
