import { DateTime } from 'luxon';
import { useMemo } from 'react';

import { logFood } from '@/src/db/repositories/foodLogRepo';
import type { ResolvedDayType } from '@/src/domain/types';
import { onceGuard } from '@/src/domain/util/onceGuard';

export interface LogMealInput {
  description: string;
  calories: number;
  proteinG: number;
  sourcePresetId?: number;
  sourceIngredientId?: number;
  sourceStackId?: number;
  mealSlot?: string;
}

/** Duplicate-tap-guarded meal logging, timestamped at the moment of the call. */
export function useLogMeal(yesterday: ResolvedDayType, today: ResolvedDayType, zone: string) {
  return useMemo(
    () =>
      onceGuard((input: LogMealInput) =>
        logFood({
          ...input,
          dateTime: DateTime.now().setZone(zone),
          yesterday,
          today,
        })
      ),
    [yesterday, today, zone]
  );
}
