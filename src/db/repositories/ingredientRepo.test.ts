import {
  archiveIngredient,
  createIngredient,
  ingredientByIdQuery,
  ingredientsQuery,
  updateIngredient,
} from './ingredientRepo';
import { resetTestDb } from '../testClient';

beforeEach(() => {
  resetTestDb();
});

test('creates and lists ingredients alphabetically', async () => {
  await createIngredient({
    name: 'Chicken Breast',
    servingSizeAmount: 100,
    servingSizeUnit: 'g',
    calories: 165,
    proteinG: 31,
  });
  await createIngredient({
    name: 'Almond Milk',
    servingSizeAmount: 240,
    servingSizeUnit: 'ml',
    calories: 30,
    proteinG: 1,
  });

  const rows = await ingredientsQuery();
  expect(rows.map((r) => r.name)).toEqual(['Almond Milk', 'Chicken Breast']);
});

test('manual entry needs no source provider', async () => {
  const created = await createIngredient({
    name: 'Homemade Protein Bar',
    servingSizeAmount: 1,
    servingSizeUnit: 'bar',
    calories: 220,
    proteinG: 20,
  });
  expect(created.sourceProvider).toBeNull();
});

test('updates persist, including partial macro fields', async () => {
  const created = await createIngredient({
    name: 'Greek Yogurt',
    servingSizeAmount: 170,
    servingSizeUnit: 'g',
    calories: 100,
    proteinG: 17,
  });
  await updateIngredient(created.id, { calories: 110, carbsG: 6, fatG: 0.5 });

  const rows = await ingredientByIdQuery(created.id);
  expect(rows[0]).toMatchObject({ calories: 110, carbsG: 6, fatG: 0.5 });
});

test('archiving removes an ingredient from the active list without deleting the row', async () => {
  const created = await createIngredient({
    name: 'Discontinued Snack',
    servingSizeAmount: 1,
    servingSizeUnit: 'serving',
    calories: 150,
    proteinG: 5,
  });
  await archiveIngredient(created.id);

  const active = await ingredientsQuery();
  expect(active).toHaveLength(0);

  const byId = await ingredientByIdQuery(created.id);
  expect(byId[0].archivedAt).not.toBeNull();
});
