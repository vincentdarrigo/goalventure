import type { DiscoveryQueryOptions, FoodVenueResult, GeoPoint, MovementDestinationResult } from './types';

/**
 * Normalized abstraction over "wherever nearby-place data comes from," so the
 * Travel/Wildcard UI never depends on a specific vendor's response shape.
 * `MockLocationDiscoveryProvider` is the only implementation for the MVP; a
 * future real provider (Google Places, Yelp, Foursquare) only ever needs a
 * new class here, never a change to the Travel screen or its hooks.
 */
export interface LocationDiscoveryProvider {
  findHighProteinFood(
    location: GeoPoint,
    options: DiscoveryQueryOptions
  ): Promise<FoodVenueResult[]>;
  findMovementDestinations(
    location: GeoPoint,
    options: DiscoveryQueryOptions
  ): Promise<MovementDestinationResult[]>;
}
