import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { buildApp } from '../app.js';
import { createTestDb } from '../db/testClient.js';
import { createTestAccount } from '../testUtils.js';

async function pair(app: FastifyInstance, owner: { authHeader: string }, partner: { authHeader: string }) {
  const invite = await app.inject({ method: 'POST', url: '/pairings/invite', headers: { authorization: owner.authHeader } });
  const { code } = invite.json() as { code: string };
  await app.inject({
    method: 'POST',
    url: '/pairings/accept',
    headers: { authorization: partner.authHeader },
    payload: { code },
  });
}

describe('daily summaries', () => {
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

  test('upserting the same date twice overwrites rather than duplicates', async () => {
    const owner = await createTestAccount(app, 'Vince');

    const first = await app.inject({
      method: 'PUT',
      url: '/daily-summaries',
      headers: { authorization: owner.authHeader },
      payload: { date: '2026-09-12', payload: { water_100oz: true, magnesium_taken: false } },
    });
    expect(first.statusCode).toBe(200);

    const second = await app.inject({
      method: 'PUT',
      url: '/daily-summaries',
      headers: { authorization: owner.authHeader },
      payload: { date: '2026-09-12', payload: { water_100oz: true, magnesium_taken: true } },
    });
    expect(second.statusCode).toBe(200);

    const list = await app.inject({
      method: 'GET',
      url: `/accounts/${owner.accountId}/daily-summaries`,
      headers: { authorization: owner.authHeader },
    });
    const body = list.json() as { summaries: { date: string; payload: Record<string, unknown> }[] };
    expect(body.summaries).toHaveLength(1);
    expect(body.summaries[0]).toMatchObject({ date: '2026-09-12', payload: { magnesium_taken: true } });
  });

  test('a confirmed partner can read the tracked account\'s summaries', async () => {
    const owner = await createTestAccount(app, 'Vince');
    const partner = await createTestAccount(app, 'Partner');
    await pair(app, owner, partner);

    await app.inject({
      method: 'PUT',
      url: '/daily-summaries',
      headers: { authorization: owner.authHeader },
      payload: { date: '2026-09-12', payload: { water_100oz: true } },
    });

    const asPartner = await app.inject({
      method: 'GET',
      url: `/accounts/${owner.accountId}/daily-summaries`,
      headers: { authorization: partner.authHeader },
    });
    expect(asPartner.statusCode).toBe(200);
    expect(asPartner.json().summaries).toHaveLength(1);
  });

  test('a stranger cannot read another account\'s summaries', async () => {
    const owner = await createTestAccount(app, 'Vince');
    const stranger = await createTestAccount(app, 'Stranger');

    await app.inject({
      method: 'PUT',
      url: '/daily-summaries',
      headers: { authorization: owner.authHeader },
      payload: { date: '2026-09-12', payload: { water_100oz: true } },
    });

    const response = await app.inject({
      method: 'GET',
      url: `/accounts/${owner.accountId}/daily-summaries`,
      headers: { authorization: stranger.authHeader },
    });
    expect(response.statusCode).toBe(403);
  });

  test('an explicit from/to range excludes summaries outside it', async () => {
    const owner = await createTestAccount(app, 'Vince');

    await app.inject({
      method: 'PUT',
      url: '/daily-summaries',
      headers: { authorization: owner.authHeader },
      payload: { date: '2026-01-01', payload: { water_100oz: true } },
    });
    await app.inject({
      method: 'PUT',
      url: '/daily-summaries',
      headers: { authorization: owner.authHeader },
      payload: { date: '2026-09-12', payload: { water_100oz: false } },
    });

    const filtered = await app.inject({
      method: 'GET',
      url: `/accounts/${owner.accountId}/daily-summaries?from=2026-09-01&to=2026-09-30`,
      headers: { authorization: owner.authHeader },
    });
    const body = filtered.json() as { summaries: { date: string }[] };
    expect(body.summaries).toHaveLength(1);
    expect(body.summaries[0]?.date).toBe('2026-09-12');
  });
});
