import { computeStackTotals } from './mealStack';

test('sums calories/protein across items, scaled by quantity', () => {
  const totals = computeStackTotals([
    { calories: 200, proteinG: 20, quantity: 1 },
    { calories: 100, proteinG: 5, quantity: 2 },
  ]);
  expect(totals).toEqual({ calories: 400, proteinG: 30 });
});

test('an empty stack totals to zero', () => {
  expect(computeStackTotals([])).toEqual({ calories: 0, proteinG: 0 });
});
