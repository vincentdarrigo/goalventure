import { useUserProfile } from './useUserProfile';

/**
 * Whether a UserProfile row exists yet, so the root layout can gate
 * navigation into onboarding vs. the main tabs. Undefined while loading.
 */
export function useHasProfile(): boolean | undefined {
  const profile = useUserProfile();
  return profile === undefined ? undefined : profile !== null;
}
