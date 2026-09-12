import { DateTime } from 'luxon';

/**
 * Anchors an "HH:mm" wall-clock time onto a calendar date, in a specific IANA
 * zone. This is the one place clock boundaries get built — every eating-window
 * and fasting-state calculation goes through this so DST transitions resolve
 * correctly by construction (Luxon normalizes gaps/ambiguity internally),
 * rather than via manual UTC-offset arithmetic.
 */
export function anchorTimeToDate(isoDate: string, hhmm: string, zone: string): DateTime {
  const [hour, minute] = hhmm.split(':').map(Number);
  return DateTime.fromISO(isoDate, { zone }).set({
    hour,
    minute,
    second: 0,
    millisecond: 0,
  });
}

/** Today's calendar date, as 'YYYY-MM-DD', in the given IANA zone. */
export function todayIsoInZone(zone: string): string {
  const today = DateTime.now().setZone(zone).toISODate();
  if (!today) {
    throw new Error(`Failed to resolve today's date in zone "${zone}"`);
  }
  return today;
}

/** The Monday..Sunday range (inclusive, 'YYYY-MM-DD') containing `isoDate`. Pure calendar math — DST-immune. */
export function getWeekRange(isoDate: string): { start: string; end: string } {
  const date = DateTime.fromISO(isoDate);
  const monday = date.minus({ days: date.weekday - 1 }); // Luxon weekday: 1=Mon..7=Sun
  const sunday = monday.plus({ days: 6 });
  const start = monday.toISODate();
  const end = sunday.toISODate();
  if (!start || !end) {
    throw new Error(`Failed to compute week range for "${isoDate}"`);
  }
  return { start, end };
}

/** Every 'YYYY-MM-DD' date from `start` to `end`, inclusive. */
export function enumerateDatesInRange(start: string, end: string): string[] {
  const startDate = DateTime.fromISO(start);
  const endDate = DateTime.fromISO(end);
  const dates: string[] = [];
  for (let d = startDate; d <= endDate; d = d.plus({ days: 1 })) {
    const iso = d.toISODate();
    if (iso) dates.push(iso);
  }
  return dates;
}
