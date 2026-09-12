import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { buildApp } from '../app.js';
import { createTestDb } from '../db/testClient.js';

describe('POST /accounts', () => {
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

  test('creates an account and returns a one-time secret', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/accounts',
      payload: { displayName: 'Vince' },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.accountId).toEqual(expect.any(String));
    expect(body.accountSecret).toEqual(expect.any(String));
    expect(body.displayName).toBe('Vince');
  });

  test('rejects an empty display name', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/accounts',
      payload: { displayName: '' },
    });

    expect(response.statusCode).toBe(400);
  });
});
