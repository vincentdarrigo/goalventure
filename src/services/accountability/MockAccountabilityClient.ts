import type { AccountabilityClient } from './AccountabilityClient';
import type {
  AccountabilityCredential,
  CheckInItem,
  DailySummary,
  DateRange,
  InviteCode,
  NewCheckInItem,
  Pairings,
} from './types';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

interface MockAccountRecord {
  accountId: string;
  displayName: string;
}

interface MockInvite {
  code: string;
  ownerAccountId: string;
  expiresAt: string;
}

interface MockPartnership {
  trackedAccountId: string;
  partnerAccountId: string;
}

/**
 * Default: fully in-memory, no network or backend required — same role as
 * `MockNutritionDataProvider`/`MockLocationDiscoveryProvider`. State lives on
 * the instance (not module-level), so each `createAccountabilityClient()`
 * call starts fresh, same as the real client would against an empty backend.
 * Unlike those other mocks, pairing genuinely needs *some* mutable state to
 * be useful for developing the UI without a network — it isn't optional here.
 */
export class MockAccountabilityClient implements AccountabilityClient {
  private readonly accounts = new Map<string, MockAccountRecord>();
  private readonly invitesByCode = new Map<string, MockInvite>();
  private readonly partnerships: MockPartnership[] = [];
  private readonly checkInItemsByAccount = new Map<string, CheckInItem[]>();
  private readonly summariesByAccount = new Map<string, Map<string, DailySummary>>();

  constructor(private readonly simulatedLatencyMs = 200) {}

  private async requireConfirmed(viewerAccountId: string, targetAccountId: string) {
    await delay(this.simulatedLatencyMs);
    if (targetAccountId === viewerAccountId) return;
    const confirmed = this.partnerships.some(
      (p) => p.trackedAccountId === targetAccountId && p.partnerAccountId === viewerAccountId
    );
    if (!confirmed) throw new Error('not_a_confirmed_partner');
  }

  async createAccount(displayName: string): Promise<AccountabilityCredential> {
    await delay(this.simulatedLatencyMs);
    const accountId = randomId('mock-account');
    this.accounts.set(accountId, { accountId, displayName });
    this.checkInItemsByAccount.set(accountId, []);
    this.summariesByAccount.set(accountId, new Map());
    return { accountId, accountSecret: 'mock-secret', displayName };
  }

  async invitePartner(credential: AccountabilityCredential): Promise<InviteCode> {
    await delay(this.simulatedLatencyMs);
    const code = randomId('MOCK').toUpperCase();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    this.invitesByCode.set(code, { code, ownerAccountId: credential.accountId, expiresAt });
    return { code, expiresAt };
  }

  async acceptInvite(
    credential: AccountabilityCredential,
    code: string
  ): Promise<{ accountId: string; displayName: string }> {
    await delay(this.simulatedLatencyMs);
    const invite = this.invitesByCode.get(code.toUpperCase());
    if (!invite) throw new Error('code_not_found');
    if (new Date(invite.expiresAt).getTime() < Date.now()) throw new Error('code_expired');
    if (invite.ownerAccountId === credential.accountId) throw new Error('cannot_pair_with_self');

    this.partnerships.push({ trackedAccountId: invite.ownerAccountId, partnerAccountId: credential.accountId });
    const owner = this.accounts.get(invite.ownerAccountId);
    return { accountId: invite.ownerAccountId, displayName: owner?.displayName ?? 'Unknown' };
  }

  async listPairings(credential: AccountabilityCredential): Promise<Pairings> {
    await delay(this.simulatedLatencyMs);
    return {
      asTrackedUser: this.partnerships
        .filter((p) => p.trackedAccountId === credential.accountId)
        .map((p, i) => ({
          partnershipId: `${p.trackedAccountId}-${i}`,
          partnerAccountId: p.partnerAccountId,
          partnerDisplayName: this.accounts.get(p.partnerAccountId)?.displayName ?? 'Unknown',
        })),
      asPartner: this.partnerships
        .filter((p) => p.partnerAccountId === credential.accountId)
        .map((p, i) => ({
          partnershipId: `${p.partnerAccountId}-${i}`,
          trackedAccountId: p.trackedAccountId,
          trackedDisplayName: this.accounts.get(p.trackedAccountId)?.displayName ?? 'Unknown',
        })),
    };
  }

  async listCheckInItems(credential: AccountabilityCredential): Promise<CheckInItem[]> {
    await delay(this.simulatedLatencyMs);
    return [...(this.checkInItemsByAccount.get(credential.accountId) ?? [])];
  }

  async createCheckInItem(credential: AccountabilityCredential, input: NewCheckInItem): Promise<CheckInItem> {
    await delay(this.simulatedLatencyMs);
    const items = this.checkInItemsByAccount.get(credential.accountId) ?? [];
    if (items.some((i) => i.key === input.key)) throw new Error('key_already_exists');
    const item: CheckInItem = { id: randomId('item'), ...input, order: items.length };
    this.checkInItemsByAccount.set(credential.accountId, [...items, item]);
    return item;
  }

  async updateCheckInItem(
    credential: AccountabilityCredential,
    id: string,
    input: { label?: string; order?: number }
  ): Promise<CheckInItem> {
    await delay(this.simulatedLatencyMs);
    const items = this.checkInItemsByAccount.get(credential.accountId) ?? [];
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) throw new Error('not_found');
    const updated = { ...items[index]!, ...input };
    const next = [...items];
    next[index] = updated;
    this.checkInItemsByAccount.set(credential.accountId, next);
    return updated;
  }

  async archiveCheckInItem(credential: AccountabilityCredential, id: string): Promise<void> {
    await delay(this.simulatedLatencyMs);
    const items = this.checkInItemsByAccount.get(credential.accountId) ?? [];
    this.checkInItemsByAccount.set(credential.accountId, items.filter((i) => i.id !== id));
  }

  async putDailySummary(
    credential: AccountabilityCredential,
    date: string,
    payload: DailySummary['payload']
  ): Promise<DailySummary> {
    await delay(this.simulatedLatencyMs);
    const summary: DailySummary = { date, payload, updatedAt: new Date().toISOString() };
    const byDate = this.summariesByAccount.get(credential.accountId) ?? new Map();
    byDate.set(date, summary);
    this.summariesByAccount.set(credential.accountId, byDate);
    return summary;
  }

  async getAccountCheckInItems(credential: AccountabilityCredential, accountId: string): Promise<CheckInItem[]> {
    await this.requireConfirmed(credential.accountId, accountId);
    return [...(this.checkInItemsByAccount.get(accountId) ?? [])];
  }

  async getAccountDailySummaries(
    credential: AccountabilityCredential,
    accountId: string,
    range?: DateRange
  ): Promise<DailySummary[]> {
    await this.requireConfirmed(credential.accountId, accountId);
    const all = [...(this.summariesByAccount.get(accountId)?.values() ?? [])];
    return all
      .filter((s) => (!range?.from || s.date >= range.from) && (!range?.to || s.date <= range.to))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }
}
