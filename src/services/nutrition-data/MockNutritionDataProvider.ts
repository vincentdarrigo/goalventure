import type { NutritionDataProvider } from './NutritionDataProvider';
import { MOCK_DETAILS, MOCK_SEARCH_RESULTS } from './fixtures';
import type { NutritionDetail, NutritionSearchOptions, NutritionSearchResult } from './types';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Default: canned fixtures, no network or API key required. */
export class MockNutritionDataProvider implements NutritionDataProvider {
  constructor(private readonly simulatedLatencyMs = 300) {}

  async search(query: string, options?: NutritionSearchOptions): Promise<NutritionSearchResult[]> {
    await delay(this.simulatedLatencyMs);
    const matches = MOCK_SEARCH_RESULTS.filter((r) =>
      r.description.toLowerCase().includes(query.trim().toLowerCase())
    );
    return matches.slice(0, options?.limit ?? 10);
  }

  async getDetail(externalId: string): Promise<NutritionDetail> {
    await delay(this.simulatedLatencyMs);
    const detail = MOCK_DETAILS[externalId];
    if (!detail) {
      throw new Error(`No mock nutrition detail for "${externalId}"`);
    }
    return detail;
  }
}
