import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { buildApp } from '../app.js';
import { createTestDb } from '../db/testClient.js';
import { createTestAccount } from '../testUtils.js';

async function pair(app: FastifyInstance, ownerAuth: string, partnerAuth: string) {
  const invite = await app.inject({ method: 'POST', url: '/pairings/invite', headers: { authorization: ownerAuth } });
  const { code } = invite.json() as { code: string };
  await app.inject({
    method: 'POST',
    url: '/pairings/accept',
    headers: { authorization: partnerAuth },
    payload: { code },
  });
}

describe('finance', () => {
  let app: FastifyInstance;
  let client: Awaited<ReturnType<typeof createTestDb>>['client'];

  beforeEach(async () => {
    const testDb = await createTestDb();
    client = testDb.client;
    app = buildApp(testDb.db, { logger: false });
  });

  afterEach(async () => {
    await app.close();
    await client.close();
  });

  test('owner configures accounts and dated cashflow items', async () => {
    const owner = await createTestAccount(app, 'Vince');
    const checking = await app.inject({
      method: 'POST',
      url: '/finance/accounts',
      headers: { authorization: owner.authHeader },
      payload: { name: 'Checking', kind: 'checking', currentBalanceCents: 15000, availableBalanceCents: 15000 },
    });
    expect(checking.statusCode).toBe(201);
    const checkingId = (checking.json() as { id: string }).id;

    const paycheck = await app.inject({
      method: 'POST',
      url: '/finance/items',
      headers: { authorization: owner.authHeader },
      payload: {
        financeAccountId: checkingId,
        name: 'Paycheck',
        direction: 'income',
        amountCents: 319921,
        dueDate: '2026-11-10',
        category: 'income',
        priority: 'critical',
      },
    });
    expect(paycheck.statusCode).toBe(201);

    const dashboard = await app.inject({
      method: 'GET',
      url: `/accounts/${owner.accountId}/finance`,
      headers: { authorization: owner.authHeader },
    });
    expect(dashboard.statusCode).toBe(200);
    expect(dashboard.json()).toMatchObject({
      viewerRole: 'owner',
      settings: { gamblingBlocked: true },
      accounts: [{ name: 'Checking' }],
      items: [{ name: 'Paycheck', amountCents: 319921 }],
    });
  });

  test('checking accounts may represent an overdraft', async () => {
    const owner = await createTestAccount(app, 'Vince');
    const checking = await app.inject({
      method: 'POST',
      url: '/finance/accounts',
      headers: { authorization: owner.authHeader },
      payload: { name: 'Checking', kind: 'checking', currentBalanceCents: -2500, availableBalanceCents: -2500 },
    });
    expect(checking.statusCode).toBe(201);
    expect(checking.json()).toMatchObject({ currentBalanceCents: -2500, availableBalanceCents: -2500 });
  });

  test('gambling lock rejects active gambling spending but preserves a canceled historical record', async () => {
    const owner = await createTestAccount(app, 'Vince');
    const active = await app.inject({
      method: 'POST',
      url: '/finance/items',
      headers: { authorization: owner.authHeader },
      payload: {
        name: 'Sportsbook',
        direction: 'expense',
        amountCents: 10000,
        dueDate: '2026-11-01',
        category: 'gambling',
      },
    });
    expect(active.statusCode).toBe(409);
    expect(active.json()).toEqual({ error: 'gambling_blocked' });

    const historical = await app.inject({
      method: 'POST',
      url: '/finance/items',
      headers: { authorization: owner.authHeader },
      payload: {
        name: 'Historical gambling loss',
        direction: 'expense',
        amountCents: 100000,
        dueDate: '2026-10-25',
        category: 'gambling',
        status: 'paid',
      },
    });
    expect(historical.statusCode).toBe(201);

    const unlock = await app.inject({
      method: 'PATCH',
      url: '/finance/settings',
      headers: { authorization: owner.authHeader },
      payload: { gamblingBlocked: false },
    });
    expect(unlock.statusCode).toBe(404);
  });

  test('confirmed partner can read and decide, but cannot edit the owner ledger', async () => {
    const owner = await createTestAccount(app, 'Vince');
    const partner = await createTestAccount(app, 'Wife');
    const stranger = await createTestAccount(app, 'Stranger');
    await pair(app, owner.authHeader, partner.authHeader);

    const created = await app.inject({
      method: 'POST',
      url: '/finance/items',
      headers: { authorization: owner.authHeader },
      payload: {
        name: 'Amazon minimum',
        direction: 'expense',
        amountCents: 30000,
        dueDate: '2026-11-04',
        category: 'debt',
        priority: 'critical',
      },
    });
    const itemId = (created.json() as { id: string }).id;

    const partnerDashboard = await app.inject({
      method: 'GET',
      url: `/accounts/${owner.accountId}/finance`,
      headers: { authorization: partner.authHeader },
    });
    expect(partnerDashboard.statusCode).toBe(200);
    expect(partnerDashboard.json()).toMatchObject({ viewerRole: 'partner' });

    const decision = await app.inject({
      method: 'PATCH',
      url: `/accounts/${owner.accountId}/finance/items/${itemId}/decision`,
      headers: { authorization: partner.authHeader },
      payload: { decision: 'approved', note: 'Pay before the due date.' },
    });
    expect(decision.statusCode).toBe(200);
    expect(decision.json()).toMatchObject({ partnerDecision: 'approved', partnerNote: 'Pay before the due date.' });

    const forbiddenEdit = await app.inject({
      method: 'PATCH',
      url: `/finance/items/${itemId}`,
      headers: { authorization: partner.authHeader },
      payload: { amountCents: 1 },
    });
    expect(forbiddenEdit.statusCode).toBe(404);

    const strangerDashboard = await app.inject({
      method: 'GET',
      url: `/accounts/${owner.accountId}/finance`,
      headers: { authorization: stranger.authHeader },
    });
    expect(strangerDashboard.statusCode).toBe(403);
  });
});
