import { MockAccountabilityClient } from './MockAccountabilityClient';
import { RealAccountabilityClient } from './RealAccountabilityClient';

export type { AccountabilityClient } from './AccountabilityClient';
export * from './types';

/**
 * Defaults to the in-memory mock, with no network dependency. Set
 * EXPO_PUBLIC_ACCOUNTABILITY_PROVIDER=real + EXPO_PUBLIC_BACKEND_URL to talk
 * to a real deployed backend/ instance — screens and hooks never need to
 * change either way.
 */
export function createAccountabilityClient() {
  const mode = process.env.EXPO_PUBLIC_ACCOUNTABILITY_PROVIDER ?? 'mock';
  if (mode === 'real') {
    const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
    if (!baseUrl) {
      throw new Error('EXPO_PUBLIC_ACCOUNTABILITY_PROVIDER=real requires EXPO_PUBLIC_BACKEND_URL to be set.');
    }
    return new RealAccountabilityClient(baseUrl.replace(/\/$/, ''));
  }
  return new MockAccountabilityClient();
}
