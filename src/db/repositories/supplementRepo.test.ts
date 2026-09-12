import {
  archiveSupplement,
  createSupplement,
  supplementByIdQuery,
  supplementsQuery,
  updateSupplement,
} from './supplementRepo';
import { resetTestDb } from '../testClient';

beforeEach(() => {
  resetTestDb();
});

test('creates and lists a supplement in order', async () => {
  await createSupplement({
    name: 'Magnesium Glycinate',
    dosageAmount: 300,
    dosageUnit: 'mg',
    timing: 'bedtime',
    order: 2,
  });
  await createSupplement({
    name: 'L-Citrulline',
    dosageAmount: 4,
    dosageUnit: 'g',
    timing: 'fasted',
    order: 1,
  });

  const rows = await supplementsQuery();
  expect(rows.map((r) => r.name)).toEqual(['L-Citrulline', 'Magnesium Glycinate']);
});

test('updates persist', async () => {
  const created = await createSupplement({
    name: 'Omega-3',
    dosageAmount: 1000,
    dosageUnit: 'mg',
    timing: 'with_meal',
  });
  await updateSupplement(created.id, { dosageAmount: 2000 });

  const rows = await supplementByIdQuery(created.id);
  expect(rows[0].dosageAmount).toBe(2000);
});

test('archiving removes a supplement from the active list without deleting the row', async () => {
  const created = await createSupplement({
    name: 'Psyllium Husk',
    dosageAmount: 1,
    dosageUnit: 'tbsp',
    timing: 'with_meal',
  });
  await archiveSupplement(created.id);

  const active = await supplementsQuery();
  expect(active).toHaveLength(0);

  const byId = await supplementByIdQuery(created.id);
  expect(byId).toHaveLength(1);
  expect(byId[0].archivedAt).not.toBeNull();
});

test('a specific_time supplement stores its scheduled time', async () => {
  const created = await createSupplement({
    name: 'Vitamin D',
    dosageAmount: 2000,
    dosageUnit: 'IU',
    timing: 'specific_time',
    specificTime: '07:00',
  });
  const rows = await supplementByIdQuery(created.id);
  expect(rows[0].specificTime).toBe('07:00');
});
