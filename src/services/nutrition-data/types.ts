export type NutritionProviderId = 'usda_fdc';

export interface NutritionSearchResult {
  externalId: string;
  provider: NutritionProviderId;
  description: string;
  brand?: string;
  dataType?: string;
}

export interface NutritionDetail {
  externalId: string;
  provider: NutritionProviderId;
  description: string;
  brand?: string;
  servingSizeAmount: number;
  servingSizeUnit: string;
  servingDescription?: string;
  calories: number;
  proteinG: number;
  carbsG?: number;
  fatG?: number;
  fiberG?: number;
}

export interface NutritionSearchOptions {
  limit?: number;
}
