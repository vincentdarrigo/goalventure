import type { DayType, ResolvedDayType } from '@/src/domain/types';

import { createDayType } from './dayTypeRepo';
import { dailyLogSnapshotByDateQuery } from './dailyLogSnapshotRepo';
import { createSupplement } from './supplementRepo';
import {
  clearSupplementDose,
  recordSupplementDose,
  supplementDosesForDateQuery,
} from './supplementDoseRepo';
import { resetTestDb } from '../testClient';

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

test('records a dose as taken, snapshotting the current supplement fields', async () => {
  const today = await makeToday('2025-06-16');
  const supplement = await createSupplement({
    name: 'Magnesium Glycinate',
    dosageAmount: 300,
    dosageUnit: 'mg',
    timing: 'bedtime',
  });

  await recordSupplementDose({
    supplementId: supplement.id,
    date: '2025-06-16',
    status: 'taken',
    nameSnapshot: supplement.name,
    dosageAmountSnapshot: supplement.dosageAmount,
    dosageUnitSnapshot: supplement.dosageUnit,
    today,
  });

  const rows = await supplementDosesForDateQuery('2025-06-16');
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ status: 'taken', nameSnapshot: 'Magnesium Glycinate' });
  expect(rows[0].takenAt).not.toBeNull();
});

test('a snapshot survives editing the supplement afterward (same principle as foodLog)', async () => {
  const today = await makeToday('2025-06-16');
  const supplement = await createSupplement({
    name: 'Omega-3',
    dosageAmount: 2000,
    dosageUnit: 'mg',
    timing: 'with_meal',
  });

  await recordSupplementDose({
    supplementId: supplement.id,
    date: '2025-06-16',
    status: 'taken',
    nameSnapshot: supplement.name,
    dosageAmountSnapshot: supplement.dosageAmount,
    dosageUnitSnapshot: supplement.dosageUnit,
    today,
  });

  const rows = await supplementDosesForDateQuery('2025-06-16');
  expect(rows[0].dosageAmountSnapshot).toBe(2000);
});

test('recording again for the same day updates rather than duplicating (toggle taken -> skipped)', async () => {
  const today = await makeToday('2025-06-16');
  const supplement = await createSupplement({
    name: 'Psyllium Husk',
    dosageAmount: 1,
    dosageUnit: 'tbsp',
    timing: 'with_meal',
  });

  const doseInput = {
    supplementId: supplement.id,
    date: '2025-06-16',
    nameSnapshot: supplement.name,
    dosageAmountSnapshot: supplement.dosageAmount,
    dosageUnitSnapshot: supplement.dosageUnit,
    today,
  };
  await recordSupplementDose({ ...doseInput, status: 'taken' });
  await recordSupplementDose({ ...doseInput, status: 'skipped' });

  const rows = await supplementDosesForDateQuery('2025-06-16');
  expect(rows).toHaveLength(1);
  expect(rows[0].status).toBe('skipped');
  expect(rows[0].takenAt).toBeNull();
});

test('clearing a dose reverts it to pending (no row = pending)', async () => {
  const today = await makeToday('2025-06-16');
  const supplement = await createSupplement({
    name: 'Vitamin D',
    dosageAmount: 2000,
    dosageUnit: 'IU',
    timing: 'with_meal',
  });

  await recordSupplementDose({
    supplementId: supplement.id,
    date: '2025-06-16',
    status: 'taken',
    nameSnapshot: supplement.name,
    dosageAmountSnapshot: supplement.dosageAmount,
    dosageUnitSnapshot: supplement.dosageUnit,
    today,
  });
  await clearSupplementDose(supplement.id, '2025-06-16');

  const rows = await supplementDosesForDateQuery('2025-06-16');
  expect(rows).toHaveLength(0);
});

test('recording a dose ensures a daily snapshot exists, like other write paths', async () => {
  const today = await makeToday('2025-06-16');
  const supplement = await createSupplement({
    name: 'L-Citrulline',
    dosageAmount: 4,
    dosageUnit: 'g',
    timing: 'fasted',
  });

  await recordSupplementDose({
    supplementId: supplement.id,
    date: '2025-06-16',
    status: 'taken',
    nameSnapshot: supplement.name,
    dosageAmountSnapshot: supplement.dosageAmount,
    dosageUnitSnapshot: supplement.dosageUnit,
    today,
  });

  const snapshot = await dailyLogSnapshotByDateQuery('2025-06-16');
  expect(snapshot).toHaveLength(1);
});
