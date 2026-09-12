import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { buildApp } from '../app.js';
import { createTestDb } from '../db/testClient.js';
import { createTestAccount } from '../testUtils.js';

describe('check-in items', () => {
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

  test('creates items in append order and lists them back', async () => {
    const owner = await createTestAccount(app, 'Vince');

    const first = await app.inject({
      method: 'POST',
      url: '/check-in-items',
      headers: { authorization: owner.authHeader },
      payload: { key: 'water_100oz', label: '100oz water', valueType: 'boolean' },
    });
    expect(first.statusCode).toBe(201);
    expect(first.json()).toMatchObject({ key: 'water_100oz', order: 0 });

    const second = await app.inject({
      method: 'POST',
      url: '/check-in-items',
      headers: { authorization: owner.authHeader },
      payload: { key: 'magnesium_taken', label: 'Nightly magnesium', valueType: 'boolean' },
    });
    expect(second.json()).toMatchObject({ order: 1 });

    const list = await app.inject({
      method: 'GET',
      url: '/check-in-items',
      headers: { authorization: owner.authHeader },
    });
    expect(list.json().items).toHaveLength(2);
  });

  test('rejects a duplicate key for the same account', async () => {
    const owner = await createTestAccount(app, 'Vince');
    const payload = { key: 'water_100oz', label: '100oz water', valueType: 'boolean' as const };

    await app.inject({ method: 'POST', url: '/check-in-items', headers: { authorization: owner.authHeader }, payload });
    const duplicate = await app.inject({
      method: 'POST',
      url: '/check-in-items',
      headers: { authorization: owner.authHeader },
      payload,
    });
    expect(duplicate.statusCode).toBe(409);
  });

  test('rejects a key with invalid characters', async () => {
    const owner = await createTestAccount(app, 'Vince');
    const response = await app.inject({
      method: 'POST',
      url: '/check-in-items',
      headers: { authorization: owner.authHeader },
      payload: { key: 'Water 100oz!', label: '100oz water', valueType: 'boolean' },
    });
    expect(response.statusCode).toBe(400);
  });

  test('archiving an item removes it from the default list', async () => {
    const owner = await createTestAccount(app, 'Vince');
    const created = await app.inject({
      method: 'POST',
      url: '/check-in-items',
      headers: { authorization: owner.authHeader },
      payload: { key: 'water_100oz', label: '100oz water', valueType: 'boolean' },
    });
    const { id } = created.json() as { id: string };

    const archived = await app.inject({
      method: 'DELETE',
      url: `/check-in-items/${id}`,
      headers: { authorization: owner.authHeader },
    });
    expect(archived.statusCode).toBe(204);

    const list = await app.inject({
      method: 'GET',
      url: '/check-in-items',
      headers: { authorization: owner.authHeader },
    });
    expect(list.json().items).toHaveLength(0);
  });

  test('an account cannot edit or archive another account\'s item', async () => {
    const owner = await createTestAccount(app, 'Vince');
    const stranger = await createTestAccount(app, 'Stranger');

    const created = await app.inject({
      method: 'POST',
      url: '/check-in-items',
      headers: { authorization: owner.authHeader },
      payload: { key: 'water_100oz', label: '100oz water', valueType: 'boolean' },
    });
    const { id } = created.json() as { id: string };

    const patch = await app.inject({
      method: 'PATCH',
      url: `/check-in-items/${id}`,
      headers: { authorization: stranger.authHeader },
      payload: { label: 'Hijacked' },
    });
    expect(patch.statusCode).toBe(404);

    const del = await app.inject({
      method: 'DELETE',
      url: `/check-in-items/${id}`,
      headers: { authorization: stranger.authHeader },
    });
    expect(del.statusCode).toBe(404);
  });

  test('patch updates the label without touching key or valueType', async () => {
    const owner = await createTestAccount(app, 'Vince');
    const created = await app.inject({
      method: 'POST',
      url: '/check-in-items',
      headers: { authorization: owner.authHeader },
      payload: { key: 'water_100oz', label: '100oz water', valueType: 'boolean' },
    });
    const { id } = created.json() as { id: string };

    const patched = await app.inject({
      method: 'PATCH',
      url: `/check-in-items/${id}`,
      headers: { authorization: owner.authHeader },
      payload: { label: 'Drink 100oz of water' },
    });
    expect(patched.statusCode).toBe(200);
    expect(patched.json()).toMatchObject({ key: 'water_100oz', label: 'Drink 100oz of water', valueType: 'boolean' });
  });
});
