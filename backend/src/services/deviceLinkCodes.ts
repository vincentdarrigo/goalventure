import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { and, eq, isNull } from 'drizzle-orm';

import { account, deviceLinkCode } from '../db/schema.js';
import type * as schema from '../db/schema.js';
import { generateShortCode } from '../lib/secret.js';

const CODE_TTL_MS = 15 * 60 * 1000;

export type DeviceLinkCodePurpose = (typeof deviceLinkCode.purpose.enumValues)[number];

export async function createDeviceLinkCode<TQueryResult extends PgQueryResultHKT>(
  db: PgDatabase<TQueryResult, typeof schema>,
  accountId: string,
  purpose: DeviceLinkCodePurpose
) {
  let code = generateShortCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await db.query.deviceLinkCode.findFirst({ where: eq(deviceLinkCode.code, code) });
    if (!existing) break;
    code = generateShortCode();
  }

  const expiresAt = new Date(Date.now() + CODE_TTL_MS);
  await db.insert(deviceLinkCode).values({ code, accountId, purpose, expiresAt });
  return { code, purpose, expiresAt };
}

export type RedeemResult =
  | { ok: true; ownerAccountId: string; ownerDisplayName: string; purpose: DeviceLinkCodePurpose }
  | { ok: false; reason: 'not_found' | 'already_used' | 'expired' };

/**
 * Validates and consumes a code in one call. Marking it used is conditioned
 * on usedAt still being null so two concurrent redeems of the same code
 * can't both succeed — only the first UPDATE actually matches a row.
 */
export async function redeemDeviceLinkCode<TQueryResult extends PgQueryResultHKT>(
  db: PgDatabase<TQueryResult, typeof schema>,
  code: string
): Promise<RedeemResult> {
  const row = await db.query.deviceLinkCode.findFirst({ where: eq(deviceLinkCode.code, code.toUpperCase()) });
  if (!row) return { ok: false, reason: 'not_found' };
  if (row.usedAt) return { ok: false, reason: 'already_used' };
  if (row.expiresAt.getTime() < Date.now()) return { ok: false, reason: 'expired' };

  const owner = await db.query.account.findFirst({ where: eq(account.id, row.accountId) });
  if (!owner) return { ok: false, reason: 'not_found' };

  const updated = await db
    .update(deviceLinkCode)
    .set({ usedAt: new Date() })
    .where(and(eq(deviceLinkCode.code, row.code), isNull(deviceLinkCode.usedAt)))
    .returning({ code: deviceLinkCode.code });

  if (updated.length === 0) return { ok: false, reason: 'already_used' };

  return { ok: true, ownerAccountId: owner.id, ownerDisplayName: owner.displayName, purpose: row.purpose };
}
