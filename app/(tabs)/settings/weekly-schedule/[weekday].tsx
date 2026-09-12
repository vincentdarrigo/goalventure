import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text } from 'react-native';

import { ListRow } from '@/src/components/settings/ListRow';
import { dayTypesQuery } from '@/src/db/repositories/dayTypeRepo';
import { setWeekdayDayType, weeklyScheduleQuery } from '@/src/db/repositories/weeklyScheduleRepo';

const WEEKDAY_NAMES: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

export default function ChooseWeekdayDayTypeScreen() {
  const { weekday: weekdayParam } = useLocalSearchParams<{ weekday: string }>();
  const weekday = Number(weekdayParam);

  const { data: dayTypes } = useLiveQuery(dayTypesQuery());
  const { data: schedule } = useLiveQuery(weeklyScheduleQuery());
  const currentDayTypeId = schedule?.find((row) => row.weekday === weekday)?.dayTypeId;

  async function choose(dayTypeId: number) {
    await setWeekdayDayType(weekday, dayTypeId);
    router.back();
  }

  return (
    <ScrollView className="flex-1 bg-white dark:bg-neutral-950">
      <Text className="px-4 pb-2 pt-4 text-sm text-neutral-500 dark:text-neutral-400">
        Choose the day type for {WEEKDAY_NAMES[weekday] ?? `weekday ${weekday}`}.
      </Text>
      {dayTypes?.length === 0 && (
        <Text className="px-4 py-6 text-center text-neutral-500 dark:text-neutral-400">
          No day types yet — add one in Settings › Day Types first.
        </Text>
      )}
      {dayTypes?.map((dt) => (
        <ListRow
          key={dt.id}
          title={dt.name}
          right={
            dt.id === currentDayTypeId ? (
              <Text className="text-neutral-900 dark:text-white">✓</Text>
            ) : undefined
          }
          onPress={() => choose(dt.id)}
        />
      ))}
    </ScrollView>
  );
}
