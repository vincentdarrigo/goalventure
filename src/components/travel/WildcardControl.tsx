import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';
import { Pressable, Text, View } from 'react-native';

import { dayTypesQuery } from '@/src/db/repositories/dayTypeRepo';
import { dateOverridesQuery, removeDateOverride, setDateOverride } from '@/src/db/repositories/dateOverrideRepo';
import type { ResolvedDayType } from '@/src/domain/types';

/**
 * Switches TODAY only to a different day type via a DateOverride row — the
 * recurring weeklySchedule mapping is never touched, so e.g. next Tuesday
 * still resolves to the regular Fast day even after activating a one-off
 * Wildcard override today.
 */
export function WildcardControl({ today }: { today: ResolvedDayType }) {
  const { data: dayTypes } = useLiveQuery(dayTypesQuery());
  const { data: overrides } = useLiveQuery(dateOverridesQuery());
  const todaysOverride = overrides?.find((o) => o.date === today.date);

  return (
    <View className="gap-2 rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <Text className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
        Today: {today.dayType.name}
        {todaysOverride ? ' (one-day override)' : ''}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {dayTypes?.map((dt) => {
          const isActive = today.dayType.id === dt.id;
          return (
            <Pressable
              key={dt.id}
              onPress={() => setDateOverride(today.date, dt.id, 'Wildcard')}
              className={`rounded-full border px-3 py-1.5 ${
                isActive
                  ? 'border-neutral-900 bg-neutral-900 dark:border-white dark:bg-white'
                  : 'border-neutral-200 dark:border-neutral-800'
              }`}>
              <Text
                className={`text-sm font-medium ${
                  isActive ? 'text-white dark:text-neutral-900' : 'text-neutral-900 dark:text-white'
                }`}>
                {dt.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {todaysOverride && (
        <Pressable onPress={() => removeDateOverride(todaysOverride.id)}>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">
            Revert today to the regular schedule
          </Text>
        </Pressable>
      )}
    </View>
  );
}
