import { computeWeeklyBudget, type DayBudgetEntry } from './weeklyBudget';

function day(overrides: Partial<DayBudgetEntry> = {}): DayBudgetEntry {
  return {
    date: '2025-06-16',
    calorieTarget: 2100,
    proteinTarget: 200,
    caloriesConsumed: 0,
    proteinConsumedG: 0,
    ...overrides,
  };
}

describe('computeWeeklyBudget', () => {
  test('a week with no logged days totals to zero consumed and is not over', () => {
    const budget = computeWeeklyBudget([day(), day(), day()]);
    expect(budget.caloriesConsumedTotal).toBe(0);
    expect(budget.calorieVariance).toBe(-6300);
    expect(budget.isOverBudget).toBe(false);
  });

  test('consuming exactly the weekly target is not over budget', () => {
    const budget = computeWeeklyBudget([
      day({ calorieTarget: 2000, caloriesConsumed: 2000 }),
      day({ calorieTarget: 2000, caloriesConsumed: 2000 }),
    ]);
    expect(budget.calorieVariance).toBe(0);
    expect(budget.isOverBudget).toBe(false);
  });

  test('flags the week as over budget when total consumed exceeds total target', () => {
    const budget = computeWeeklyBudget([
      day({ calorieTarget: 2000, caloriesConsumed: 2500 }),
      day({ calorieTarget: 2000, caloriesConsumed: 2200 }),
    ]);
    expect(budget.calorieVariance).toBe(700);
    expect(budget.isOverBudget).toBe(true);
  });

  test('one over-target day can be offset by an under-target day, without flagging over budget', () => {
    const budget = computeWeeklyBudget([
      day({ calorieTarget: 2000, caloriesConsumed: 2500 }), // +500
      day({ calorieTarget: 2000, caloriesConsumed: 1400 }), // -600
    ]);
    expect(budget.calorieVariance).toBe(-100);
    expect(budget.isOverBudget).toBe(false);
  });

  test('an empty week (no days at all) does not divide by zero or crash', () => {
    const budget = computeWeeklyBudget([]);
    expect(budget).toMatchObject({
      calorieTargetTotal: 0,
      caloriesConsumedTotal: 0,
      calorieVariance: 0,
      isOverBudget: false,
    });
  });

  test('sums protein totals across the week too', () => {
    const budget = computeWeeklyBudget([
      day({ proteinTarget: 200, proteinConsumedG: 180 }),
      day({ proteinTarget: 200, proteinConsumedG: 210 }),
    ]);
    expect(budget.proteinTargetTotal).toBe(400);
    expect(budget.proteinConsumedTotal).toBe(390);
  });
});
