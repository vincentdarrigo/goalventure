import type { NutritionDetail, NutritionSearchResult } from './types';

export const MOCK_SEARCH_RESULTS: NutritionSearchResult[] = [
  { externalId: 'mock-1', provider: 'usda_fdc', description: 'Chicken breast, cooked', dataType: 'Foundation' },
  { externalId: 'mock-2', provider: 'usda_fdc', description: 'Brown rice, cooked', dataType: 'Foundation' },
  { externalId: 'mock-3', provider: 'usda_fdc', description: 'Greek yogurt, plain', brand: 'Generic', dataType: 'Branded' },
];

export const MOCK_DETAILS: Record<string, NutritionDetail> = {
  'mock-1': {
    externalId: 'mock-1',
    provider: 'usda_fdc',
    description: 'Chicken breast, cooked',
    servingSizeAmount: 100,
    servingSizeUnit: 'g',
    calories: 165,
    proteinG: 31,
    carbsG: 0,
    fatG: 3.6,
  },
  'mock-2': {
    externalId: 'mock-2',
    provider: 'usda_fdc',
    description: 'Brown rice, cooked',
    servingSizeAmount: 100,
    servingSizeUnit: 'g',
    calories: 123,
    proteinG: 2.7,
    carbsG: 26,
    fatG: 1,
    fiberG: 1.6,
  },
  'mock-3': {
    externalId: 'mock-3',
    provider: 'usda_fdc',
    description: 'Greek yogurt, plain',
    brand: 'Generic',
    servingSizeAmount: 170,
    servingSizeUnit: 'g',
    servingDescription: '1 container (170g)',
    calories: 100,
    proteinG: 17,
    carbsG: 6,
    fatG: 0.5,
  },
};
