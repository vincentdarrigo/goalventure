import { desc, eq } from 'drizzle-orm';

import { db } from '@/src/db/client';
import { dateOverride } from '../schema';

export type DateOverrideRow = typeof dateOverride.$inferSelect;

/** Live-query-able: all overrides, most recent date first. */
export function dateOverridesQuery() {
  return db.select().from(dateOverride).orderBy(desc(dateOverride.date));
}

export async function setDateOverride(date: string, overrideDayTypeId: number, reason?: string) {
  const rows = await db
    .insert(dateOverride)
    .values({ date, overrideDayTypeId, reason })
    .onConflictDoUpdate({
      target: dateOverride.date,
      set: { overrideDayTypeId, reason },
    })
    .returning();
  return rows[0];
}

export async function removeDateOverride(id: number) {
  await db.delete(dateOverride).where(eq(dateOverride.id, id));
}
