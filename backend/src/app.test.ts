import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { buildApp } from './app.js';
import { createTestDb } from './db/testClient.js';

describe('static partner web view', () => {
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

  test('serves index.html at the root', async () => {
    const response = await app.inject({ method: 'GET', url: '/' });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.body).toContain('Goalventure');
  });

  test('serves partner.html, app.js, and style.css', async () => {
    const partnerPage = await app.inject({ method: 'GET', url: '/partner.html' });
    expect(partnerPage.statusCode).toBe(200);

    const script = await app.inject({ method: 'GET', url: '/app.js' });
    expect(script.statusCode).toBe(200);
    expect(script.headers['content-type']).toContain('javascript');

    const styles = await app.inject({ method: 'GET', url: '/style.css' });
    expect(styles.statusCode).toBe(200);
  });
});
