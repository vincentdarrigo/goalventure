import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import type { FastifyInstance } from 'fastify';
import { and, eq, isNull, max } from 'drizzle-orm';
import { z } from 'zod';

import { checkInItem } from '../db/schema.js';
import type * as schema from '../db/schema.js';
import { canViewAccount, requireAccount } from '../lib/auth.js';

// Lowercase snake_case only — this is the literal key a daily_summary
// payload will be written under, so it needs to survive round-tripping
// through JSON without quoting concerns.
const KEY_PATTERN = /^[a-z][a-z0-9_]*$/;

const CreateItemBody = z.object({
  key: z.string().regex(KEY_PATTERN).max(64),
  label: z.string().min(1).max(100),
  valueType: z.enum(['boolean', 'number', 'text']),
});

const UpdateItemBody = z
  .object({
    label: z.string().min(1).max(100).optional(),
    order: z.number().int().optional(),
  })
  .refine((body) => body.label !== undefined || body.order !== undefined, {
    message: 'at least one field must be provided',
  });

/**
 * An account's configured check-in fields — e.g. "100oz water", "kitchen
 * closed by 4pm" — never a hardcoded list. `key` and `valueType` are
 * immutable after creation (see schema.ts for why); only `label`/`order`
 * can be edited, and removal archives rather than deletes so historical
 * daily_summary payloads that reference the key stay interpretable.
 */
export function registerCheckInItemRoutes<TQueryResult extends PgQueryResultHKT>(
  app: FastifyInstance,
  db: PgDatabase<TQueryResult, typeof schema>
) {
  app.get('/check-in-items', async (request, reply) => {
    const auth = await requireAccount(db, request, reply);
    if (!auth) return;

    const items = await db.query.checkInItem.findMany({
      where: and(eq(checkInItem.accountId, auth.accountId), isNull(checkInItem.archivedAt)),
      orderBy: (item, { asc }) => [asc(item.order)],
    });

    return reply.status(200).send({ items });
  });

  // Lets a confirmed partner fetch the tracked account's item *definitions*
  // (labels/valueType, not values) so a summary view can render real labels
  // instead of raw payload keys — read-only, and never exposes another
  // account's items to a non-partner.
  app.get('/accounts/:id/check-in-items', async (request, reply) => {
    const auth = await requireAccount(db, request, reply);
    if (!auth) return;

    const params = z.object({ id: z.string().uuid() }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'invalid_params' });
    }

    if (!(await canViewAccount(db, params.data.id, auth.accountId))) {
      return reply.status(403).send({ error: 'not_a_confirmed_partner' });
    }

    const items = await db.query.checkInItem.findMany({
      where: and(eq(checkInItem.accountId, params.data.id), isNull(checkInItem.archivedAt)),
      orderBy: (item, { asc }) => [asc(item.order)],
    });

    return reply.status(200).send({ items });
  });

  app.post('/check-in-items', async (request, reply) => {
    const auth = await requireAccount(db, request, reply);
    if (!auth) return;

    const body = CreateItemBody.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'invalid_body', details: body.error.flatten() });
    }

    const existing = await db.query.checkInItem.findFirst({
      where: and(eq(checkInItem.accountId, auth.accountId), eq(checkInItem.key, body.data.key)),
    });
    if (existing) {
      return reply.status(409).send({ error: 'key_already_exists' });
    }

    const [maxRow] = await db
      .select({ nextOrder: max(checkInItem.order) })
      .from(checkInItem)
      .where(eq(checkInItem.accountId, auth.accountId));

    const [created] = await db
      .insert(checkInItem)
      .values({ ...body.data, accountId: auth.accountId, order: (maxRow?.nextOrder ?? -1) + 1 })
      .returning();

    return reply.status(201).send(created);
  });

  app.patch('/check-in-items/:id', async (request, reply) => {
    const auth = await requireAccount(db, request, reply);
    if (!auth) return;

    const params = z.object({ id: z.string().uuid() }).safeParse(request.params);
    const body = UpdateItemBody.safeParse(request.body);
    if (!params.success || !body.success) {
      return reply.status(400).send({ error: 'invalid_request' });
    }

    const updated = await db
      .update(checkInItem)
      .set(body.data)
      .where(and(eq(checkInItem.id, params.data.id), eq(checkInItem.accountId, auth.accountId)))
      .returning();

    if (updated.length === 0) {
      return reply.status(404).send({ error: 'not_found' });
    }
    return reply.status(200).send(updated[0]);
  });

  app.delete('/check-in-items/:id', async (request, reply) => {
    const auth = await requireAccount(db, request, reply);
    if (!auth) return;

    const params = z.object({ id: z.string().uuid() }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: 'invalid_params' });
    }

    const archived = await db
      .update(checkInItem)
      .set({ archivedAt: new Date() })
      .where(and(eq(checkInItem.id, params.data.id), eq(checkInItem.accountId, auth.accountId)))
      .returning({ id: checkInItem.id });

    if (archived.length === 0) {
      return reply.status(404).send({ error: 'not_found' });
    }
    return reply.status(204).send();
  });
}
