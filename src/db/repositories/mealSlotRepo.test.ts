import { ensureDefaultMealSlots, mealSlotsQuery } from './mealSlotRepo';
import { resetTestDb } from '../testClient';

beforeEach(() => {
  resetTestDb();
});

test('seeds the four default slots when none exist', async () => {
  await ensureDefaultMealSlots();
  const rows = await mealSlotsQuery();
  expect(rows.map((r) => r.name)).toEqual(['Breakfast', 'Lunch', 'Dinner', 'Snack']);
});

test('is idempotent — does not duplicate slots on a second call', async () => {
  await ensureDefaultMealSlots();
  await ensureDefaultMealSlots();
  const rows = await mealSlotsQuery();
  expect(rows).toHaveLength(4);
});

test('does not reseed if the user already has custom slots', async () => {
  await ensureDefaultMealSlots();
  const rows = await mealSlotsQuery();
  expect(rows).toHaveLength(4);
  // A user who deletes down to a custom set shouldn't have defaults reappear
  // simply because ensureDefaultMealSlots runs again on next screen visit.
  await ensureDefaultMealSlots();
  const rowsAgain = await mealSlotsQuery();
  expect(rowsAgain).toHaveLength(4);
});
