/** Returned once, at account creation. Persisted client-side (SecureStore); the server keeps only its hash. */
export interface AccountabilityCredential {
  accountId: string;
  accountSecret: string;
  displayName: string;
}

export interface InviteCode {
  code: string;
  expiresAt: string;
}

export interface TrackedByPartner {
  partnershipId: string;
  partnerAccountId: string;
  partnerDisplayName: string;
}

export interface SupportingAccount {
  partnershipId: string;
  trackedAccountId: string;
  trackedDisplayName: string;
}

export interface Pairings {
  asTrackedUser: TrackedByPartner[];
  asPartner: SupportingAccount[];
}

export type CheckInValueType = 'boolean' | 'number' | 'text';

export interface CheckInItem {
  id: string;
  key: string;
  label: string;
  valueType: CheckInValueType;
  order: number;
}

export interface NewCheckInItem {
  key: string;
  label: string;
  valueType: CheckInValueType;
}

export type CheckInPayload = Record<string, boolean | number | string>;

export interface DailySummary {
  date: string;
  payload: CheckInPayload;
  updatedAt: string;
}

export interface DateRange {
  from?: string;
  to?: string;
}
