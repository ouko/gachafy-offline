/**
 * Lazy gateway to the Radix service.
 *
 * Importing this file (instead of radix.ts directly) keeps the heavy
 * @radixdlt/radix-dapp-toolkit chunk out of the initial bundle.
 * The library is only fetched when the user first interacts with the wallet.
 */

import type { RadixService } from './radix';

let servicePromise: Promise<RadixService> | null = null;

export async function getRadixService(): Promise<RadixService> {
  if (!servicePromise) {
    servicePromise = import('./radix').then((mod) => mod.radixService);
  }
  return servicePromise;
}
