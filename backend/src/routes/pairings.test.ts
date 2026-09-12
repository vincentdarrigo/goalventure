import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { buildApp } from '../app.js';
import { createTestDb } from '../db/testClient.js';
import { createTestAccount } from '../testUtils.js';

describe('pairings', () => {
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

  test('an invite code can be accepted by a different account to form a partnership', async () => {
    const owner = await createTestAccount(app, 'Vince');
    const partner = await createTestAccount(app, 'Partner');

    const invite = await app.inject({
      method: 'POST',
      url: '/pairings/invite',
      headers: { authorization: owner.authHeader },
    });
    expect(invite.statusCode).toBe(201);
    const { code } = invite.json() as { code: string };

    const accept = await app.inject({
      method: 'POST',
      url: '/pairings/accept',
      headers: { authorization: partner.authHeader },
      payload: { code },
    });
    expect(accept.statusCode).toBe(200);
    expect(accept.json()).toMatchObject({ accountId: owner.accountId, displayName: 'Vince' });

    const ownerView = await app.inject({
      method: 'GET',
      url: '/pairings',
      headers: { authorization: owner.authHeader },
    });
    expect(ownerView.json()).toMatchObject({
      asTrackedUser: [{ partnerAccountId: partner.accountId }],
      asPartner: [],
    });

    const partnerView = await app.inject({
      method: 'GET',
      url: '/pairings',
      headers: { authorization: partner.authHeader },
    });
    expect(partnerView.json()).toMatchObject({
      asTrackedUser: [],
      asPartner: [{ trackedAccountId: owner.accountId, trackedDisplayName: 'Vince' }],
    });
  });

  test('a device_link code cannot be accepted as a partnership', async () => {
    const owner = await createTestAccount(app, 'Vince');
    const partner = await createTestAccount(app, 'Partner');

    const linkCode = await app.inject({
      method: 'POST',
      url: '/device-link-codes',
      headers: { authorization: owner.authHeader },
      payload: { purpose: 'device_link' },
    });
    const { code } = linkCode.json() as { code: string };

    const accept = await app.inject({
      method: 'POST',
      url: '/pairings/accept',
      headers: { authorization: partner.authHeader },
      payload: { code },
    });
    expect(accept.statusCode).toBe(400);
  });

  test('an account cannot pair with itself', async () => {
    const owner = await createTestAccount(app, 'Vince');

    const invite = await app.inject({
      method: 'POST',
      url: '/pairings/invite',
      headers: { authorization: owner.authHeader },
    });
    const { code } = invite.json() as { code: string };

    const accept = await app.inject({
      method: 'POST',
      url: '/pairings/accept',
      headers: { authorization: owner.authHeader },
      payload: { code },
    });
    expect(accept.statusCode).toBe(400);
  });
});
