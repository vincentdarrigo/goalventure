import type { FoodVenueResult, MovementDestinationResult } from './types';

export const DEFAULT_FOOD_FIXTURES: FoodVenueResult[] = [
  {
    id: 'food-1',
    name: 'Grilled Chicken Spot',
    cuisineOrCategory: 'American',
    distanceMeters: 450,
    estimatedProteinFriendly: true,
    notes: 'Grilled proteins, build-your-own bowls',
  },
  {
    id: 'food-2',
    name: 'Poke Bar',
    cuisineOrCategory: 'Hawaiian',
    distanceMeters: 900,
    estimatedProteinFriendly: true,
    notes: 'Ahi/salmon bowls, extra protein add-on',
  },
  {
    id: 'food-3',
    name: 'Downtown Pizzeria',
    cuisineOrCategory: 'Italian',
    distanceMeters: 1200,
    estimatedProteinFriendly: false,
  },
];

export const DEFAULT_MOVEMENT_FIXTURES: MovementDestinationResult[] = [
  {
    id: 'move-1',
    name: 'Riverside Park',
    category: 'park',
    distanceMeters: 600,
    estimatedWalkMinutes: 8,
  },
  {
    id: 'move-2',
    name: 'Lakefront Trail',
    category: 'trail',
    distanceMeters: 1500,
    estimatedWalkMinutes: 20,
  },
  {
    id: 'move-3',
    name: 'Historic Downtown District',
    category: 'walkable_landmark',
    distanceMeters: 800,
    estimatedWalkMinutes: 11,
  },
];
