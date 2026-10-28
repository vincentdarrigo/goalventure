import { and, asc, eq } from 'drizzle-orm';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { cashflowItem, financeAccount, financeSettings } from '../db/schema.js';
import type * as schema from '../db/schema.js';
import { canViewAccount, requireAccount } from '../lib/auth.js';

const AccountIdParams = z.object({ accountId: z.string().uuid() });
const IdParams = z.object({ id: z.string().uuid() });
const DecisionParams = z.object({ accountId: z.string().uuid(), id: z.string().uuid() });
const DateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const FinanceAccountBody = z.object({
  name: z.string().trim().min(1).max(100),
  kind: z.enum(['checking', 'credit_card', 'loan', 'installment', 'cash', 'other']),
  // Checking/cash accounts may legitimately be overdrawn. Debt balances are
  // still entered as positive amounts, but the shared field must allow both.
  currentBalanceCents: z.number().int().default(0),
  availableBalanceCents: z.number().int().nullable().optional(),
  creditLimitCents: z.number().int().min(0).nullable().optional(),
  aprBasisPoints: z.number().int().min(0).max(100_000).nullable().optional(),
  minimumPaymentCents: z.number().int().min(0).nullable().optional(),
  dueDay: z.number().int().min(1).max(31).nullable().optional(),
  autopay: z.boolean().default(false),
  status: z.enum(['active', 'closed']).default('active'),
  notes: z.string().trim().max(1000).nullable().optional(),
});

const FinanceAccountPatch = FinanceAccountBody.partial().refine((value) => Object.keys(value).length > 0);

const CashflowBody = z.object({
  financeAccountId: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1).max(120),
  direction: z.enum(['income', 'expense']),
  amountCents: z.number().int().positive(),
  dueDate: DateString,
  category: z.enum([
    'income',
    'housing',
    'family',
    'debt',
    'subscription',
    'food',
    'transport',
    'health',
    'travel',
    'fun',
    'gambling',
    'other',
  ]),
  status: z.enum(['planned', 'pending', 'paid', 'paused', 'canceled']).default('planned'),
  priority: z.enum(['critical', 'required', 'flexible']).default('required'),
  autopay: z.boolean().default(false),
  notes: z.string().trim().max(1000).nullable().optional(),
});

const CashflowPatch = CashflowBody.partial().refine((value) => Object.keys(value).length > 0);
const DecisionBody = z.object({
  decision: z.enum(['unreviewed', 'approved', 'hold']),
  note: z.string().trim().max(500).nullable().optional(),
});

async function gamblingIsBlocked<TQueryResult extends PgQueryResultHKT>(
  db: PgDatabase<TQueryResult, typeof schema>,
  accountId: string
) {
  const settings = await db.query.financeSettings.findFirst({ where: eq(financeSettings.accountId, accountId) });
  return settings?.gamblingBlocked ?? true;
}

async function financeAccountBelongsTo<TQueryResult extends PgQueryResultHKT>(
  db: PgDatabase<TQueryResult, typeof schema>,
  financeAccountId: string | null | undefined,
  accountId: string
) {
  if (!financeAccountId) return true;
  const row = await db.query.financeAccount.findFirst({
    where: and(eq(financeAccount.id, financeAccountId), eq(financeAccount.accountId, accountId)),
  });
  return row !== undefined;
}

export function registerFinanceRoutes<TQueryResult extends PgQueryResultHKT>(
  app: FastifyInstance,
  db: PgDatabase<TQueryResult, typeof schema>
) {
  app.get('/accounts/:accountId/finance', async (request, reply) => {
    const auth = await requireAccount(db, request, reply);
    if (!auth) return;
    const params = AccountIdParams.safeParse(request.params);
    if (!params.success) return reply.status(400).send({ error: 'invalid_params' });
    if (!(await canViewAccount(db, params.data.accountId, auth.accountId))) {
      return reply.status(403).send({ error: 'forbidden' });
    }

    const [settings, accounts, items] = await Promise.all([
      db.query.financeSettings.findFirst({ where: eq(financeSettings.accountId, params.data.accountId) }),
      db.query.financeAccount.findMany({
        where: eq(financeAccount.accountId, params.data.accountId),
        orderBy: [asc(financeAccount.name)],
      }),
      db.query.cashflowItem.findMany({
        where: eq(cashflowItem.accountId, params.data.accountId),
        orderBy: [asc(cashflowItem.dueDate), asc(cashflowItem.name)],
      }),
    ]);

    return reply.status(200).send({
      viewerRole: params.data.accountId === auth.accountId ? 'owner' : 'partner',
      settings: { gamblingBlocked: settings?.gamblingBlocked ?? true },
      accounts,
      items,
    });
  });

  app.post('/finance/accounts', async (request, reply) => {
    const auth = await requireAccount(db, request, reply);
    if (!auth) return;
    const body = FinanceAccountBody.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: 'invalid_body', details: body.error.flatten() });
    const rows = await db
      .insert(financeAccount)
      .values({ ...body.data, accountId: auth.accountId })
      .returning();
    return reply.status(201).send(rows[0]);
  });

  app.patch('/finance/accounts/:id', async (request, reply) => {
    const auth = await requireAccount(db, request, reply);
    if (!auth) return;
    const params = IdParams.safeParse(request.params);
    const body = FinanceAccountPatch.safeParse(request.body);
    if (!params.success || !body.success) return reply.status(400).send({ error: 'invalid_request' });
    const rows = await db
      .update(financeAccount)
      .set({ ...body.data, updatedAt: new Date() })
      .where(and(eq(financeAccount.id, params.data.id), eq(financeAccount.accountId, auth.accountId)))
      .returning();
    if (!rows[0]) return reply.status(404).send({ error: 'not_found' });
    return reply.status(200).send(rows[0]);
  });

  app.post('/finance/items', async (request, reply) => {
    const auth = await requireAccount(db, request, reply);
    if (!auth) return;
    const body = CashflowBody.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: 'invalid_body', details: body.error.flatten() });
    if (!(await financeAccountBelongsTo(db, body.data.financeAccountId, auth.accountId))) {
      return reply.status(400).send({ error: 'invalid_finance_account' });
    }
    if (
      body.data.category === 'gambling' &&
      !['canceled', 'paid'].includes(body.data.status) &&
      (await gamblingIsBlocked(db, auth.accountId))
    ) {
      return reply.status(409).send({ error: 'gambling_blocked' });
    }
    const rows = await db
      .insert(cashflowItem)
      .values({ ...body.data, accountId: auth.accountId })
      .returning();
    return reply.status(201).send(rows[0]);
  });

  app.patch('/finance/items/:id', async (request, reply) => {
    const auth = await requireAccount(db, request, reply);
    if (!auth) return;
    const params = IdParams.safeParse(request.params);
    const body = CashflowPatch.safeParse(request.body);
    if (!params.success || !body.success) return reply.status(400).send({ error: 'invalid_request' });
    const existing = await db.query.cashflowItem.findFirst({
      where: and(eq(cashflowItem.id, params.data.id), eq(cashflowItem.accountId, auth.accountId)),
    });
    if (!existing) return reply.status(404).send({ error: 'not_found' });
    if (!(await financeAccountBelongsTo(db, body.data.financeAccountId, auth.accountId))) {
      return reply.status(400).send({ error: 'invalid_finance_account' });
    }

    const category = body.data.category ?? existing.category;
    const status = body.data.status ?? existing.status;
    if (category === 'gambling' && !['canceled', 'paid'].includes(status) && (await gamblingIsBlocked(db, auth.accountId))) {
      return reply.status(409).send({ error: 'gambling_blocked' });
    }

    const rows = await db
      .update(cashflowItem)
      .set({ ...body.data, partnerDecision: 'unreviewed', partnerNote: null, decidedByAccountId: null, decidedAt: null, updatedAt: new Date() })
      .where(eq(cashflowItem.id, existing.id))
      .returning();
    return reply.status(200).send(rows[0]);
  });

  app.patch('/accounts/:accountId/finance/items/:id/decision', async (request, reply) => {
    const auth = await requireAccount(db, request, reply);
    if (!auth) return;
    const params = DecisionParams.safeParse(request.params);
    const body = DecisionBody.safeParse(request.body);
    if (!params.success || !body.success) return reply.status(400).send({ error: 'invalid_request' });
    if (!(await canViewAccount(db, params.data.accountId, auth.accountId))) {
      return reply.status(403).send({ error: 'forbidden' });
    }

    const rows = await db
      .update(cashflowItem)
      .set({
        partnerDecision: body.data.decision,
        partnerNote: body.data.note ?? null,
        decidedByAccountId: auth.accountId,
        decidedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(cashflowItem.id, params.data.id), eq(cashflowItem.accountId, params.data.accountId)))
      .returning();
    if (!rows[0]) return reply.status(404).send({ error: 'not_found' });
    return reply.status(200).send(rows[0]);
  });
}
