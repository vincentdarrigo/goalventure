export interface WeightChange {
  startingWeight: number;
  currentWeight: number;
  /** current - starting; negative means weight lost since the starting point. */
  changeFromStart: number;
  targetWeight: number | null;
  /** current - target; positive means still above target. Null if no target is set. */
  remainingToTarget: number | null;
}

export function computeWeightChange(
  startingWeight: number,
  currentWeight: number,
  targetWeight: number | null
): WeightChange {
  return {
    startingWeight,
    currentWeight,
    changeFromStart: currentWeight - startingWeight,
    targetWeight,
    remainingToTarget: targetWeight === null ? null : currentWeight - targetWeight,
  };
}
