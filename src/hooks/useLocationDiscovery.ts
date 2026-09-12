import { useQuery } from '@tanstack/react-query';

import { createLocationDiscoveryProvider } from '@/src/services/location-discovery';
import type { DiscoveryQueryOptions, GeoPoint } from '@/src/services/location-discovery';

const provider = createLocationDiscoveryProvider();

// MVP: no real GPS integration yet (would need expo-location + permissions,
// out of this phase's scope) — a fixed placeholder location keeps the
// discovery UI fully functional without requesting location access.
const PLACEHOLDER_LOCATION: GeoPoint = { latitude: 0, longitude: 0 };
const DEFAULT_OPTIONS: DiscoveryQueryOptions = { radiusMeters: 5000, limit: 10 };

export function useHighProteinFood() {
  return useQuery({
    queryKey: ['discovery', 'food'],
    queryFn: () => provider.findHighProteinFood(PLACEHOLDER_LOCATION, DEFAULT_OPTIONS),
  });
}

export function useMovementDestinations() {
  return useQuery({
    queryKey: ['discovery', 'movement'],
    queryFn: () => provider.findMovementDestinations(PLACEHOLDER_LOCATION, DEFAULT_OPTIONS),
  });
}
