import { and, eq } from 'drizzle-orm';

import { db } from '@/src/db/client';
import type { ResolvedDayType } from '@/src/domain/types';

import { ensureDailySnapshot } from './dailyLogSnapshotRepo';
import { supplementDose } from '../schema';

export type SupplementDoseRow = typeof supplementDose.$inferSelect;

/** Live-query-able: dose rows for a date. Absence of a row for a supplement means "pending". */
export function supplementDosesForDateQuery(date: string) {
  return db.select().from(supplementDose).where(eq(supplementDose.date, date));
}

export type RecordSupplementDoseInput = {
  supplementId: number;
  date: string;
  status: 'taken' | 'skipped';
  nameSnapshot: string;
  dosageAmountSnapshot: number;
  dosageUnitSnapshot: string;
  today: ResolvedDayType;
};

export async function recordSupplementDose(input: RecordSupplementDoseInput) {
  await ensureDailySnapshot(input.today);
  const takenAt = input.status === 'taken' ? new Date().toISOString() : null;
  await db
    .insert(supplementDose)
    .values({
      supplementId: input.supplementId,
      date: input.date,
      status: input.status,
      takenAt,
      nameSnapshot: input.nameSnapshot,
      dosageAmountSnapshot: input.dosageAmountSnapshot,
      dosageUnitSnapshot: input.dosageUnitSnapshot,
    })
    .onConflictDoUpdate({
      target: [supplementDose.supplementId, supplementDose.date],
      set: {
        status: input.status,
        takenAt,
        nameSnapshot: input.nameSnapshot,
        dosageAmountSnapshot: input.dosageAmountSnapshot,
        dosageUnitSnapshot: input.dosageUnitSnapshot,
      },
    });
}

/** Reverts a dose back to "pending" by deleting its row — pending is never stored explicitly. */
export async function clearSupplementDose(supplementId: number, date: string) {
  await db
    .delete(supplementDose)
    .where(and(eq(supplementDose.supplementId, supplementId), eq(supplementDose.date, date)));
}
