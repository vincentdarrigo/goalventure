import type { NutritionDetail, NutritionSearchOptions, NutritionSearchResult } from './types';

/**
 * Normalized abstraction over "wherever nutrition data comes from," so Pantry
 * never depends on a specific vendor's response shape — same pattern as
 * `LocationDiscoveryProvider`. `MockNutritionDataProvider` is the only
 * implementation needed to develop/test against; `UsdaFdcProvider` is the
 * real one, swapped in via `createNutritionDataProvider()`.
 */
export interface NutritionDataProvider {
  search(query: string, options?: NutritionSearchOptions): Promise<NutritionSearchResult[]>;
  getDetail(externalId: string): Promise<NutritionDetail>;
}
