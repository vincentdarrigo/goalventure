import { DateTime, Duration } from 'luxon';

import type { FastingState } from '../fasting/fastingState';
import {
  buildSupplementChecklist,
  computeSupplementUrgency,
  type SupplementSummary,
} from './timing';

const ZONE = 'America/Chicago';

function at(isoDate: string, hhmm: string): DateTime {
  const [hour, minute] = hhmm.split(':').map(Number);
  return DateTime.fromISO(isoDate, { zone: ZONE }).set({ hour, minute });
}

function fasting(phase: 'eating' | 'fasting'): FastingState {
  return {
    phase,
    isFastDay: false,
    windowStartsAt: null,
    windowEndsAt: null,
    timeRemaining: Duration.fromMillis(0),
  };
}

describe('computeSupplementUrgency', () => {
  test('a resolved dose (taken/skipped) is never flagged, regardless of timing', () => {
    expect(computeSupplementUrgency('fasted', null, 'taken', fasting('eating'), at('2025-06-16', '12:00'), ZONE, '2025-06-16')).toBe('normal');
    expect(computeSupplementUrgency('specific_time', '07:00', 'skipped', fasting('fasting'), at('2025-06-16', '12:00'), ZONE, '2025-06-16')).toBe('normal');
  });

  test('a fasted supplement is normal while still fasting', () => {
    expect(computeSupplementUrgency('fasted', null, 'pending', fasting('fasting'), at('2025-06-16', '06:00'), ZONE, '2025-06-16')).toBe('normal');
  });

  test('a fasted supplement missed its window once eating has started', () => {
    expect(computeSupplementUrgency('fasted', null, 'pending', fasting('eating'), at('2025-06-16', '10:00'), ZONE, '2025-06-16')).toBe('missed_window');
  });

  test('a specific_time supplement is normal before its time', () => {
    expect(computeSupplementUrgency('specific_time', '20:00', 'pending', fasting('eating'), at('2025-06-16', '19:00'), ZONE, '2025-06-16')).toBe('normal');
  });

  test('a specific_time supplement is overdue after its time passes', () => {
    expect(computeSupplementUrgency('specific_time', '20:00', 'pending', fasting('eating'), at('2025-06-16', '20:30'), ZONE, '2025-06-16')).toBe('overdue');
  });

  test('bedtime, with_meal, and pre_workout never get flagged (no reliable signal yet)', () => {
    for (const timing of ['bedtime', 'with_meal', 'pre_workout'] as const) {
      expect(computeSupplementUrgency(timing, null, 'pending', fasting('eating'), at('2025-06-16', '23:00'), ZONE, '2025-06-16')).toBe('normal');
    }
  });
});

describe('buildSupplementChecklist', () => {
  const items: SupplementSummary[] = [
    { id: 2, name: 'B', dosageAmount: 1, dosageUnit: 'g', timing: 'with_meal', specificTime: null, order: 2 },
    { id: 1, name: 'A', dosageAmount: 300, dosageUnit: 'mg', timing: 'bedtime', specificTime: null, order: 1 },
  ];

  test('sorts by order, then id', () => {
    const checklist = buildSupplementChecklist(items, {}, fasting('eating'), at('2025-06-16', '12:00'), ZONE, '2025-06-16');
    expect(checklist.map((c) => c.name)).toEqual(['A', 'B']);
  });

  test('a supplement with no dose row defaults to pending', () => {
    const checklist = buildSupplementChecklist(items, {}, fasting('eating'), at('2025-06-16', '12:00'), ZONE, '2025-06-16');
    expect(checklist.every((c) => c.status === 'pending')).toBe(true);
  });

  test('formats a dosage label from amount + unit', () => {
    const checklist = buildSupplementChecklist(items, {}, fasting('eating'), at('2025-06-16', '12:00'), ZONE, '2025-06-16');
    expect(checklist.find((c) => c.name === 'A')?.dosageLabel).toBe('300mg');
  });

  test('reflects a recorded status', () => {
    const checklist = buildSupplementChecklist(items, { 1: 'taken' }, fasting('eating'), at('2025-06-16', '12:00'), ZONE, '2025-06-16');
    expect(checklist.find((c) => c.name === 'A')?.status).toBe('taken');
  });
});
