import { MockAccountabilityClient } from './MockAccountabilityClient';

describe('MockAccountabilityClient', () => {
  test('an invite code can be accepted by a different account to form a partnership', async () => {
    const client = new MockAccountabilityClient(0);
    const owner = await client.createAccount('Vince');
    const partner = await client.createAccount('Partner');

    const invite = await client.invitePartner(owner);
    const accepted = await client.acceptInvite(partner, invite.code);
    expect(accepted).toMatchObject({ accountId: owner.accountId, displayName: 'Vince' });

    const ownerPairings = await client.listPairings(owner);
    expect(ownerPairings.asTrackedUser).toHaveLength(1);
    const partnerPairings = await client.listPairings(partner);
    expect(partnerPairings.asPartner).toMatchObject([{ trackedAccountId: owner.accountId, trackedDisplayName: 'Vince' }]);
  });

  test('an unknown invite code rejects', async () => {
    const client = new MockAccountabilityClient(0);
    const account = await client.createAccount('Vince');
    await expect(client.acceptInvite(account, 'NOPE')).rejects.toThrow();
  });

  test('check-in items can be created, listed, updated, and archived', async () => {
    const client = new MockAccountabilityClient(0);
    const account = await client.createAccount('Vince');

    const item = await client.createCheckInItem(account, { key: 'water_100oz', label: '100oz water', valueType: 'boolean' });
    expect(item.order).toBe(0);

    const updated = await client.updateCheckInItem(account, item.id, { label: 'Drink 100oz' });
    expect(updated.label).toBe('Drink 100oz');

    await client.archiveCheckInItem(account, item.id);
    const items = await client.listCheckInItems(account);
    expect(items).toHaveLength(0);
  });

  test('a confirmed partner can read summaries, a stranger cannot', async () => {
    const client = new MockAccountabilityClient(0);
    const owner = await client.createAccount('Vince');
    const partner = await client.createAccount('Partner');
    const stranger = await client.createAccount('Stranger');

    const invite = await client.invitePartner(owner);
    await client.acceptInvite(partner, invite.code);

    await client.putDailySummary(owner, '2026-09-12', { water_100oz: true });

    const asPartner = await client.getAccountDailySummaries(partner, owner.accountId);
    expect(asPartner).toHaveLength(1);

    await expect(client.getAccountDailySummaries(stranger, owner.accountId)).rejects.toThrow();
  });
});
