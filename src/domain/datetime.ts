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
