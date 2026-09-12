import { asc, desc, eq } from 'drizzle-orm';

import { db } from '@/src/db/client';

import { weightLog } from '../schema';

export type WeightLogRow = typeof weightLog.$inferSelect;

/** Live-query-able: every weight entry, oldest first (for trend display). */
export function weightLogsQuery() {
  return db.select().from(weightLog).orderBy(asc(weightLog.date));
}

/** Live-query-able: the single most recent weight entry, if any. */
export function latestWeightLogQuery() {
  return db.select().from(weightLog).orderBy(desc(weightLog.date)).limit(1);
}

export async function logWeight(date: string, weightValue: number) {
  const rows = await db
    .insert(weightLog)
    .values({ date, weight: weightValue })
    .onConflictDoUpdate({ target: weightLog.date, set: { weight: weightValue } })
    .returning();
  return rows[0];
}

export async function deleteWeightLog(id: number) {
  await db.delete(weightLog).where(eq(weightLog.id, id));
}
