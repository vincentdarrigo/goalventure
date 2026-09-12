import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { buildApp } from '../app.js';
import { createTestDb } from '../db/testClient.js';
import { createTestAccount } from '../testUtils.js';

describe('device link codes', () => {
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

  test('rejects code creation without credentials', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/device-link-codes',
      payload: { purpose: 'device_link' },
    });
    expect(response.statusCode).toBe(401);
  });

  test('a generated device_link code can be redeemed once to disclose the owning account', async () => {
    const owner = await createTestAccount(app, 'Owner');

    const created = await app.inject({
      method: 'POST',
      url: '/device-link-codes',
      headers: { authorization: owner.authHeader },
      payload: { purpose: 'device_link' },
    });
    expect(created.statusCode).toBe(201);
    const { code } = created.json() as { code: string };

    const redeemed = await app.inject({ method: 'POST', url: `/device-link-codes/${code}/redeem` });
    expect(redeemed.statusCode).toBe(200);
    expect(redeemed.json()).toMatchObject({ accountId: owner.accountId, purpose: 'device_link' });

    const secondRedeem = await app.inject({ method: 'POST', url: `/device-link-codes/${code}/redeem` });
    expect(secondRedeem.statusCode).toBe(410);
  });

  test('redeeming an unknown code 404s', async () => {
    const response = await app.inject({ method: 'POST', url: '/device-link-codes/NOPE1234/redeem' });
    expect(response.statusCode).toBe(404);
  });
});
