import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import type { FastifyInstance } from 'fastify';
import { eq, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { z } from 'zod';

import { account, partnership } from '../db/schema.js';
import type * as schema from '../db/schema.js';
import { requireAccount } from '../lib/auth.js';
import { createDeviceLinkCode, redeemDeviceLinkCode } from '../services/deviceLinkCodes.js';

const AcceptBody = z.object({
  code: z.string().min(1),
});

const REDEEM_ERROR_STATUS = {
  not_found: 404,
  already_used: 410,
  expired: 410,
} as const;

/**
 * accountId on a partnership row is the tracked user (whose data is being
 * shared); partnerAccountId is the viewer. Invite always issues a fresh
 * purpose='partner_pair' code from the caller's own account, so a partner
 * never needs a separate device-link-codes call to get one.
 */
export function registerPairingRoutes<TQueryResult extends PgQueryResultHKT>(
  app: FastifyInstance,
  db: PgDatabase<TQueryResult, typeof schema>
) {
  app.post('/pairings/invite', async (request, reply) => {
    const auth = await requireAccount(db, request, reply);
    if (!auth) return;

    const created = await createDeviceLinkCode(db, auth.accountId, 'partner_pair');
    return reply.status(201).send({ code: created.code, expiresAt: created.expiresAt.toISOString() });
  });

  app.post('/pairings/accept', async (request, reply) => {
    const auth = await requireAccount(db, request, reply);
    if (!auth) return;

    const body = AcceptBody.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'invalid_body', details: body.error.flatten() });
    }

    const result = await redeemDeviceLinkCode(db, body.data.code);
    if (!result.ok) {
      return reply.status(REDEEM_ERROR_STATUS[result.reason]).send({ error: `code_${result.reason}` });
    }
    if (result.purpose !== 'partner_pair') {
      return reply.status(400).send({ error: 'wrong_code_purpose' });
    }
    if (result.ownerAccountId === auth.accountId) {
      return reply.status(400).send({ error: 'cannot_pair_with_self' });
    }

    await db
      .insert(partnership)
      .values({ accountId: result.ownerAccountId, partnerAccountId: auth.accountId })
      .onConflictDoNothing();

    return reply.status(200).send({ accountId: result.ownerAccountId, displayName: result.ownerDisplayName });
  });

  app.get('/pairings', async (request, reply) => {
    const auth = await requireAccount(db, request, reply);
    if (!auth) return;

    const partnerAccount = alias(account, 'partner_account');

    const rows = await db
      .select({
        partnershipId: partnership.id,
        accountId: partnership.accountId,
        partnerAccountId: partnership.partnerAccountId,
        trackedDisplayName: account.displayName,
        partnerDisplayName: partnerAccount.displayName,
      })
      .from(partnership)
      .innerJoin(account, eq(account.id, partnership.accountId))
      .innerJoin(partnerAccount, eq(partnerAccount.id, partnership.partnerAccountId))
      .where(or(eq(partnership.accountId, auth.accountId), eq(partnership.partnerAccountId, auth.accountId)));

    const asTrackedUser = rows
      .filter((r) => r.accountId === auth.accountId)
      .map((r) => ({
        partnershipId: r.partnershipId,
        partnerAccountId: r.partnerAccountId,
        partnerDisplayName: r.partnerDisplayName,
      }));

    const asPartner = rows
      .filter((r) => r.partnerAccountId === auth.accountId)
      .map((r) => ({
        partnershipId: r.partnershipId,
        trackedAccountId: r.accountId,
        trackedDisplayName: r.trackedDisplayName,
      }));

    return reply.status(200).send({ asTrackedUser, asPartner });
  });
}
