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

function authHeader(credential: AccountabilityCredential): string {
  return `Bearer ${credential.accountId}.${credential.accountSecret}`;
}

/** Real implementation, talking to the Goalventure backend (see backend/src/routes/). */
export class RealAccountabilityClient implements AccountabilityClient {
  constructor(private readonly baseUrl: string) {}

  private async request<T>(
    path: string,
    options: { method?: string; credential?: AccountabilityCredential; body?: unknown } = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.credential ? { Authorization: authHeader(options.credential) } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? `Request failed (${response.status})`);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }

  async createAccount(displayName: string): Promise<AccountabilityCredential> {
    return this.request('/accounts', { method: 'POST', body: { displayName } });
  }

  async invitePartner(credential: AccountabilityCredential): Promise<InviteCode> {
    return this.request('/pairings/invite', { method: 'POST', credential });
  }

  async acceptInvite(
    credential: AccountabilityCredential,
    code: string
  ): Promise<{ accountId: string; displayName: string }> {
    return this.request('/pairings/accept', { method: 'POST', credential, body: { code } });
  }

  async listPairings(credential: AccountabilityCredential): Promise<Pairings> {
    return this.request('/pairings', { credential });
  }

  async listCheckInItems(credential: AccountabilityCredential): Promise<CheckInItem[]> {
    const { items } = await this.request<{ items: CheckInItem[] }>('/check-in-items', { credential });
    return items;
  }

  async createCheckInItem(credential: AccountabilityCredential, input: NewCheckInItem): Promise<CheckInItem> {
    return this.request('/check-in-items', { method: 'POST', credential, body: input });
  }

  async updateCheckInItem(
    credential: AccountabilityCredential,
    id: string,
    input: { label?: string; order?: number }
  ): Promise<CheckInItem> {
    return this.request(`/check-in-items/${id}`, { method: 'PATCH', credential, body: input });
  }

  async archiveCheckInItem(credential: AccountabilityCredential, id: string): Promise<void> {
    await this.request(`/check-in-items/${id}`, { method: 'DELETE', credential });
  }

  async putDailySummary(
    credential: AccountabilityCredential,
    date: string,
    payload: DailySummary['payload']
  ): Promise<DailySummary> {
    return this.request('/daily-summaries', { method: 'PUT', credential, body: { date, payload } });
  }

  async getAccountCheckInItems(credential: AccountabilityCredential, accountId: string): Promise<CheckInItem[]> {
    const { items } = await this.request<{ items: CheckInItem[] }>(`/accounts/${accountId}/check-in-items`, {
      credential,
    });
    return items;
  }

  async getAccountDailySummaries(
    credential: AccountabilityCredential,
    accountId: string,
    range?: DateRange
  ): Promise<DailySummary[]> {
    const query = new URLSearchParams();
    if (range?.from) query.set('from', range.from);
    if (range?.to) query.set('to', range.to);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const { summaries } = await this.request<{ summaries: DailySummary[] }>(
      `/accounts/${accountId}/daily-summaries${suffix}`,
      { credential }
    );
    return summaries;
  }
}
