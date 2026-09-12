export interface HydrationEntry {
  ounces: number;
}

export interface HydrationProgress {
  consumedOz: number;
  goalOz: number;
  /** Never clamped — can exceed 100. */
  percent: number;
  /** Never clamped — goes negative once over goal. */
  remainingOz: number;
  overGoal: boolean;
}

export function computeHydrationProgress(
  entries: readonly HydrationEntry[],
  goalOz: number
): HydrationProgress {
  const consumedOz = entries.reduce((sum, entry) => sum + entry.ounces, 0);
  return {
    consumedOz,
    goalOz,
    percent: goalOz > 0 ? (consumedOz / goalOz) * 100 : 0,
    remainingOz: goalOz - consumedOz,
    overGoal: consumedOz > goalOz,
  };
}
