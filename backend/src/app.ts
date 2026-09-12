import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import Fastify from 'fastify';

import type * as schema from './db/schema.js';
import { registerAccountRoutes } from './routes/accounts.js';
import { registerDeviceLinkCodeRoutes } from './routes/deviceLinkCodes.js';
import { registerPairingRoutes } from './routes/pairings.js';

/**
 * db is injected as a plain parameter rather than a Fastify decoration —
 * keeps the type generic over which Drizzle driver backs it (real
 * node-postgres in production, PGlite in tests) without Fastify's
 * module-augmentation ceremony for decorated properties.
 */
export function buildApp<TQueryResult extends PgQueryResultHKT>(
  db: PgDatabase<TQueryResult, typeof schema>,
  options: { logger?: boolean } = {}
) {
  const app = Fastify({ logger: options.logger ?? true });

  app.get('/health', async () => ({ status: 'ok' }));

  registerAccountRoutes(app, db);
  registerDeviceLinkCodeRoutes(app, db);
  registerPairingRoutes(app, db);

  return app;
}
