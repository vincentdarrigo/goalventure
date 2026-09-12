import { DateTime } from 'luxon';

import type { DayType, ResolvedDayType } from '@/src/domain/types';

import { createDayType } from './dayTypeRepo';
import { dailyLogSnapshotByDateQuery } from './dailyLogSnapshotRepo';
import { hydrationLogsInRangeQuery, logHydration } from './hydrationLogRepo';
import { resetTestDb } from '../testClient';

const ZONE = 'America/Chicago';

beforeEach(() => {
  resetTestDb();
});

async function makeToday(date: string): Promise<ResolvedDayType> {
  const row = await createDayType({
    name: 'Go-To 16/8',
    eatingWindowStart: '08:00',
    eatingWindowEnd: '16:00',
    isFastDay: false,
    calorieTarget: 2100,
    proteinTarget: 200,
  });
  const dayType: DayType = row;
  return { date, dayType, source: 'schedule' };
}

test('logs hydration without clamping, even above any notion of a goal', async () => {
  const today = await makeToday('2025-06-16');

  await logHydration({
    dateTime: DateTime.fromISO('2025-06-16T12:00', { zone: ZONE }),
    ounces: 132,
    today,
  });

  const rows = await hydrationLogsInRangeQuery('2025-06-16T00:00:00.000Z', '2025-06-17T00:00:00.000Z');
  expect(rows).toHaveLength(1);
  expect(rows[0].ounces).toBe(132);
});

test('logging hydration ensures a daily snapshot exists, like other write paths', async () => {
  const today = await makeToday('2025-06-16');

  await logHydration({
    dateTime: DateTime.fromISO('2025-06-16T12:00', { zone: ZONE }),
    ounces: 16,
    today,
  });

  const snapshot = await dailyLogSnapshotByDateQuery('2025-06-16');
  expect(snapshot).toHaveLength(1);
});
