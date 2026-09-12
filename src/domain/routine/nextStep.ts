export type RoutineStepStatus = 'pending' | 'completed' | 'skipped' | 'snoozed';

export interface RoutineStepSummary {
  id: number;
  label: string;
  order: number;
}

/**
 * The next actionable step for a day: the first step, in order, whose status
 * is `pending` or `snoozed` (not yet resolved). `completed` and `skipped`
 * both count as resolved — a skipped step does not block progress to the
 * next one. A step with no completion row yet defaults to `pending`. Ties in
 * `order` break by id, so the result is always deterministic.
 */
export function nextStep<T extends RoutineStepSummary>(
  steps: readonly T[],
  statusByStepId: Readonly<Record<number, RoutineStepStatus>>
): T | null {
  const sorted = [...steps].sort((a, b) => a.order - b.order || a.id - b.id);
  for (const step of sorted) {
    const status = statusByStepId[step.id] ?? 'pending';
    if (status === 'pending' || status === 'snoozed') {
      return step;
    }
  }
  return null;
}
