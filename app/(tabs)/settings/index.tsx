import { router } from 'expo-router';
import { ScrollView } from 'react-native';

import { ListRow } from '@/src/components/settings/ListRow';

export default function SettingsScreen() {
  return (
    <ScrollView className="flex-1 bg-white dark:bg-neutral-950">
      <ListRow
        title="Profile"
        subtitle="Weight goals, hydration, alcohol rule, health focus"
        onPress={() => router.push('/settings/profile')}
      />
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
      <ListRow
        title="Meal Presets"
        subtitle="Reusable meals for one-tap logging"
        onPress={() => router.push('/settings/meal-presets')}
      />
      <ListRow
        title="Meal Stacks"
        subtitle="Bundle presets into one combined log"
        onPress={() => router.push('/settings/meal-stacks')}
      />
      <ListRow
        title="Supplements"
        subtitle="Dosages and timing for daily tracking"
        onPress={() => router.push('/settings/supplements')}
      />
      <ListRow
        title="Pantry"
        subtitle="Ingredients with real nutrition data"
        onPress={() => router.push('/settings/pantry')}
      />
      <ListRow
        title="Accountability"
        subtitle="Pair with a partner, configure check-ins"
        onPress={() => router.push('/settings/accountability')}
      />
      <ListRow
        title="Data"
        subtitle="Reset all data (development/QA)"
        onPress={() => router.push('/settings/data')}
      />
    </ScrollView>
  );
}
