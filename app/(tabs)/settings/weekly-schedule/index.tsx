import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';
import { router } from 'expo-router';
import { ScrollView } from 'react-native';

import { ListRow } from '@/src/components/settings/ListRow';
import { dayTypesQuery } from '@/src/db/repositories/dayTypeRepo';
import { weeklyScheduleQuery } from '@/src/db/repositories/weeklyScheduleRepo';

const WEEKDAY_NAMES: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

export default function WeeklyScheduleScreen() {
  const { data: dayTypes } = useLiveQuery(dayTypesQuery());
  const { data: schedule } = useLiveQuery(weeklyScheduleQuery());

  const dayTypesById = Object.fromEntries((dayTypes ?? []).map((dt) => [dt.id, dt]));
  const scheduleByWeekday = Object.fromEntries((schedule ?? []).map((row) => [row.weekday, row.dayTypeId]));

  return (
    <ScrollView className="flex-1 bg-white dark:bg-neutral-950">
      {[1, 2, 3, 4, 5, 6, 7].map((weekday) => {
        const dayTypeId = scheduleByWeekday[weekday];
        const dayType = dayTypeId ? dayTypesById[dayTypeId] : undefined;
        return (
          <ListRow
            key={weekday}
            title={WEEKDAY_NAMES[weekday]}
            subtitle={dayType?.name ?? 'Not set'}
            onPress={() => router.push(`/settings/weekly-schedule/${weekday}`)}
          />
        );
      })}
    </ScrollView>
  );
}
