import { router } from 'expo-router';
import { ScrollView } from 'react-native';

import { ListRow } from '@/src/components/settings/ListRow';

export default function SettingsScreen() {
  return (
    <ScrollView className="flex-1 bg-white dark:bg-neutral-950">
      <ListRow title="Day Types" subtitle="Eating windows, targets" onPress={() => router.push('/settings/day-types')} />
      <ListRow
        title="Weekly Schedule"
        subtitle="Which day type applies each weekday"
        onPress={() => router.push('/settings/weekly-schedule')}
      />
      <ListRow
        title="Date Overrides"
        subtitle="One-off swaps for travel, holidays, illness"
        onPress={() => router.push('/settings/overrides')}
      />
    </ScrollView>
  );
}
