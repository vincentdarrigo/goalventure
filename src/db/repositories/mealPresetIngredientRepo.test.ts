import { DateTime } from 'luxon';

import type { DayType, ResolvedDayType } from '@/src/domain/types';
import { computeStackTotals } from '@/src/domain/nutrition/mealStack';

import { createDayType } from './dayTypeRepo';
import { foodLogsInRangeQuery, logFood } from './foodLogRepo';
import { createIngredient, updateIngredient } from './ingredientRepo';
import {
  addMealPresetIngredient,
  mealPresetIngredientItemsQuery,
} from './mealPresetIngredientRepo';
import { createComposedMealPreset } from './mealPresetRepo';
import { resetTestDb } from '../testClient';

const ZONE = 'America/Chicago';

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

beforeEach(() => {
  resetTestDb();
});

test('a composed preset totals live from its ingredients', async () => {
  const chicken = await createIngredient({
    name: 'Chicken Breast',
    servingSizeAmount: 100,
    servingSizeUnit: 'g',
    calories: 165,
    proteinG: 31,
  });
  const rice = await createIngredient({
    name: 'Brown Rice',
    servingSizeAmount: 100,
    servingSizeUnit: 'g',
    calories: 123,
    proteinG: 2.7,
  });
  const preset = await createComposedMealPreset('Chicken and Rice Bowl');
  await addMealPresetIngredient(preset.id, chicken.id, 1.5, 1); // 150g chicken
  await addMealPresetIngredient(preset.id, rice.id, 2, 2); // 200g rice

  const items = await mealPresetIngredientItemsQuery(preset.id);
  const totals = computeStackTotals(items);

  expect(totals.calories).toBeCloseTo(165 * 1.5 + 123 * 2);
  expect(totals.proteinG).toBeCloseTo(31 * 1.5 + 2.7 * 2);
});

test('editing an ingredient updates a composed preset’s live total, but a logged snapshot stays frozen', async () => {
  const today = await makeToday('2025-06-16');
  const chicken = await createIngredient({
    name: 'Chicken Breast',
    servingSizeAmount: 100,
    servingSizeUnit: 'g',
    calories: 165,
    proteinG: 31,
  });
  const preset = await createComposedMealPreset('Chicken Bowl');
  await addMealPresetIngredient(preset.id, chicken.id, 1, 1);

  // Log the preset "as of now" — the caller (a hook, in the real app) reads
  // live totals and passes them into logFood, same as MealLogGrid does today.
  const itemsBeforeEdit = await mealPresetIngredientItemsQuery(preset.id);
  const totalsBeforeEdit = computeStackTotals(itemsBeforeEdit);
  const logged = await logFood({
    dateTime: DateTime.fromISO('2025-06-16T12:00', { zone: ZONE }),
    description: preset.name,
    calories: totalsBeforeEdit.calories,
    proteinG: totalsBeforeEdit.proteinG,
    sourcePresetId: preset.id,
    yesterday: { date: '2025-06-15', dayType: today.dayType, source: 'schedule' },
    today,
  });
  expect(logged.calories).toBe(165);

  // The ingredient's nutrition changes later (e.g. corrected after a re-check).
  await updateIngredient(chicken.id, { calories: 200 });

  // The composed preset's LIVE total reflects the new value...
  const itemsAfterEdit = await mealPresetIngredientItemsQuery(preset.id);
  const totalsAfterEdit = computeStackTotals(itemsAfterEdit);
  expect(totalsAfterEdit.calories).toBe(200);

  // ...but re-reading the already-logged entry from the database (not just
  // the in-memory return value) shows it's untouched, exactly like a flat preset.
  const rows = await foodLogsInRangeQuery('2025-06-16T00:00:00.000Z', '2025-06-17T00:00:00.000Z');
  const reread = rows.find((r) => r.id === logged.id);
  expect(reread?.calories).toBe(165);
});
