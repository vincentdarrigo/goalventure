import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';

import {
  routineCompletionsByDateQuery,
  setRoutineStepStatus,
} from '@/src/db/repositories/routineCompletionRepo';
import { routineStepsByDayTypeQuery } from '@/src/db/repositories/routineStepRepo';
import { nextStep, type RoutineStepStatus } from '@/src/domain/routine/nextStep';

export interface TodayRoutineStep {
  id: number;
  label: string;
  order: number;
  scheduledTime: string | null;
  category: string | null;
  status: RoutineStepStatus;
}

export type UseTodayRoutineResult =
  | { status: 'loading' }
  | {
      status: 'ready';
      steps: TodayRoutineStep[];
      next: TodayRoutineStep | null;
      setStepStatus: (stepId: number, status: RoutineStepStatus) => Promise<void>;
    };

/** The habit-stack checklist for a specific day type on a specific date. */
export function useTodayRoutine(dayTypeId: number, date: string): UseTodayRoutineResult {
  const stepsQuery = useLiveQuery(routineStepsByDayTypeQuery(dayTypeId));
  const completionsQuery = useLiveQuery(routineCompletionsByDateQuery(date));

  if (!stepsQuery.data || !completionsQuery.data) {
    return { status: 'loading' };
  }

  const statusByStepId: Record<number, RoutineStepStatus> = Object.fromEntries(
    completionsQuery.data.map((c) => [c.routineStepId, c.status as RoutineStepStatus])
  );

  const steps: TodayRoutineStep[] = stepsQuery.data.map((s) => ({
    id: s.id,
    label: s.label,
    order: s.order,
    scheduledTime: s.scheduledTime,
    category: s.category,
    status: statusByStepId[s.id] ?? 'pending',
  }));

  return {
    status: 'ready',
    steps,
    next: nextStep(steps, statusByStepId),
    setStepStatus: (stepId, status) => setRoutineStepStatus(date, stepId, status),
  };
}
