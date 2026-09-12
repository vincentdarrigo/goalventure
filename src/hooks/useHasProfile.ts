import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';

import { db } from '@/src/db/client';
import { userProfile } from '@/src/db/schema';

/**
 * Live-reads whether a UserProfile row exists yet, so the root layout can
 * gate navigation into onboarding vs. the main tabs. Returns `undefined`
 * while the initial read is in flight.
 */
export function useHasProfile(): boolean | undefined {
  const { data, error } = useLiveQuery(db.select().from(userProfile).limit(1));

  if (error) {
    throw error;
  }

  return data ? data.length > 0 : undefined;
}
