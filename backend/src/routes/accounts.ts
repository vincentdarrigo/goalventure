import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { account } from '../db/schema.js';
import { generateAccountSecret, hashSecret } from '../lib/secret.js';
import type * as schema from '../db/schema.js';

const CreateAccountBody = z.object({
  displayName: z.string().min(1).max(100),
});

/**
 * Lazy account creation — no signup form. An install calls this once, stores
 * {accountId, accountSecret} in SecureStore, and that pair is the bearer
 * credential for every other call. The secret is returned exactly once here
 * and never again; only its hash is kept server-side.
 */
export function registerAccountRoutes<TQueryResult extends PgQueryResultHKT>(
  app: FastifyInstance,
  db: PgDatabase<TQueryResult, typeof schema>
) {
  app.post('/accounts', async (request, reply) => {
    const body = CreateAccountBody.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'invalid_body', details: body.error.flatten() });
    }

    const accountSecret = generateAccountSecret();
    const rows = await db
      .insert(account)
      .values({ displayName: body.data.displayName, accountSecretHash: hashSecret(accountSecret) })
      .returning({ id: account.id, displayName: account.displayName });

    const created = rows[0];
    if (!created) {
      return reply.status(500).send({ error: 'account_creation_failed' });
    }

    return reply.status(201).send({
      accountId: created.id,
      accountSecret,
      displayName: created.displayName,
    });
  });
}
