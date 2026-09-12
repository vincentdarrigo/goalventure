export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface FoodVenueResult {
  id: string;
  name: string;
  cuisineOrCategory: string;
  distanceMeters: number;
  /** A heuristic, never a guaranteed nutrition fact — see spec's out-of-scope note. */
  estimatedProteinFriendly: boolean;
  address?: string;
  notes?: string;
}

export interface MovementDestinationResult {
  id: string;
  name: string;
  category: 'park' | 'trail' | 'walkable_landmark' | 'other';
  distanceMeters: number;
  estimatedWalkMinutes?: number;
  address?: string;
}

export interface DiscoveryQueryOptions {
  radiusMeters: number;
  limit?: number;
}
