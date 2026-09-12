import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';

import { resolveDayType } from '@/src/domain/day-type/resolveDayType';
import { computeFastingState, type FastingState } from '@/src/domain/fasting/fastingState';
import type { ResolvedDayType } from '@/src/domain/types';

import { useDayTypeContext } from './useDayTypeContext';

export type UseFastingStateResult =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | {
      status: 'ready';
      fastingState: FastingState;
      yesterday: ResolvedDayType;
      today: ResolvedDayType;
    };

/** Recomputes the fasting state on this interval, so an on-screen countdown stays live. */
const REFRESH_INTERVAL_MS = 60_000;

export function useFastingState(zone: string): UseFastingStateResult {
  const context = useDayTypeContext();
  const [now, setNow] = useState(() => DateTime.now().setZone(zone));

  useEffect(() => {
    const id = setInterval(() => setNow(DateTime.now().setZone(zone)), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [zone]);

  if (!context) {
    return { status: 'loading' };
  }

  try {
    const yesterdayIso = now.minus({ days: 1 }).toISODate();
    const todayIso = now.toISODate();
    const tomorrowIso = now.plus({ days: 1 }).toISODate();
    if (!yesterdayIso || !todayIso || !tomorrowIso) {
      throw new Error('Failed to resolve calendar dates for the fasting-state window.');
    }

    const yesterday = resolveDayType(yesterdayIso, context.weeklySchedule, context.overrides, context.dayTypesById);
    const today = resolveDayType(todayIso, context.weeklySchedule, context.overrides, context.dayTypesById);
    const tomorrow = resolveDayType(tomorrowIso, context.weeklySchedule, context.overrides, context.dayTypesById);

    return {
      status: 'ready',
      fastingState: computeFastingState(now, yesterday, today, tomorrow),
      yesterday,
      today,
    };
  } catch (e) {
    return { status: 'error', error: e instanceof Error ? e : new Error(String(e)) };
  }
}
