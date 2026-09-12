import type {
  AccountabilityCredential,
  CheckInItem,
  DailySummary,
  DateRange,
  InviteCode,
  NewCheckInItem,
  Pairings,
} from './types';

/**
 * Normalized abstraction over the accountability-partner backend — same
 * pattern as `LocationDiscoveryProvider`/`NutritionDataProvider`. Unlike
 * those, almost every call needs a caller's credential (there's no per-app
 * "current user" the way local SQLite has), so it's threaded through as an
 * explicit parameter rather than baked into the client instance — the
 * instance itself stays stateless and is created once, like the other
 * service adapters.
 */
export interface AccountabilityClient {
  createAccount(displayName: string): Promise<AccountabilityCredential>;

  invitePartner(credential: AccountabilityCredential): Promise<InviteCode>;
  acceptInvite(credential: AccountabilityCredential, code: string): Promise<{ accountId: string; displayName: string }>;
  listPairings(credential: AccountabilityCredential): Promise<Pairings>;

  listCheckInItems(credential: AccountabilityCredential): Promise<CheckInItem[]>;
  createCheckInItem(credential: AccountabilityCredential, input: NewCheckInItem): Promise<CheckInItem>;
  updateCheckInItem(
    credential: AccountabilityCredential,
    id: string,
    input: { label?: string; order?: number }
  ): Promise<CheckInItem>;
  archiveCheckInItem(credential: AccountabilityCredential, id: string): Promise<void>;

  putDailySummary(
    credential: AccountabilityCredential,
    date: string,
    payload: DailySummary['payload']
  ): Promise<DailySummary>;

  getAccountCheckInItems(credential: AccountabilityCredential, accountId: string): Promise<CheckInItem[]>;
  getAccountDailySummaries(
    credential: AccountabilityCredential,
    accountId: string,
    range?: DateRange
  ): Promise<DailySummary[]>;
}
