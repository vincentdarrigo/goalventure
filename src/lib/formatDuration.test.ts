import { Duration } from 'luxon';

import { formatDuration } from './formatDuration';

test.each([
  [Duration.fromObject({ hours: 3, minutes: 42 }), '3h 42m'],
  [Duration.fromObject({ hours: 2 }), '2h'],
  [Duration.fromObject({ minutes: 45 }), '45m'],
  [Duration.fromMillis(0), '0m'],
  [Duration.fromObject({ minutes: -5 }), '0m'],
])('formats %s as %s', (duration, expected) => {
  expect(formatDuration(duration)).toBe(expected);
});
