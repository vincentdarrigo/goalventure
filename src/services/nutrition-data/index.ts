import { MockNutritionDataProvider } from './MockNutritionDataProvider';
import type { NutritionDataProvider } from './NutritionDataProvider';
import { UsdaFdcProvider } from './UsdaFdcProvider';

export type { NutritionDataProvider } from './NutritionDataProvider';
export * from './types';

/**
 * Defaults to the mock provider, with no API key or network dependency.
 * Set EXPO_PUBLIC_NUTRITION_PROVIDER=usda_fdc + EXPO_PUBLIC_USDA_FDC_API_KEY
 * to search real USDA FoodData Central data — Pantry's screens and hooks
 * never need to change either way.
 */
export function createNutritionDataProvider(): NutritionDataProvider {
  const mode = process.env.EXPO_PUBLIC_NUTRITION_PROVIDER ?? 'mock';
  if (mode === 'usda_fdc') {
    const apiKey = process.env.EXPO_PUBLIC_USDA_FDC_API_KEY;
    if (!apiKey) {
      throw new Error(
        'EXPO_PUBLIC_NUTRITION_PROVIDER=usda_fdc requires EXPO_PUBLIC_USDA_FDC_API_KEY to be set.'
      );
    }
    return new UsdaFdcProvider(apiKey);
  }
  return new MockNutritionDataProvider();
}
