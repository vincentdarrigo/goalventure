import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import * as schema from './schema';

/**
 * Test-only substitute for `./client`. Runs the real schema and real
 * committed migrations against an in-memory better-sqlite3 database (a pure
 * Node native module, no Expo/React Native runtime needed), so repository
 * tests exercise genuine SQL rather than a hand-rolled mock. Wired in via
 * jest.config.js's moduleNameMapper for the "domain" project only — app code
 * always uses `./client` (expo-sqlite) and never imports this file directly.
 */
const sqlite = new Database(':memory:');
migrate(drizzle(sqlite), { migrationsFolder: './src/db/migrations' });

export const db = drizzle(sqlite, { schema });

/** Clears every table between tests, without re-running migrations. */
export function resetTestDb() {
  const tables = sqlite
    .prepare(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name != '__drizzle_migrations'`
    )
    .all() as { name: string }[];
  for (const { name } of tables) {
    sqlite.exec(`DELETE FROM "${name}"`);
  }
}
