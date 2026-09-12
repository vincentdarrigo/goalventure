import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';
import { useMemo } from 'react';

import { dateOverridesQuery } from '@/src/db/repositories/dateOverrideRepo';
import { type DayTypeRow, dayTypesQuery } from '@/src/db/repositories/dayTypeRepo';
import { weeklyScheduleQuery } from '@/src/db/repositories/weeklyScheduleRepo';
import type { DateOverrideRecord, DayType } from '@/src/domain/types';

function toDomainDayType(row: DayTypeRow): DayType {
  return {
    id: row.id,
    name: row.name,
    eatingWindowStart: row.eatingWindowStart,
    eatingWindowEnd: row.eatingWindowEnd,
    isFastDay: row.isFastDay,
    calorieTarget: row.calorieTarget,
    proteinTarget: row.proteinTarget,
  };
}

export interface DayTypeContext {
  dayTypesById: Record<number, DayType>;
  weeklySchedule: Record<number, number>;
  overrides: DateOverrideRecord[];
}

/** Loads everything `resolveDayType` needs, live. Undefined while any part is still loading. */
export function useDayTypeContext(): DayTypeContext | undefined {
  const dayTypesQueryResult = useLiveQuery(dayTypesQuery());
  const scheduleQueryResult = useLiveQuery(weeklyScheduleQuery());
  const overridesQueryResult = useLiveQuery(dateOverridesQuery());

  return useMemo(() => {
    if (!dayTypesQueryResult.data || !scheduleQueryResult.data || !overridesQueryResult.data) {
      return undefined;
    }
    return {
      dayTypesById: Object.fromEntries(dayTypesQueryResult.data.map((row) => [row.id, toDomainDayType(row)])),
      weeklySchedule: Object.fromEntries(scheduleQueryResult.data.map((row) => [row.weekday, row.dayTypeId])),
      overrides: overridesQueryResult.data,
    };
  }, [dayTypesQueryResult.data, scheduleQueryResult.data, overridesQueryResult.data]);
}
