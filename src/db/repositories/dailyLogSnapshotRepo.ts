import { and, eq, gte, lte } from 'drizzle-orm';

import { db } from '@/src/db/client';
import type { ResolvedDayType } from '@/src/domain/types';

import { dailyLogSnapshot } from '../schema';

export type DailyLogSnapshotRow = typeof dailyLogSnapshot.$inferSelect;

export function dailyLogSnapshotByDateQuery(date: string) {
  return db.select().from(dailyLogSnapshot).where(eq(dailyLogSnapshot.date, date)).limit(1);
}

/** Live-query-able: snapshots for every date in [startDate, endDate], inclusive. */
export function dailyLogSnapshotsInRangeQuery(startDate: string, endDate: string) {
  return db
    .select()
    .from(dailyLogSnapshot)
    .where(and(gte(dailyLogSnapshot.date, startDate), lte(dailyLogSnapshot.date, endDate)));
}

/**
 * Freezes what `resolveDayType()` produced for `resolved.date`, the first
 * time any activity is logged for that date. Idempotent — safe to call from
 * every write repo on every write; only the first call for a given date has
 * any effect. This is what makes a later DayType/WeeklySchedule edit leave
 * already-touched days alone while still applying everywhere else.
 */
export async function ensureDailySnapshot(resolved: ResolvedDayType) {
  await db
    .insert(dailyLogSnapshot)
    .values({
      date: resolved.date,
      resolvedDayTypeId: resolved.dayType.id,
      dayTypeName: resolved.dayType.name,
      eatingWindowStart: resolved.dayType.eatingWindowStart,
      eatingWindowEnd: resolved.dayType.eatingWindowEnd,
      isFastDay: resolved.dayType.isFastDay,
      calorieTarget: resolved.dayType.calorieTarget,
      proteinTarget: resolved.dayType.proteinTarget,
      sourceOverrideId: resolved.source === 'override' ? resolved.sourceOverrideId : null,
    })
    .onConflictDoNothing({ target: dailyLogSnapshot.date });
}
