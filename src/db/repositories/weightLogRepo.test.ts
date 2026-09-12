import { deleteWeightLog, logWeight, weightLogsQuery } from './weightLogRepo';
import { resetTestDb } from '../testClient';

beforeEach(() => {
  resetTestDb();
});

test('logs a weight entry and reads it back', async () => {
  await logWeight('2025-06-16', 265);
  const rows = await weightLogsQuery();
  expect(rows).toEqual([expect.objectContaining({ date: '2025-06-16', weight: 265 })]);
});

test('logging again for the same date updates rather than duplicating', async () => {
  await logWeight('2025-06-16', 265);
  await logWeight('2025-06-16', 263);
  const rows = await weightLogsQuery();
  expect(rows).toHaveLength(1);
  expect(rows[0].weight).toBe(263);
});

test('deleting a weight entry removes it', async () => {
  const row = await logWeight('2025-06-16', 265);
  await deleteWeightLog(row.id);
  const rows = await weightLogsQuery();
  expect(rows).toHaveLength(0);
});
