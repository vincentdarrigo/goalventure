import type { DateTime } from 'luxon';

import { anchorTimeToDate } from '../datetime';
import type { FastingState } from '../fasting/fastingState';

export type SupplementTiming = 'fasted' | 'with_meal' | 'bedtime' | 'pre_workout' | 'specific_time';
export type SupplementDoseStatus = 'pending' | 'taken' | 'skipped';
export type SupplementUrgency = 'normal' | 'overdue' | 'missed_window';

export interface SupplementSummary {
  id: number;
  name: string;
  dosageAmount: number;
  dosageUnit: string;
  timing: SupplementTiming;
  specificTime: string | null;
  order: number;
}

export interface SupplementChecklistItem {
  supplementId: number;
  name: string;
  dosageLabel: string;
  timing: SupplementTiming;
  status: SupplementDoseStatus;
  urgency: SupplementUrgency;
}

/**
 * Flags a still-pending dose as overdue/missed based on its timing flag.
 * Deliberately conservative: `bedtime`/`with_meal`/`pre_workout` have no
 * reliable signal to compute urgency from yet (no bedtime setting, no
 * workout-step cross-reference), so they stay 'normal' rather than guessing.
 */
export function computeSupplementUrgency(
  timing: SupplementTiming,
  specificTime: string | null,
  status: SupplementDoseStatus,
  fastingState: FastingState,
  now: DateTime,
  zone: string,
  today: string
): SupplementUrgency {
  if (status !== 'pending') return 'normal';

  if (timing === 'fasted') {
    // The eating window opening means a fasted-only supplement's window has passed for today.
    return fastingState.phase === 'eating' ? 'missed_window' : 'normal';
  }

  if (timing === 'specific_time' && specificTime) {
    const due = anchorTimeToDate(today, specificTime, zone);
    return now > due ? 'overdue' : 'normal';
  }

  return 'normal';
}

export function buildSupplementChecklist(
  supplements: readonly SupplementSummary[],
  statusBySupplementId: Readonly<Record<number, SupplementDoseStatus>>,
  fastingState: FastingState,
  now: DateTime,
  zone: string,
  today: string
): SupplementChecklistItem[] {
  return [...supplements]
    .sort((a, b) => a.order - b.order || a.id - b.id)
    .map((s) => {
      const status = statusBySupplementId[s.id] ?? 'pending';
      return {
        supplementId: s.id,
        name: s.name,
        dosageLabel: `${s.dosageAmount}${s.dosageUnit}`,
        timing: s.timing,
        status,
        urgency: computeSupplementUrgency(s.timing, s.specificTime, status, fastingState, now, zone, today),
      };
    });
}
