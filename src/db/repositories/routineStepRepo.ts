import { asc, eq } from 'drizzle-orm';

import { db } from '../client';
import { routineStep } from '../schema';

export type RoutineStepRow = typeof routineStep.$inferSelect;

export type RoutineStepInput = {
  dayTypeId: number;
  label: string;
  scheduledTime?: string | null;
  order: number;
  category?: string | null;
  defaultHydrationOz?: number | null;
};

/** Live-query-able: all routine steps for a day type, in display order. */
export function routineStepsByDayTypeQuery(dayTypeId: number) {
  return db
    .select()
    .from(routineStep)
    .where(eq(routineStep.dayTypeId, dayTypeId))
    .orderBy(asc(routineStep.order), asc(routineStep.id));
}

export async function createRoutineStep(input: RoutineStepInput) {
  const rows = await db.insert(routineStep).values(input).returning();
  return rows[0];
}

export async function updateRoutineStep(id: number, input: Partial<RoutineStepInput>) {
  const rows = await db.update(routineStep).set(input).where(eq(routineStep.id, id)).returning();
  return rows[0];
}

export async function deleteRoutineStep(id: number) {
  await db.delete(routineStep).where(eq(routineStep.id, id));
}
