import type { LocationDiscoveryProvider } from './LocationDiscoveryProvider';
import { DEFAULT_FOOD_FIXTURES, DEFAULT_MOVEMENT_FIXTURES } from './fixtures';
import type { DiscoveryQueryOptions, FoodVenueResult, GeoPoint, MovementDestinationResult } from './types';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** MVP default: canned fixtures with simulated latency, no API key or network required. */
export class MockLocationDiscoveryProvider implements LocationDiscoveryProvider {
  constructor(
    private readonly fixtures = { food: DEFAULT_FOOD_FIXTURES, movement: DEFAULT_MOVEMENT_FIXTURES },
    private readonly simulatedLatencyMs = 400
  ) {}

  async findHighProteinFood(
    _location: GeoPoint,
    options: DiscoveryQueryOptions
  ): Promise<FoodVenueResult[]> {
    await delay(this.simulatedLatencyMs);
    return this.fixtures.food.slice(0, options.limit ?? 10);
  }

  async findMovementDestinations(
    _location: GeoPoint,
    options: DiscoveryQueryOptions
  ): Promise<MovementDestinationResult[]> {
    await delay(this.simulatedLatencyMs);
    return this.fixtures.movement.slice(0, options.limit ?? 10);
  }
}
