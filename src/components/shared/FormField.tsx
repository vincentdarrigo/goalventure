import type { ReactNode } from 'react';
import { Text, TextInput, type TextInputProps, View } from 'react-native';

const inputClassName =
  'rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-base text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white';

export function FormField({ label, ...inputProps }: { label: ReactNode } & TextInputProps) {
  return (
    <View>
      <Text className="mb-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">
        {label}
      </Text>
      <TextInput placeholderTextColor="#9ca3af" className={inputClassName} {...inputProps} />
    </View>
  );
}
