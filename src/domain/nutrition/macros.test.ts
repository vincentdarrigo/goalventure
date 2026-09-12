import { computeMacroProgress, sumMacros } from './macros';

describe('sumMacros', () => {
  test('an empty day sums to zero', () => {
    expect(sumMacros([])).toEqual({ caloriesConsumed: 0, proteinConsumedG: 0 });
  });

  test('sums multiple logged entries', () => {
    const totals = sumMacros([
      { calories: 500, proteinG: 50 },
      { calories: 150, proteinG: 15 },
      { calories: 1450, proteinG: 135 },
    ]);
    expect(totals).toEqual({ caloriesConsumed: 2100, proteinConsumedG: 200 });
  });
});

describe('computeMacroProgress', () => {
  test('an empty day shows the full target remaining and is not over', () => {
    const progress = computeMacroProgress([], 2100, 200);
    expect(progress.caloriesRemaining).toBe(2100);
    expect(progress.proteinRemainingG).toBe(200);
    expect(progress.isOverCalorieTarget).toBe(false);
  });

  test('flags over-target when consumed calories exceed the target', () => {
    const progress = computeMacroProgress([{ calories: 2500, proteinG: 100 }], 2100, 200);
    expect(progress.caloriesRemaining).toBe(-400);
    expect(progress.isOverCalorieTarget).toBe(true);
  });

  test('remains independent of the source preset after it changes (values are pre-summed inputs, never re-derived)', () => {
    // The snapshot guarantee lives in foodLogRepo (values are copied at write
    // time); this just documents that computeMacroProgress only ever sums
    // whatever numbers it's given, with no live lookup of its own.
    const loggedEntries = [{ calories: 1450, proteinG: 135 }]; // as stored, from a preset since since-edited
    const progress = computeMacroProgress(loggedEntries, 2100, 200);
    expect(progress.caloriesConsumed).toBe(1450);
  });

  test('exactly at target is not flagged as over', () => {
    const progress = computeMacroProgress([{ calories: 2100, proteinG: 200 }], 2100, 200);
    expect(progress.isOverCalorieTarget).toBe(false);
    expect(progress.caloriesRemaining).toBe(0);
  });
});
