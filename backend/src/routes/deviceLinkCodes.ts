import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import type * as schema from '../db/schema.js';
import { requireAccount } from '../lib/auth.js';
import { createDeviceLinkCode, redeemDeviceLinkCode } from '../services/deviceLinkCodes.js';

const CreateCodeBody = z.object({
  purpose: z.enum(['partner_pair', 'device_link']),
});

const REDEEM_ERROR_STATUS = {
  not_found: 404,
  already_used: 410,
  expired: 410,
} as const;

/**
 * One primitive, two purposes: a short-lived code an account generates and
 * hands to whoever needs to attach to it — another install of the same
 * account ('device_link'), or a partner who wants read access ('partner_pair').
 * Redeeming a device_link code just discloses which account it belongs to so
 * the redeeming client can adopt those credentials; a partner_pair code is
 * meant to be redeemed via /pairings/accept instead, which also records the
 * partnership.
 */
export function registerDeviceLinkCodeRoutes<TQueryResult extends PgQueryResultHKT>(
  app: FastifyInstance,
  db: PgDatabase<TQueryResult, typeof schema>
) {
  app.post('/device-link-codes', async (request, reply) => {
    const auth = await requireAccount(db, request, reply);
    if (!auth) return;

    const body = CreateCodeBody.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'invalid_body', details: body.error.flatten() });
    }

    const created = await createDeviceLinkCode(db, auth.accountId, body.data.purpose);
    return reply.status(201).send({ ...created, expiresAt: created.expiresAt.toISOString() });
  });

  app.post('/device-link-codes/:code/redeem', async (request, reply) => {
    const params = z.object({ code: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'invalid_params' });
    }

    const result = await redeemDeviceLinkCode(db, params.data.code);
    if (!result.ok) {
      return reply.status(REDEEM_ERROR_STATUS[result.reason]).send({ error: `code_${result.reason}` });
    }

    return reply.status(200).send({
      accountId: result.ownerAccountId,
      displayName: result.ownerDisplayName,
      purpose: result.purpose,
    });
  });
}
