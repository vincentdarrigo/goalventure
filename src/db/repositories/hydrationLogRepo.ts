import { and, desc, eq, gte, lt } from 'drizzle-orm';
import type { DateTime } from 'luxon';

import { db } from '@/src/db/client';
import type { ResolvedDayType } from '@/src/domain/types';

import { ensureDailySnapshot } from './dailyLogSnapshotRepo';
import { hydrationLog } from '../schema';

export type HydrationLogRow = typeof hydrationLog.$inferSelect;

export type LogHydrationInput = {
  dateTime: DateTime;
  ounces: number;
  sourceLabel?: string | null;
  today: ResolvedDayType;
};

/** Live-query-able: hydration logs with an absolute UTC instant in [startIso, endIsoExclusive). */
export function hydrationLogsInRangeQuery(startIso: string, endIsoExclusive: string) {
  return db
    .select()
    .from(hydrationLog)
    .where(and(gte(hydrationLog.dateTime, startIso), lt(hydrationLog.dateTime, endIsoExclusive)))
    .orderBy(desc(hydrationLog.dateTime));
}

export async function logHydration(input: LogHydrationInput) {
  const isoInstant = input.dateTime.toUTC().toISO();
  if (!isoInstant) {
    throw new Error('Invalid dateTime passed to logHydration');
  }
  await ensureDailySnapshot(input.today);
  const rows = await db
    .insert(hydrationLog)
    .values({ dateTime: isoInstant, ounces: input.ounces, sourceLabel: input.sourceLabel ?? null })
    .returning();
  return rows[0];
}

export async function deleteHydrationLog(id: number) {
  await db.delete(hydrationLog).where(eq(hydrationLog.id, id));
}
