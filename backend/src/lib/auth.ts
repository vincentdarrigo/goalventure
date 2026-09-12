import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { and, eq } from 'drizzle-orm';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { account, partnership } from '../db/schema.js';
import type * as schema from '../db/schema.js';
import { hashSecret } from './secret.js';

export interface AuthenticatedAccount {
  accountId: string;
}

/**
 * Bearer credential is "<accountId>.<accountSecret>" — the id so we can look
 * the row up directly instead of scanning by hash, the secret to prove it.
 * Sends the 401 itself and returns null on failure so callers can just
 * `if (!auth) return;` rather than repeat error-shaping at every route.
 */
export async function requireAccount<TQueryResult extends PgQueryResultHKT>(
  db: PgDatabase<TQueryResult, typeof schema>,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<AuthenticatedAccount | null> {
  const header = request.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
  const separatorIndex = token?.indexOf('.') ?? -1;

  if (!token || separatorIndex <= 0) {
    await reply.status(401).send({ error: 'missing_credentials' });
    return null;
  }

  const accountId = token.slice(0, separatorIndex);
  const secret = token.slice(separatorIndex + 1);

  const row = await db.query.account.findFirst({ where: eq(account.id, accountId) });
  if (!row || row.accountSecretHash !== hashSecret(secret)) {
    await reply.status(401).send({ error: 'invalid_credentials' });
    return null;
  }

  return { accountId: row.id };
}

/**
 * True for the account itself, or for an account that is a confirmed
 * partner of it (a `partnership` row with `accountId: targetAccountId,
 * partnerAccountId: viewerAccountId`). Shared by every read endpoint a
 * partner needs — daily summaries and, for rendering their labels, the
 * tracked account's check-in item definitions.
 */
export async function canViewAccount<TQueryResult extends PgQueryResultHKT>(
  db: PgDatabase<TQueryResult, typeof schema>,
  targetAccountId: string,
  viewerAccountId: string
): Promise<boolean> {
  if (targetAccountId === viewerAccountId) return true;

  const confirmed = await db.query.partnership.findFirst({
    where: and(eq(partnership.accountId, targetAccountId), eq(partnership.partnerAccountId, viewerAccountId)),
  });
  return confirmed !== undefined;
}
