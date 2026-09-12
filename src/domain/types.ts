export interface DayType {
  id: number;
  name: string;
  // "HH:mm". Both null + isFastDay true = a hard fast (e.g. the Tuesday 24-hour
  // fast). Both null + isFastDay false = flexible/unrestricted eating with no
  // fixed window (e.g. Travel/Wildcard, Game Day). Both set = a timed window;
  // end <= start means the window crosses midnight.
  eatingWindowStart: string | null;
  eatingWindowEnd: string | null;
  isFastDay: boolean;
  calorieTarget: number;
  proteinTarget: number;
}

export interface DateOverrideRecord {
  id: number;
  date: string; // 'YYYY-MM-DD'
  overrideDayTypeId: number;
}

export type ResolvedDayType =
  | { date: string; dayType: DayType; source: 'schedule' }
  | { date: string; dayType: DayType; source: 'override'; sourceOverrideId: number };
