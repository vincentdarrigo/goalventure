import { db } from '@/src/db/client';
import { weeklySchedule } from '../schema';

export type WeeklyScheduleRow = typeof weeklySchedule.$inferSelect;

/** Live-query-able: raw weekday -> dayTypeId rows (missing weekdays are unconfigured). */
export function weeklyScheduleQuery() {
  return db.select().from(weeklySchedule);
}

export async function setWeekdayDayType(weekday: number, dayTypeId: number) {
  await db
    .insert(weeklySchedule)
    .values({ weekday, dayTypeId })
    .onConflictDoUpdate({ target: weeklySchedule.weekday, set: { dayTypeId } });
}
