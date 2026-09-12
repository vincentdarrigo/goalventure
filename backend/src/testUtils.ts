import type { FastifyInstance } from 'fastify';

export async function createTestAccount(app: FastifyInstance, displayName: string) {
  const response = await app.inject({ method: 'POST', url: '/accounts', payload: { displayName } });
  const body = response.json() as { accountId: string; accountSecret: string; displayName: string };
  return { ...body, authHeader: `Bearer ${body.accountId}.${body.accountSecret}` };
}
