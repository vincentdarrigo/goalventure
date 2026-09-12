import { resetTestDb } from '../testClient';
import { createUserProfile, updateUserProfile, userProfileQuery } from './userProfileRepo';

beforeEach(() => {
  resetTestDb();
});

test('creates and reads back a profile against a real SQLite database', async () => {
  await createUserProfile({
    timezone: 'America/Chicago',
    currentWeight: 265,
    targetWeight: 200,
    hydrationGoalOz: 100,
    alcoholRule: 'Strict: 0',
    healthFocus: 'Shoulder/back stability, vascular recovery',
    palateNotes: 'Simple/repeatable: chicken, beef, potatoes',
    units: 'imperial',
  });

  const rows = await userProfileQuery();
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    timezone: 'America/Chicago',
    currentWeight: 265,
    alcoholRule: 'Strict: 0',
    healthFocus: 'Shoulder/back stability, vascular recovery',
    palateNotes: 'Simple/repeatable: chicken, beef, potatoes',
  });
});

test('updates persist and resetTestDb isolates each test', async () => {
  // If resetTestDb() didn't run between tests, this would find the previous test's row.
  const before = await userProfileQuery();
  expect(before).toHaveLength(0);

  const created = await createUserProfile({
    timezone: 'UTC',
    hydrationGoalOz: 80,
    units: 'metric',
  });
  await updateUserProfile(created.id, { hydrationGoalOz: 120 });

  const rows = await userProfileQuery();
  expect(rows[0].hydrationGoalOz).toBe(120);
});
