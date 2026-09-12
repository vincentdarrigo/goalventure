import { useLiveQuery } from 'drizzle-orm/expo-sqlite/query';

import { type UserProfileRow, userProfileQuery } from '@/src/db/repositories/userProfileRepo';

export type { UserProfileRow };

/** Live-reads the single UserProfile row. Undefined while the initial read is in flight. */
export function useUserProfile(): UserProfileRow | null | undefined {
  const { data, error } = useLiveQuery(userProfileQuery());

  if (error) {
    throw error;
  }

  return data ? (data[0] ?? null) : undefined;
}
