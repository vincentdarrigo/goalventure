import type { Duration } from 'luxon';

/** Formats a Luxon Duration as a compact "3h 42m" / "45m" / "0m" string, for countdown display. */
export function formatDuration(duration: Duration): string {
  const totalMinutes = Math.max(0, Math.round(duration.as('minutes')));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}
