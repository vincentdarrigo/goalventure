import { eq, sql } from 'drizzle-orm';

import { db } from '../client';
import { userProfile } from '../schema';

export type UserProfileInput = {
  timezone: string;
  currentWeight?: number | null;
  targetWeight?: number | null;
  hydrationGoalOz: number;
  units: 'imperial' | 'metric';
};

/** The app is single-user/single-device; there is at most one profile row. */
export async function getUserProfile() {
  const rows = await db.select().from(userProfile).limit(1);
  return rows[0] ?? null;
}

export async function createUserProfile(input: UserProfileInput) {
  const rows = await db.insert(userProfile).values(input).returning();
  return rows[0];
}

export async function updateUserProfile(id: number, input: Partial<UserProfileInput>) {
  const rows = await db
    .update(userProfile)
    .set({ ...input, updatedAt: sql`(current_timestamp)` })
    .where(eq(userProfile.id, id))
    .returning();
  return rows[0];
}
