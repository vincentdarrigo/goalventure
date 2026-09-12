import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import type { AccountabilityCredential } from '@/src/services/accountability';

const STORAGE_KEY = 'goalventure_accountability_credential';

interface AccountabilityCredentialState {
  status: 'idle' | 'loading' | 'ready';
  credential: AccountabilityCredential | null;
  hydrate: () => Promise<void>;
  setCredential: (credential: AccountabilityCredential) => Promise<void>;
  clearCredential: () => Promise<void>;
}

/**
 * The one piece of genuinely ephemeral, cross-screen UI session state in the
 * app so far — everything else is either SQLite-backed (live-queried) or
 * local to a single screen. Backed by SecureStore rather than plain
 * AsyncStorage since `accountSecret` is a real bearer credential, not a UI
 * preference.
 */
export const useAccountabilityCredentialStore = create<AccountabilityCredentialState>((set) => ({
  status: 'idle',
  credential: null,

  hydrate: async () => {
    set({ status: 'loading' });
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    set({ credential: raw ? (JSON.parse(raw) as AccountabilityCredential) : null, status: 'ready' });
  },

  setCredential: async (credential) => {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(credential));
    set({ credential, status: 'ready' });
  },

  clearCredential: async () => {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
    set({ credential: null, status: 'ready' });
  },
}));
