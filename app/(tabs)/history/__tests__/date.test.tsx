import { render, screen } from '@testing-library/react-native';
import { DateTime } from 'luxon';

import { createDayType } from '@/src/db/repositories/dayTypeRepo';
import { logFood } from '@/src/db/repositories/foodLogRepo';
import { setWeekdayDayType } from '@/src/db/repositories/weeklyScheduleRepo';
import { resetTestDb } from '@/src/db/testClient';

import { DayDetailContent } from '../[date]';

const ZONE = 'UTC';

beforeEach(async () => {
  resetTestDb();
  const dayType = await createDayType({
    name: 'Flexible Day',
    isFastDay: false,
    calorieTarget: 2000,
    proteinTarget: 150,
  });
  for (let weekday = 1; weekday <= 7; weekday++) {
    await setWeekdayDayType(weekday, dayType.id);
  }
});

test('a date with no logs shows the empty state instead of crashing (spec edge case: empty states)', async () => {
  await render(<DayDetailContent date="2025-06-16" timezone={ZONE} />);
  expect(await screen.findByText('No logs for this date yet.')).toBeTruthy();
});

test('a date with logs shows them instead of the empty state', async () => {
  const dayType = await createDayType({
    name: 'Second Day Type',
    isFastDay: false,
    calorieTarget: 2000,
    proteinTarget: 150,
  });

  await logFood({
    dateTime: DateTime.fromISO('2025-06-16T12:00', { zone: ZONE }),
    description: 'Test lunch',
    calories: 500,
    proteinG: 40,
    yesterday: { date: '2025-06-15', dayType, source: 'schedule' },
    today: { date: '2025-06-16', dayType, source: 'schedule' },
  });

  await render(<DayDetailContent date="2025-06-16" timezone={ZONE} />);
  expect(await screen.findByText('Test lunch')).toBeTruthy();
  expect(screen.queryByText('No logs for this date yet.')).toBeNull();
});
