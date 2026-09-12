import { eq } from 'drizzle-orm';

import { db } from '@/src/db/client';
import type { RoutineStepStatus } from '@/src/domain/routine/nextStep';
import type { ResolvedDayType } from '@/src/domain/types';

import { ensureDailySnapshot } from './dailyLogSnapshotRepo';
import { routineCompletion } from '../schema';

export type RoutineCompletionRow = typeof routineCompletion.$inferSelect;

/** Live-query-able: all completion rows for a date. Absent rows mean "pending". */
export function routineCompletionsByDateQuery(date: string) {
  return db.select().from(routineCompletion).where(eq(routineCompletion.date, date));
}

export async function setRoutineStepStatus(
  date: string,
  routineStepId: number,
  status: RoutineStepStatus,
  resolvedToday: ResolvedDayType
) {
  await ensureDailySnapshot(resolvedToday);
  const completedAt = status === 'completed' ? new Date().toISOString() : null;
  await db
    .insert(routineCompletion)
    .values({ date, routineStepId, status, completedAt })
    .onConflictDoUpdate({
      target: [routineCompletion.date, routineCompletion.routineStepId],
      set: { status, completedAt },
    });
}
