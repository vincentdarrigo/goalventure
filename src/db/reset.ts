import { expoDb } from './client';

/**
 * Irreversibly clears every table's data (the schema/migrations stay
 * applied). Once the UserProfile row is gone, the root layout's live
 * `useHasProfile` check flips and the app redirects to onboarding on its own
 * — no explicit navigation needed here.
 */
export async function resetAllData(): Promise<void> {
  const tables = await expoDb.getAllAsync<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name != '__drizzle_migrations'`
  );
  await expoDb.execAsync('PRAGMA foreign_keys = OFF;');
  for (const { name } of tables) {
    await expoDb.execAsync(`DELETE FROM "${name}";`);
  }
  await expoDb.execAsync('PRAGMA foreign_keys = ON;');
}
