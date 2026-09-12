import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { createAccountabilityClient } from '@/src/services/accountability';
import type { AccountabilityCredential, NewCheckInItem } from '@/src/services/accountability';
import { useAccountabilityCredentialStore } from '@/src/stores/accountabilityCredentialStore';

const client = createAccountabilityClient();

/** Hydrates the credential from SecureStore on first use; safe to call from multiple screens. */
export function useAccountabilityCredential() {
  const { status, credential, hydrate, setCredential, clearCredential } = useAccountabilityCredentialStore();

  useEffect(() => {
    if (status === 'idle') void hydrate();
  }, [status, hydrate]);

  return { status, credential, setCredential, clearCredential };
}

export function useCreateAccountabilityAccount() {
  const { setCredential } = useAccountabilityCredentialStore();
  return useMutation({
    mutationFn: (displayName: string) => client.createAccount(displayName),
    onSuccess: setCredential,
  });
}

export function usePairings(credential: AccountabilityCredential | null) {
  return useQuery({
    queryKey: ['accountability', 'pairings', credential?.accountId],
    queryFn: () => client.listPairings(credential!),
    enabled: credential !== null,
  });
}

export function useInvitePartner() {
  return useMutation({
    mutationFn: (credential: AccountabilityCredential) => client.invitePartner(credential),
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ credential, code }: { credential: AccountabilityCredential; code: string }) =>
      client.acceptInvite(credential, code),
    onSuccess: (_result, { credential }) => {
      void queryClient.invalidateQueries({ queryKey: ['accountability', 'pairings', credential.accountId] });
    },
  });
}

export function useCheckInItems(credential: AccountabilityCredential | null) {
  return useQuery({
    queryKey: ['accountability', 'check-in-items', credential?.accountId],
    queryFn: () => client.listCheckInItems(credential!),
    enabled: credential !== null,
  });
}

function useInvalidateCheckInItems(accountId: string | undefined) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['accountability', 'check-in-items', accountId] });
}

export function useCreateCheckInItem(credential: AccountabilityCredential | null) {
  const invalidate = useInvalidateCheckInItems(credential?.accountId);
  return useMutation({
    mutationFn: (input: NewCheckInItem) => client.createCheckInItem(credential!, input),
    onSuccess: invalidate,
  });
}

export function useUpdateCheckInItem(credential: AccountabilityCredential | null) {
  const invalidate = useInvalidateCheckInItems(credential?.accountId);
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: { label?: string; order?: number } }) =>
      client.updateCheckInItem(credential!, id, input),
    onSuccess: invalidate,
  });
}

export function useArchiveCheckInItem(credential: AccountabilityCredential | null) {
  const invalidate = useInvalidateCheckInItems(credential?.accountId);
  return useMutation({
    mutationFn: (id: string) => client.archiveCheckInItem(credential!, id),
    onSuccess: invalidate,
  });
}

export function usePutDailySummary() {
  return useMutation({
    mutationFn: ({
      credential,
      date,
      payload,
    }: {
      credential: AccountabilityCredential;
      date: string;
      payload: Record<string, boolean | number | string>;
    }) => client.putDailySummary(credential, date, payload),
  });
}
