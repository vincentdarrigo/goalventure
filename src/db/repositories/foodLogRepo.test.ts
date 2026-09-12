import { DateTime } from 'luxon';

import type { DayType, ResolvedDayType } from '@/src/domain/types';

import { createMealPreset, updateMealPreset } from './mealPresetRepo';
import { foodLogsInRangeQuery, logFood } from './foodLogRepo';
import { resetTestDb } from '../testClient';

const ZONE = 'America/Chicago';

const GO_TO: DayType = {
  id: 1,
  name: 'Go-To 16/8',
  eatingWindowStart: '08:00',
  eatingWindowEnd: '16:00',
  isFastDay: false,
  calorieTarget: 2100,
  proteinTarget: 200,
};

const FAST: DayType = {
  id: 2,
  name: '24-Hour Fast',
  eatingWindowStart: null,
  eatingWindowEnd: null,
  isFastDay: true,
  calorieTarget: 0,
  proteinTarget: 0,
};

function resolved(date: string, dayType: DayType): ResolvedDayType {
  return { date, dayType, source: 'schedule' };
}

function at(isoDate: string, hhmm: string): DateTime {
  const [hour, minute] = hhmm.split(':').map(Number);
  return DateTime.fromISO(isoDate, { zone: ZONE }).set({ hour, minute });
}

beforeEach(() => {
  resetTestDb();
});

describe('logFood — snapshot independence (edge case: editing a preset must not mutate historical logs)', () => {
  test('a logged entry keeps its original calories/protein after the source preset is edited', async () => {
    const preset = await createMealPreset({
      name: 'Mega Meal Closer',
      calories: 1450,
      proteinG: 135,
    });

    const yesterday = resolved('2025-06-15', GO_TO);
    const today = resolved('2025-06-16', GO_TO);

    const logged = await logFood({
      dateTime: at('2025-06-16', '15:30'),
      description: preset.name,
      calories: preset.calories,
      proteinG: preset.proteinG,
      sourcePresetId: preset.id,
      yesterday,
      today,
    });

    // The preset changes later (e.g. the user tweaks the recipe)...
    await updateMealPreset(preset.id, { calories: 1600, proteinG: 150 });

    // ...but the already-logged entry is untouched.
    const rows = await foodLogsInRangeQuery('2025-06-16T00:00:00.000Z', '2025-06-17T00:00:00.000Z');
    const reread = rows.find((r) => r.id === logged.id);
    expect(reread?.calories).toBe(1450);
    expect(reread?.proteinG).toBe(135);
  });
});

describe('logFood — logging outside the eating window never rejects', () => {
  const yesterday = resolved('2025-06-15', GO_TO);

  test('logging inside the window is flagged as within-window', async () => {
    const today = resolved('2025-06-16', GO_TO);
    const logged = await logFood({
      dateTime: at('2025-06-16', '12:00'),
      description: 'Snack',
      calories: 200,
      proteinG: 10,
      yesterday,
      today,
    });
    expect(logged.loggedOutsideWindow).toBe(false);
  });

  test('logging before the window opens still succeeds, flagged as outside-window', async () => {
    const today = resolved('2025-06-16', GO_TO);
    const logged = await logFood({
      dateTime: at('2025-06-16', '05:00'),
      description: 'Early snack',
      calories: 150,
      proteinG: 5,
      yesterday,
      today,
    });
    expect(logged.loggedOutsideWindow).toBe(true);
  });

  test('logging on a hard fast day still succeeds, flagged as outside-window', async () => {
    const today = resolved('2025-06-16', FAST);
    const logged = await logFood({
      dateTime: at('2025-06-16', '12:00'),
      description: 'Broke the fast',
      calories: 300,
      proteinG: 20,
      yesterday,
      today,
    });
    expect(logged.loggedOutsideWindow).toBe(true);
  });
});

describe('foodLogsInRangeQuery', () => {
  test('only returns entries within the given UTC instant range', async () => {
    const yesterday = resolved('2025-06-15', GO_TO);
    const today = resolved('2025-06-16', GO_TO);

    await logFood({
      dateTime: at('2025-06-16', '12:00'),
      description: 'In range',
      calories: 100,
      proteinG: 10,
      yesterday,
      today,
    });
    await logFood({
      dateTime: at('2025-06-17', '12:00'),
      description: 'Out of range',
      calories: 100,
      proteinG: 10,
      yesterday: today,
      today: resolved('2025-06-17', GO_TO),
    });

    const rows = await foodLogsInRangeQuery('2025-06-16T00:00:00.000Z', '2025-06-17T00:00:00.000Z');
    expect(rows).toHaveLength(1);
    expect(rows[0].description).toBe('In range');
  });
});
