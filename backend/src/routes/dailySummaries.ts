import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import type { FastifyInstance } from 'fastify';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { z } from 'zod';

import { dailySummary, partnership } from '../db/schema.js';
import type * as schema from '../db/schema.js';
import { requireAccount } from '../lib/auth.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PayloadValue = z.union([z.boolean(), z.number(), z.string()]);

const PutSummaryBody = z.object({
  date: z.string().regex(DATE_PATTERN),
  payload: z.record(z.string(), PayloadValue).refine((p) => Object.keys(p).length <= 50, {
    message: 'too many fields',
  }),
});

const DEFAULT_RANGE_DAYS = 14;

/**
 * Upsert is the only write here — a summary is submitted whole for a date,
 * never patched field-by-field, since `payload` shape tracks whatever
 * check_in_items existed at submission time rather than a fixed schema.
 */
export function registerDailySummaryRoutes<TQueryResult extends PgQueryResultHKT>(
  app: FastifyInstance,
  db: PgDatabase<TQueryResult, typeof schema>
) {
  app.put('/daily-summaries', async (request, reply) => {
    const auth = await requireAccount(db, request, reply);
    if (!auth) return;

    const body = PutSummaryBody.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ error: 'invalid_body', details: body.error.flatten() });
    }

    const [saved] = await db
      .insert(dailySummary)
      .values({ accountId: auth.accountId, date: body.data.date, payload: body.data.payload })
      .onConflictDoUpdate({
        target: [dailySummary.accountId, dailySummary.date],
        set: { payload: body.data.payload, updatedAt: new Date() },
      })
      .returning();

    return reply.status(200).send(saved);
  });

  app.get('/accounts/:id/daily-summaries', async (request, reply) => {
    const auth = await requireAccount(db, request, reply);
    if (!auth) return;

    const params = z.object({ id: z.string().uuid() }).safeParse(request.params);
    const query = z
      .object({ from: z.string().regex(DATE_PATTERN).optional(), to: z.string().regex(DATE_PATTERN).optional() })
      .safeParse(request.query);
    if (!params.success || !query.success) {
      return reply.status(400).send({ error: 'invalid_request' });
    }

    const targetAccountId = params.data.id;
    if (targetAccountId !== auth.accountId) {
      const confirmedPartner = await db.query.partnership.findFirst({
        where: and(eq(partnership.accountId, targetAccountId), eq(partnership.partnerAccountId, auth.accountId)),
      });
      if (!confirmedPartner) {
        return reply.status(403).send({ error: 'not_a_confirmed_partner' });
      }
    }

    const to = query.data.to ?? DateTime.utc().toFormat('yyyy-LL-dd');
    const from = query.data.from ?? DateTime.fromISO(to).minus({ days: DEFAULT_RANGE_DAYS - 1 }).toFormat('yyyy-LL-dd');

    const summaries = await db
      .select()
      .from(dailySummary)
      .where(and(eq(dailySummary.accountId, targetAccountId), gte(dailySummary.date, from), lte(dailySummary.date, to)))
      .orderBy(desc(dailySummary.date));

    return reply.status(200).send({ summaries });
  });
}
