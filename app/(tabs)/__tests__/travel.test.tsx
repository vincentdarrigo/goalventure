import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { createDayType } from '@/src/db/repositories/dayTypeRepo';
import { foodLogsInRangeQuery } from '@/src/db/repositories/foodLogRepo';
import { createUserProfile } from '@/src/db/repositories/userProfileRepo';
import { setWeekdayDayType } from '@/src/db/repositories/weeklyScheduleRepo';
import { resetTestDb } from '@/src/db/testClient';

import TravelScreen from '../travel';

const ZONE = 'UTC';

// The discovery adapter is the thing under test for failure — force both
// queries to reject, simulating an offline device or a provider outage.
jest.mock('@/src/services/location-discovery', () => ({
  createLocationDiscoveryProvider: () => ({
    findHighProteinFood: jest.fn().mockRejectedValue(new Error('network down')),
    findMovementDestinations: jest.fn().mockRejectedValue(new Error('network down')),
  }),
}));

beforeEach(async () => {
  resetTestDb();
  await createUserProfile({ timezone: ZONE, hydrationGoalOz: 100, units: 'imperial' });
  const dayType = await createDayType({
    name: 'Flexible Day',
    isFastDay: false,
    calorieTarget: 2000,
    proteinTarget: 150,
  });
  // useFastingState resolves yesterday/today/tomorrow, so every weekday needs
  // a mapping — not just today's — or resolution throws for the neighbors.
  for (let weekday = 1; weekday <= 7; weekday++) {
    await setWeekdayDayType(weekday, dayType.id);
  }
});

function renderTravelScreen() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <TravelScreen />
    </QueryClientProvider>
  );
}

test('manual "I ate this" logging still works when nearby-place discovery fails (FR-08)', async () => {
  await renderTravelScreen();

  // Both discovery lists surface the failure rather than blocking the screen.
  await waitFor(() => {
    expect(screen.getAllByText(/couldn.t load nearby options/i).length).toBe(2);
  });

  // The manual fallback is present and usable regardless.
  await fireEvent.changeText(screen.getByTestId('manual-food-description'), 'Roadside diner burger');
  await fireEvent.changeText(screen.getByTestId('manual-food-calories'), '650');
  await fireEvent.changeText(screen.getByTestId('manual-food-protein'), '35');
  await fireEvent.press(screen.getByTestId('manual-food-submit'));

  await waitFor(async () => {
    const rows = await foodLogsInRangeQuery('1970-01-01T00:00:00.000Z', '2999-01-01T00:00:00.000Z');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      description: 'Roadside diner burger',
      calories: 650,
      proteinG: 35,
    });
  });
});
