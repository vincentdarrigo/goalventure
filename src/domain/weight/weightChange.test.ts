import { computeWeightChange } from './weightChange';

test('weight lost since the starting point is a negative change', () => {
  const change = computeWeightChange(265, 250, 200);
  expect(change.changeFromStart).toBe(-15);
});

test('weight gained since the starting point is a positive change', () => {
  const change = computeWeightChange(200, 210, 190);
  expect(change.changeFromStart).toBe(10);
});

test('remaining-to-target is positive while still above target', () => {
  const change = computeWeightChange(265, 250, 200);
  expect(change.remainingToTarget).toBe(50);
});

test('remaining-to-target is zero exactly at target', () => {
  const change = computeWeightChange(265, 200, 200);
  expect(change.remainingToTarget).toBe(0);
});

test('remaining-to-target is null when no target is set', () => {
  const change = computeWeightChange(265, 250, null);
  expect(change.remainingToTarget).toBeNull();
});
