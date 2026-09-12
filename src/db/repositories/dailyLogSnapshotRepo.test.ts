import { DateTime } from 'luxon';

import type { DayType, ResolvedDayType } from '@/src/domain/types';

import { createDayType, updateDayType } from './dayTypeRepo';
import { dailyLogSnapshotByDateQuery, ensureDailySnapshot } from './dailyLogSnapshotRepo';
import { logFood } from './foodLogRepo';
import { resetTestDb } from '../testClient';

const ZONE = 'America/Chicago';

function toDomainDayType(row: {
  id: number;
  name: string;
  eatingWindowStart: string | null;
  eatingWindowEnd: string | null;
  isFastDay: boolean;
  calorieTarget: number;
  proteinTarget: number;
}): DayType {
  return row;
}

function resolved(date: string, dayType: DayType): ResolvedDayType {
  return { date, dayType, source: 'schedule' };
}

beforeEach(() => {
  resetTestDb();
});

describe('mid-week target change preserves history (spec edge case #5)', () => {
  test('logging on Monday freezes that day’s targets; Tuesday is untouched and stays live', async () => {
    const row = await createDayType({
      name: 'Go-To 16/8',
      eatingWindowStart: '08:00',
      eatingWindowEnd: '16:00',
      isFastDay: false,
      calorieTarget: 2000,
      proteinTarget: 150,
    });
    const originalDayType = toDomainDayType(row);

    // Log something on Monday under the original targets.
    const monday = resolved('2025-06-16', originalDayType);
    const tuesday = resolved('2025-06-17', originalDayType); // Tuesday never gets any activity

    await logFood({
      dateTime: DateTime.fromISO('2025-06-16T12:00', { zone: ZONE }),
      description: 'Lunch',
      calories: 500,
      proteinG: 40,
      yesterday: resolved('2025-06-15', originalDayType),
      today: monday,
    });

    // The DayType's targets change mid-week (e.g. user edits it in Settings).
    const updatedRow = await updateDayType(row.id, { calorieTarget: 2500, proteinTarget: 180 });
    const updatedDayType = toDomainDayType(updatedRow);

    // Monday's snapshot was already captured — it must still show the OLD targets.
    const mondaySnapshot = await dailyLogSnapshotByDateQuery(monday.date);
    expect(mondaySnapshot[0]).toMatchObject({ calorieTarget: 2000, proteinTarget: 150 });

    // Tuesday never had any activity, so it has no frozen snapshot at all —
    // a live resolveDayType() call for Tuesday (done elsewhere, e.g. the
    // weekly budget hook) would pick up the NEW targets, exactly as intended.
    const tuesdaySnapshot = await dailyLogSnapshotByDateQuery(tuesday.date);
    expect(tuesdaySnapshot).toHaveLength(0);

    // Sanity: if Tuesday's activity happened AFTER the change, its snapshot
    // (once created) reflects the new targets, proving snapshots aren't
    // globally stale — only already-touched dates are frozen.
    await ensureDailySnapshot(resolved(tuesday.date, updatedDayType));
    const tuesdaySnapshotAfter = await dailyLogSnapshotByDateQuery(tuesday.date);
    expect(tuesdaySnapshotAfter[0]).toMatchObject({ calorieTarget: 2500, proteinTarget: 180 });
  });

  test('ensureDailySnapshot is idempotent — a second call for the same date does not overwrite the first', async () => {
    const firstRow = await createDayType({
      name: 'Go-To 16/8',
      calorieTarget: 2000,
      proteinTarget: 150,
      isFastDay: false,
    });
    const secondRow = await createDayType({
      name: 'Different Day Type',
      calorieTarget: 9999,
      proteinTarget: 999,
      isFastDay: false,
    });

    await ensureDailySnapshot(resolved('2025-06-16', toDomainDayType(firstRow)));
    await ensureDailySnapshot(resolved('2025-06-16', toDomainDayType(secondRow)));

    const rows = await dailyLogSnapshotByDateQuery('2025-06-16');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ calorieTarget: 2000, proteinTarget: 150 });
  });
});
