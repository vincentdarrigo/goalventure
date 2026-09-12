import { MockLocationDiscoveryProvider } from './MockLocationDiscoveryProvider';
import type { LocationDiscoveryProvider } from './LocationDiscoveryProvider';

export type { LocationDiscoveryProvider } from './LocationDiscoveryProvider';
export * from './types';

/**
 * Defaults to the mock provider, with no API key or network dependency.
 * Set EXPO_PUBLIC_DISCOVERY_PROVIDER to switch to a real vendor once one
 * exists — the Travel screen and its hooks never need to change either way.
 */
export function createLocationDiscoveryProvider(): LocationDiscoveryProvider {
  const mode = process.env.EXPO_PUBLIC_DISCOVERY_PROVIDER ?? 'mock';
  switch (mode) {
    case 'mock':
    default:
      return new MockLocationDiscoveryProvider();
  }
}
