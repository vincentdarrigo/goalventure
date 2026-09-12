import type { NutritionDataProvider } from './NutritionDataProvider';
import type { NutritionDetail, NutritionSearchOptions, NutritionSearchResult } from './types';

const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

// USDA nutrient IDs — see https://fdc.nal.usda.gov/api-guide.html
const NUTRIENT_ID = {
  ENERGY_KCAL: 1008,
  PROTEIN_G: 1003,
  FAT_G: 1004,
  CARBS_G: 1005,
  FIBER_G: 1079,
} as const;

// The /foods/search endpoint doesn't need per-nutrient parsing — description/
// brand/dataType are enough to render a result; full nutrition only gets
// fetched (and parsed) on import, via getDetail below.
interface UsdaSearchFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  dataType?: string;
}

interface UsdaSearchResponse {
  foods: UsdaSearchFood[];
}

// The /food/{fdcId} endpoint's nested nutrient shape — NOT the same shape as
// search's. Some Branded records have also been observed missing the nested
// `nutrient` object entirely (incomplete source data) — extraction below is
// defensive against both endpoint-shape differences and missing fields, since
// a partial/zeroed import is always fine here: the user can edit any field.
interface UsdaDetailFoodNutrient {
  nutrient?: { id: number };
  amount?: number;
}

interface UsdaDetailResponse {
  fdcId: number;
  description: string;
  brandOwner?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients?: UsdaDetailFoodNutrient[];
}

function buildUrl(path: string, params: Record<string, string>): string {
  const query = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return `${BASE_URL}${path}?${query}`;
}

function extractNutrient(
  nutrients: UsdaDetailFoodNutrient[] | undefined,
  nutrientId: number
): number | undefined {
  return nutrients?.find((n) => n.nutrient?.id === nutrientId)?.amount;
}

/** Real implementation against USDA FoodData Central's free public API. */
export class UsdaFdcProvider implements NutritionDataProvider {
  constructor(private readonly apiKey: string) {}

  async search(query: string, options?: NutritionSearchOptions): Promise<NutritionSearchResult[]> {
    const url = buildUrl('/foods/search', {
      query,
      pageSize: String(options?.limit ?? 15),
      api_key: this.apiKey,
    });
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`USDA FoodData Central search failed (${response.status})`);
    }
    const data = (await response.json()) as UsdaSearchResponse;
    return data.foods.map((food) => ({
      externalId: String(food.fdcId),
      provider: 'usda_fdc' as const,
      description: food.description,
      brand: food.brandOwner,
      dataType: food.dataType,
    }));
  }

  async getDetail(externalId: string): Promise<NutritionDetail> {
    const url = buildUrl(`/food/${externalId}`, { api_key: this.apiKey });
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`USDA FoodData Central detail lookup failed (${response.status})`);
    }
    const food = (await response.json()) as UsdaDetailResponse;

    // Foundation/SR Legacy records report nutrients per 100g with no explicit
    // servingSize field; Branded records set servingSize/servingSizeUnit directly.
    return {
      externalId,
      provider: 'usda_fdc',
      description: food.description,
      brand: food.brandOwner,
      servingSizeAmount: food.servingSize ?? 100,
      servingSizeUnit: food.servingSizeUnit ?? 'g',
      servingDescription: food.householdServingFullText,
      calories: extractNutrient(food.foodNutrients, NUTRIENT_ID.ENERGY_KCAL) ?? 0,
      proteinG: extractNutrient(food.foodNutrients, NUTRIENT_ID.PROTEIN_G) ?? 0,
      carbsG: extractNutrient(food.foodNutrients, NUTRIENT_ID.CARBS_G),
      fatG: extractNutrient(food.foodNutrients, NUTRIENT_ID.FAT_G),
      fiberG: extractNutrient(food.foodNutrients, NUTRIENT_ID.FIBER_G),
    };
  }
}
