import { computeHydrationProgress } from './hydration';

describe('computeHydrationProgress', () => {
  test('an empty day is zero progress toward the goal', () => {
    const progress = computeHydrationProgress([], 100);
    expect(progress).toEqual({ consumedOz: 0, goalOz: 100, percent: 0, remainingOz: 100, overGoal: false });
  });

  test('sums multiple entries', () => {
    const progress = computeHydrationProgress([{ ounces: 16 }, { ounces: 24 }, { ounces: 8 }], 100);
    expect(progress.consumedOz).toBe(48);
  });

  test('logging past the goal is never clamped — percent and consumed both exceed 100%/goal', () => {
    const progress = computeHydrationProgress([{ ounces: 132 }], 100);
    expect(progress.consumedOz).toBe(132);
    expect(progress.percent).toBe(132);
    expect(progress.remainingOz).toBe(-32);
    expect(progress.overGoal).toBe(true);
  });

  test('exactly at goal is not flagged as over', () => {
    const progress = computeHydrationProgress([{ ounces: 100 }], 100);
    expect(progress.overGoal).toBe(false);
    expect(progress.remainingOz).toBe(0);
  });

  test('a zero goal does not divide by zero', () => {
    const progress = computeHydrationProgress([{ ounces: 16 }], 0);
    expect(progress.percent).toBe(0);
    expect(Number.isFinite(progress.percent)).toBe(true);
  });
});
