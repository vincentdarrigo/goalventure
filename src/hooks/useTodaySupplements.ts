import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';
import { DateTime } from 'luxon';

import {
  clearSupplementDose,
  recordSupplementDose,
  supplementDosesForDateQuery,
} from '@/src/db/repositories/supplementDoseRepo';
import { supplementsQuery } from '@/src/db/repositories/supplementRepo';
import type { FastingState } from '@/src/domain/fasting/fastingState';
import {
  buildSupplementChecklist,
  type SupplementChecklistItem,
  type SupplementDoseStatus,
} from '@/src/domain/supplements/timing';
import type { ResolvedDayType } from '@/src/domain/types';

export type UseTodaySupplementsResult =
  | { status: 'loading' }
  | {
      status: 'ready';
      items: SupplementChecklistItem[];
      setStatus: (supplementId: number, status: SupplementDoseStatus) => Promise<void>;
    };

/** The supplement checklist for `today`, reconciled against `fastingState` for urgency. */
export function useTodaySupplements(
  today: ResolvedDayType,
  fastingState: FastingState,
  zone: string
): UseTodaySupplementsResult {
  const { data: supplements } = useLiveQuery(supplementsQuery());
  const { data: doses } = useLiveQuery(supplementDosesForDateQuery(today.date));

  if (!supplements || !doses) {
    return { status: 'loading' };
  }

  const statusBySupplementId: Record<number, 'taken' | 'skipped'> = Object.fromEntries(
    doses.map((d) => [d.supplementId, d.status as 'taken' | 'skipped'])
  );

  const now = DateTime.now().setZone(zone);
  const items = buildSupplementChecklist(supplements, statusBySupplementId, fastingState, now, zone, today.date);

  async function setStatus(supplementId: number, status: SupplementDoseStatus) {
    if (status === 'pending') {
      await clearSupplementDose(supplementId, today.date);
      return;
    }
    const supplement = supplements?.find((s) => s.id === supplementId);
    if (!supplement) return;
    await recordSupplementDose({
      supplementId,
      date: today.date,
      status,
      nameSnapshot: supplement.name,
      dosageAmountSnapshot: supplement.dosageAmount,
      dosageUnitSnapshot: supplement.dosageUnit,
      today,
    });
  }

  return { status: 'ready', items, setStatus };
}
