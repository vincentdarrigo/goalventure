import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';

import * as schema from './schema.js';

/**
 * Test-only substitute for `./client`. Runs the real schema and real
 * committed migrations against an embedded, in-memory Postgres-compatible
 * database (PGlite — a pure WASM binary, no Docker or external Postgres
 * needed), mirroring the mobile app's better-sqlite3 test harness.
 */
export async function createTestDb() {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: './src/db/migrations' });
  return { db, client };
}
