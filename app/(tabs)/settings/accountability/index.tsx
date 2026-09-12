import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { FormField } from '@/src/components/shared/FormField';
import {
  useAcceptInvite,
  useAccountabilityCredential,
  useCreateAccountabilityAccount,
  useInvitePartner,
  usePairings,
} from '@/src/hooks/useAccountability';

export default function AccountabilityScreen() {
  const { status, credential, clearCredential } = useAccountabilityCredential();

  if (status !== 'ready') {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-neutral-950">
        <Text className="text-neutral-500 dark:text-neutral-400">Loading…</Text>
      </View>
    );
  }

  return credential ? (
    <LinkedView credential={credential} onForget={clearCredential} />
  ) : (
    <SetupView />
  );
}

function SetupView() {
  const [displayName, setDisplayName] = useState('');
  const createAccount = useCreateAccountabilityAccount();

  return (
    <ScrollView className="flex-1 bg-white dark:bg-neutral-950" contentContainerClassName="gap-5 px-6 py-6">
      <Text className="text-lg font-semibold text-neutral-900 dark:text-white">
        Get an accountability partner
      </Text>
      <Text className="text-sm text-neutral-500 dark:text-neutral-400">
        Invite someone to see a daily summary of the check-ins you configure — never your raw logs.
      </Text>

      <FormField label="Your name" value={displayName} onChangeText={setDisplayName} placeholder="e.g. Vince" />

      {createAccount.isError && (
        <Text className="text-sm text-red-600 dark:text-red-400">
          {createAccount.error instanceof Error ? createAccount.error.message : 'Failed to create account.'}
        </Text>
      )}

      <Pressable
        onPress={() => createAccount.mutate(displayName.trim())}
        disabled={displayName.trim().length === 0 || createAccount.isPending}
        className={`items-center rounded-full px-8 py-4 ${
          displayName.trim().length > 0 && !createAccount.isPending
            ? 'bg-neutral-900 active:opacity-80 dark:bg-white'
            : 'bg-neutral-300 dark:bg-neutral-800'
        }`}>
        <Text className="text-base font-semibold text-white dark:text-neutral-900">
          {createAccount.isPending ? 'Creating…' : 'Continue'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function LinkedView({
  credential,
  onForget,
}: {
  credential: NonNullable<ReturnType<typeof useAccountabilityCredential>['credential']>;
  onForget: () => void;
}) {
  const { data: pairings } = usePairings(credential);
  const invitePartner = useInvitePartner();
  const acceptInvite = useAcceptInvite();
  const [inviteCodeInput, setInviteCodeInput] = useState('');

  return (
    <ScrollView className="flex-1 bg-white dark:bg-neutral-950" contentContainerClassName="gap-6 px-6 py-6">
      <View>
        <Text className="text-lg font-semibold text-neutral-900 dark:text-white">
          Signed in as {credential.displayName}
        </Text>
        <Pressable onPress={onForget} className="mt-2">
          <Text className="text-sm text-red-600 dark:text-red-400">Forget this device</Text>
        </Pressable>
        <Text className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
          There&apos;s no password reset yet — make sure another device has this linked before forgetting it here.
        </Text>
      </View>

      <View className="gap-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <Text className="font-medium text-neutral-900 dark:text-white">Invite a partner</Text>
        {invitePartner.data && (
          <Text className="text-2xl font-bold tracking-widest text-neutral-900 dark:text-white">
            {invitePartner.data.code}
          </Text>
        )}
        <Pressable
          onPress={() => invitePartner.mutate(credential)}
          disabled={invitePartner.isPending}
          className="items-center rounded-full bg-neutral-900 py-3 active:opacity-80 dark:bg-white">
          <Text className="font-semibold text-white dark:text-neutral-900">
            {invitePartner.isPending ? 'Generating…' : invitePartner.data ? 'Generate a new code' : 'Generate invite code'}
          </Text>
        </Pressable>
      </View>

      <View className="gap-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <Text className="font-medium text-neutral-900 dark:text-white">Accept an invite</Text>
        <FormField
          label="Invite code"
          value={inviteCodeInput}
          onChangeText={setInviteCodeInput}
          autoCapitalize="characters"
          placeholder="e.g. K7M2QRXF"
        />
        {acceptInvite.isError && (
          <Text className="text-sm text-red-600 dark:text-red-400">
            {acceptInvite.error instanceof Error ? acceptInvite.error.message : 'Failed to accept invite.'}
          </Text>
        )}
        {acceptInvite.isSuccess && (
          <Text className="text-sm text-emerald-600 dark:text-emerald-400">
            You&apos;re now supporting {acceptInvite.data.displayName}.
          </Text>
        )}
        <Pressable
          onPress={() => acceptInvite.mutate({ credential, code: inviteCodeInput.trim() })}
          disabled={inviteCodeInput.trim().length === 0 || acceptInvite.isPending}
          className="items-center rounded-full border border-neutral-300 py-3 active:opacity-70 dark:border-neutral-700">
          <Text className="font-semibold text-neutral-900 dark:text-white">
            {acceptInvite.isPending ? 'Accepting…' : 'Accept'}
          </Text>
        </Pressable>
      </View>

      <View className="gap-2">
        <Text className="font-medium text-neutral-900 dark:text-white">People supporting me</Text>
        {pairings?.asTrackedUser.length === 0 && (
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">Nobody yet.</Text>
        )}
        {pairings?.asTrackedUser.map((p) => (
          <Text key={p.partnershipId} className="text-sm text-neutral-700 dark:text-neutral-300">
            {p.partnerDisplayName}
          </Text>
        ))}
      </View>

      <View className="gap-2">
        <Text className="font-medium text-neutral-900 dark:text-white">People I&apos;m supporting</Text>
        {pairings?.asPartner.length === 0 && (
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">Nobody yet.</Text>
        )}
        {pairings?.asPartner.map((p) => (
          <Text key={p.partnershipId} className="text-sm text-neutral-700 dark:text-neutral-300">
            {p.trackedDisplayName}
          </Text>
        ))}
      </View>

      <Pressable
        onPress={() => router.push('/settings/accountability/check-in-items')}
        className="items-center rounded-full border border-neutral-300 py-4 active:opacity-70 dark:border-neutral-700">
        <Text className="font-semibold text-neutral-900 dark:text-white">Configure check-in items</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push('/settings/accountability/send-checkin')}
        className="items-center rounded-full bg-neutral-900 py-4 active:opacity-80 dark:bg-white">
        <Text className="font-semibold text-white dark:text-neutral-900">Send today&apos;s check-in</Text>
      </Pressable>
    </ScrollView>
  );
}
