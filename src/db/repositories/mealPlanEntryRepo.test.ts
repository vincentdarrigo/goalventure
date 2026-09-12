import { DateTime } from 'luxon';

import type { DayType, ResolvedDayType } from '@/src/domain/types';

import { createDayType } from './dayTypeRepo';
import { logFood } from './foodLogRepo';
import { createIngredient } from './ingredientRepo';
import {
  createMealPlanEntry,
  deleteMealPlanEntry,
  markMealPlanEntryLogged,
  mealPlanEntriesInRangeQuery,
} from './mealPlanEntryRepo';
import { ensureDefaultMealSlots, mealSlotsQuery } from './mealSlotRepo';
import { createMealPreset } from './mealPresetRepo';
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

async function firstSlotId(): Promise<number> {
  await ensureDefaultMealSlots();
  const slots = await mealSlotsQuery();
  return slots[0].id;
}

test('creates an ingredient-sourced entry with only ingredientId set', async () => {
  const mealSlotId = await firstSlotId();
  const ing = await createIngredient({
    name: 'Oats',
    servingSizeAmount: 40,
    servingSizeUnit: 'g',
    calories: 150,
    proteinG: 5,
  });

  const entry = await createMealPlanEntry({
    date: '2025-06-16',
    mealSlotId,
    quantity: 1,
    order: 1,
    source: { kind: 'ingredient', ingredientId: ing.id },
  });

  expect(entry).toMatchObject({ ingredientId: ing.id, mealPresetId: null, mealStackId: null });
});

test('creates a preset-sourced entry with only mealPresetId set', async () => {
  const mealSlotId = await firstSlotId();
  const preset = await createMealPreset({ name: 'Proats', calories: 500, proteinG: 50 });

  const entry = await createMealPlanEntry({
    date: '2025-06-16',
    mealSlotId,
    quantity: 1,
    order: 1,
    source: { kind: 'preset', mealPresetId: preset.id },
  });

  expect(entry).toMatchObject({ mealPresetId: preset.id, ingredientId: null, mealStackId: null });
});

test('queries entries within a date range only', async () => {
  const mealSlotId = await firstSlotId();
  const preset = await createMealPreset({ name: 'Proats', calories: 500, proteinG: 50 });

  await createMealPlanEntry({
    date: '2025-06-16',
    mealSlotId,
    quantity: 1,
    order: 1,
    source: { kind: 'preset', mealPresetId: preset.id },
  });
  await createMealPlanEntry({
    date: '2025-06-20',
    mealSlotId,
    quantity: 1,
    order: 1,
    source: { kind: 'preset', mealPresetId: preset.id },
  });

  const rows = await mealPlanEntriesInRangeQuery('2025-06-16', '2025-06-16');
  expect(rows).toHaveLength(1);
  expect(rows[0].date).toBe('2025-06-16');
});

test('deleting an entry removes it', async () => {
  const mealSlotId = await firstSlotId();
  const preset = await createMealPreset({ name: 'Proats', calories: 500, proteinG: 50 });
  const entry = await createMealPlanEntry({
    date: '2025-06-16',
    mealSlotId,
    quantity: 1,
    order: 1,
    source: { kind: 'preset', mealPresetId: preset.id },
  });

  await deleteMealPlanEntry(entry.id);

  const rows = await mealPlanEntriesInRangeQuery('2025-06-16', '2025-06-16');
  expect(rows).toHaveLength(0);
});

test('marking an entry logged sets loggedFoodLogId to a real FoodLog row', async () => {
  const mealSlotId = await firstSlotId();
  const preset = await createMealPreset({ name: 'Proats', calories: 500, proteinG: 50 });
  const entry = await createMealPlanEntry({
    date: '2025-06-16',
    mealSlotId,
    quantity: 1,
    order: 1,
    source: { kind: 'preset', mealPresetId: preset.id },
  });

  const today = await makeToday('2025-06-16');
  const logged = await logFood({
    dateTime: DateTime.fromISO('2025-06-16T12:00', { zone: ZONE }),
    description: preset.name,
    calories: preset.calories,
    proteinG: preset.proteinG,
    sourcePresetId: preset.id,
    yesterday: { date: '2025-06-15', dayType: today.dayType, source: 'schedule' },
    today,
  });
  await markMealPlanEntryLogged(entry.id, logged.id);

  const rows = await mealPlanEntriesInRangeQuery('2025-06-16', '2025-06-16');
  expect(rows[0].loggedFoodLogId).toBe(logged.id);
});
