import { deviceTimezone } from './datetime';

test('returns a non-empty IANA-style timezone name', () => {
  expect(deviceTimezone()).toMatch(/^[A-Za-z_]+(\/[A-Za-z_]+)*$/);
});
