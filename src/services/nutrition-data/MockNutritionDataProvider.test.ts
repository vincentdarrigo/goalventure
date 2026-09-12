import { MockNutritionDataProvider } from './MockNutritionDataProvider';

describe('MockNutritionDataProvider', () => {
  test('search matches on description, case-insensitively', async () => {
    const provider = new MockNutritionDataProvider(0);
    const results = await provider.search('CHICKEN');
    expect(results).toHaveLength(1);
    expect(results[0].description).toContain('Chicken');
  });

  test('search respects a limit', async () => {
    const provider = new MockNutritionDataProvider(0);
    const results = await provider.search('', { limit: 1 });
    expect(results).toHaveLength(1);
  });

  test('an unmatched query returns an empty list, not an error', async () => {
    const provider = new MockNutritionDataProvider(0);
    const results = await provider.search('nonexistent food xyz');
    expect(results).toEqual([]);
  });

  test('getDetail returns full nutrition for a known fixture', async () => {
    const provider = new MockNutritionDataProvider(0);
    const detail = await provider.getDetail('mock-1');
    expect(detail).toMatchObject({ calories: 165, proteinG: 31 });
  });

  test('getDetail rejects for an unknown id', async () => {
    const provider = new MockNutritionDataProvider(0);
    await expect(provider.getDetail('does-not-exist')).rejects.toThrow();
  });
});
