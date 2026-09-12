import { asc, eq, isNull } from 'drizzle-orm';

import { db } from '@/src/db/client';

import { supplement } from '../schema';

export type SupplementRow = typeof supplement.$inferSelect;

export type SupplementInput = {
  name: string;
  dosageAmount: number;
  dosageUnit: string;
  timing: 'fasted' | 'with_meal' | 'bedtime' | 'pre_workout' | 'specific_time';
  specificTime?: string | null;
  notes?: string | null;
  order?: number;
};

/** Live-query-able: all non-archived supplements, in display order. */
export function supplementsQuery() {
  return db
    .select()
    .from(supplement)
    .where(isNull(supplement.archivedAt))
    .orderBy(asc(supplement.order), asc(supplement.id));
}

export function supplementByIdQuery(id: number) {
  return db.select().from(supplement).where(eq(supplement.id, id)).limit(1);
}

export async function createSupplement(input: SupplementInput) {
  const rows = await db.insert(supplement).values(input).returning();
  return rows[0];
}

export async function updateSupplement(id: number, input: Partial<SupplementInput>) {
  const rows = await db.update(supplement).set(input).where(eq(supplement.id, id)).returning();
  return rows[0];
}

/** Soft-delete only — supplementDose rows may reference this supplement. */
export async function archiveSupplement(id: number) {
  await db
    .update(supplement)
    .set({ archivedAt: new Date().toISOString() })
    .where(eq(supplement.id, id));
}
