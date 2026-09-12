/** The device's current IANA timezone name, for defaulting onboarding forms. */
export function deviceTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
