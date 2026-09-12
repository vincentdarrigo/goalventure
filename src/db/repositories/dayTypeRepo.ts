import { asc, eq, isNull } from 'drizzle-orm';

import { db } from '@/src/db/client';
import { dayType } from '../schema';

export type DayTypeRow = typeof dayType.$inferSelect;

export type DayTypeInput = {
  name: string;
  eatingWindowStart?: string | null;
  eatingWindowEnd?: string | null;
  isFastDay: boolean;
  calorieTarget: number;
  proteinTarget: number;
  notes?: string | null;
};

/** Live-query-able: all non-archived day types, alphabetical. */
export function dayTypesQuery() {
  return db.select().from(dayType).where(isNull(dayType.archivedAt)).orderBy(asc(dayType.name));
}

/** Live-query-able: a single day type by id (archived or not, so historical links still resolve). */
export function dayTypeByIdQuery(id: number) {
  return db.select().from(dayType).where(eq(dayType.id, id)).limit(1);
}

export async function createDayType(input: DayTypeInput) {
  const rows = await db.insert(dayType).values(input).returning();
  return rows[0];
}

export async function updateDayType(id: number, input: Partial<DayTypeInput>) {
  const rows = await db.update(dayType).set(input).where(eq(dayType.id, id)).returning();
  return rows[0];
}

/** Soft-delete only — DayType rows may be referenced by historical snapshots/logs. */
export async function archiveDayType(id: number) {
  await db
    .update(dayType)
    .set({ archivedAt: new Date().toISOString() })
    .where(eq(dayType.id, id));
}
