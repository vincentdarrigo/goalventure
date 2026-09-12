import { DateTime } from 'luxon';

import { anchorTimeToDate, todayIsoInZone } from './datetime';

describe('anchorTimeToDate', () => {
  test('anchors an HH:mm time onto a calendar date in the given zone', () => {
    const result = anchorTimeToDate('2025-06-15', '08:00', 'America/Chicago');

    expect(result.zoneName).toBe('America/Chicago');
    expect(result.toISODate()).toBe('2025-06-15');
    expect(result.hour).toBe(8);
    expect(result.minute).toBe(0);
  });

  test('produces the same UTC instant regardless of the host clock, given an explicit zone', () => {
    const chicago = anchorTimeToDate('2025-06-15', '08:00', 'America/Chicago');
    const tokyo = anchorTimeToDate('2025-06-15', '08:00', 'Asia/Tokyo');

    // Same wall-clock time, different zones -> different UTC instants.
    expect(chicago.toUTC().toISO()).not.toBe(tokyo.toUTC().toISO());
  });

  test('resolves correctly across the US spring-forward DST transition', () => {
    // 2024-03-10: America/Chicago clocks jump from 02:00 to 03:00 (CST -> CDT).
    const beforeTransition = anchorTimeToDate('2024-03-10', '01:30', 'America/Chicago');
    const afterTransition = anchorTimeToDate('2024-03-10', '03:30', 'America/Chicago');

    expect(beforeTransition.offset).toBe(-360); // CST, UTC-6
    expect(afterTransition.offset).toBe(-300); // CDT, UTC-5

    // The wall-clock gap is 2 hours, but only 1 hour actually elapsed.
    const elapsedMinutes = afterTransition.diff(beforeTransition, 'minutes').minutes;
    expect(elapsedMinutes).toBe(60);
  });

  test('resolves correctly across the US fall-back DST transition', () => {
    // 2024-11-03: America/Chicago clocks fall from 02:00 back to 01:00 (CDT -> CST).
    const beforeTransition = anchorTimeToDate('2024-11-03', '00:30', 'America/Chicago');
    const afterTransition = anchorTimeToDate('2024-11-03', '03:30', 'America/Chicago');

    expect(beforeTransition.offset).toBe(-300); // CDT, UTC-5
    expect(afterTransition.offset).toBe(-360); // CST, UTC-6

    // The wall-clock gap is 3 hours, but 4 hours actually elapsed.
    const elapsedMinutes = afterTransition.diff(beforeTransition, 'minutes').minutes;
    expect(elapsedMinutes).toBe(240);
  });
});

describe('todayIsoInZone', () => {
  test('matches Luxon’s own notion of "today" in that zone', () => {
    const expected = DateTime.now().setZone('Pacific/Auckland').toISODate();
    expect(todayIsoInZone('Pacific/Auckland')).toBe(expected);
  });

  test('returns a YYYY-MM-DD string', () => {
    expect(todayIsoInZone('UTC')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
