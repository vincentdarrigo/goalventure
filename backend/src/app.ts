import path from 'node:path';
import { fileURLToPath } from 'node:url';

import fastifyStatic from '@fastify/static';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import Fastify from 'fastify';

import type * as schema from './db/schema.js';
import { registerAccountRoutes } from './routes/accounts.js';
import { registerCheckInItemRoutes } from './routes/checkInItems.js';
import { registerDailySummaryRoutes } from './routes/dailySummaries.js';
import { registerDeviceLinkCodeRoutes } from './routes/deviceLinkCodes.js';
import { registerPairingRoutes } from './routes/pairings.js';

// Sibling of dist/ (after `tsc`) and of src/ (under `tsx`) alike — public/
// is committed source, not generated, so both layouts find it the same way.
const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../public');

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

  app.register(fastifyStatic, { root: publicDir });

  app.get('/health', async () => ({ status: 'ok' }));

  registerAccountRoutes(app, db);
  registerDeviceLinkCodeRoutes(app, db);
  registerPairingRoutes(app, db);
  registerCheckInItemRoutes(app, db);
  registerDailySummaryRoutes(app, db);

  return app;
}
