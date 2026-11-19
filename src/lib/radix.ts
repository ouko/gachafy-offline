/**
 * Radix blockchain service.
 *
 * This is the ONLY file that directly imports @radixdlt/radix-dapp-toolkit.
 * Every other module should use `getRadixService()` from `radix-lazy.ts` to
 * avoid bloating the initial JavaScript bundle.
 *
 * Responsibilities:
 *   - Lazy-load RDT and initialise it with network + dApp config
 *   - Connect wallet (request account access)
 *   - Build and submit transaction manifests for minting
 *   - Poll balances and transaction status via the Gateway API
 *   - Generate nonces for transaction correlation
 *
 * Architecture note: This is a singleton. Instantiate once via `radixService`
 * and share through React Context (WalletContext).
 */

import type { RadixDappToolkit } from '@radixdlt/radix-dapp-toolkit';
import { withRetry, withTimeout, NetworkError, TransactionError } from './errorHandling';
import { validateInput, walletAddressSchema, balanceSchema, nonceSchema, txHashSchema } from './validation';
import { logger } from './logger';
import { rateLimiter } from './rateLimiter';
import { GACHA_DEPLOYED } from './featureFlags';
import { RADIX_CONFIG, parseXrdAmount } from './radix-config';

/** Cryptographically-random nonce within JavaScript's safe integer range. */
const generateNonce = (): number => {
  if (!globalThis.crypto?.getRandomValues) {
    throw new TransactionError('Secure random number generation is unavailable');
  }
  const buf = new Uint32Array(2);
  globalThis.crypto.getRandomValues(buf);
  // Combine 21 high bits and 32 low bits to stay below 2^53 - 1.
  const hi = buf[0] >>> 11;
  const lo = buf[1];
  return hi * 0x100000000 + lo;
};

// ----------------------------------------------------------------------------
// Service
// ----------------------------------------------------------------------------

class RadixService {
  private rdt: RadixDappToolkit | null = null;
  private initialized = false;
  private walletDataListeners = new Set<(data: unknown) => void>();

  onWalletData(listener: (data: unknown) => void) {
    this.walletDataListeners.add(listener);
    return () => this.walletDataListeners.delete(listener);
  }

  async initialize() {
    if (this.initialized) return;

    if (!RADIX_CONFIG.dAppDefinitionAddress) {
      logger.error(
        'VITE_RADIX_DAPP_DEFINITION is empty for the configured network. The wallet button will not work.',
        { network: RADIX_CONFIG.network },
        'RadixService',
      );
      throw new NetworkError('Radix dApp definition address is not configured');
    }

    try {
      logger.info(
        'Initializing Radix DApp Toolkit',
        { network: RADIX_CONFIG.network, gateway: RADIX_CONFIG.gatewayUrl },
        'RadixService',
      );

      const { RadixDappToolkit, DataRequestBuilder } = await import('@radixdlt/radix-dapp-toolkit');

      this.rdt = RadixDappToolkit({
        dAppDefinitionAddress: RADIX_CONFIG.dAppDefinitionAddress,
        networkId: RADIX_CONFIG.networkId,
        applicationName: RADIX_CONFIG.appName,
        applicationVersion: RADIX_CONFIG.appVersion,
      });

      try {
        this.rdt.buttonApi.setMode('dark');
      } catch {
        // setMode is best-effort — older toolkit versions throw.
      }

      // Default request: at least one account.
      await this.rdt.walletApi.setRequestData(DataRequestBuilder.accounts().atLeast(1));

      // Subscribe and fan out to listeners (Context, etc.).
      this.rdt.walletApi.walletData$.subscribe((walletData) => {
        logger.debug('Wallet data updated', { walletData }, 'RadixService');
        this.walletDataListeners.forEach((cb) => {
          try {
            cb(walletData);
          } catch (e) {
            logger.warn('Wallet data listener threw', e, 'RadixService');
          }
        });
      });

      logger.info('Radix DApp Toolkit ready', null, 'RadixService');
      this.initialized = true;

      // Ensure RDT's connect-button module discovers the hidden
      // <radix-connect-button> element. The element's connectedCallback()
      // may have fired before RDT's internal subscription was ready.
      window.dispatchEvent(new Event('onConnectButtonRender'));
    } catch (error) {
      logger.error('Failed to initialize Radix DApp Toolkit', error, 'RadixService');
      throw new NetworkError('Failed to initialize wallet connection');
    }
  }

  async connectWallet(): Promise<{ accounts: { address: string }[] } | null> {
    if (!this.rdt) await this.initialize();

    // More generous rate limit while debugging connection issues.
    if (!rateLimiter.check('wallet_connect', { maxRequests: 10, windowMs: 60000, keyPrefix: 'radix' })) {
      logger.warn('Wallet connection rate limited', null, 'RadixService');
      throw new TransactionError('Too many connection attempts. Please wait a moment.');
    }

    try {
      logger.info('Attempting wallet connection', null, 'RadixService');

      // If already connected, return cached data immediately.
      const cached = this.rdt!.walletApi.getWalletData();
      if (cached?.accounts && cached.accounts.length > 0) {
        logger.info('Wallet already connected', null, 'RadixService');
        return { accounts: cached.accounts as { address: string }[] };
      }

      // RDT v2 walletApi.sendRequest returns a ResultAsync (neverthrow).
      // We await it to get the Result, then unwrap the wallet data.
      const result = await withTimeout(
        this.rdt!.walletApi.sendRequest(),
        30000,
        'Wallet connection timed out',
      );

      if (result.isOk && typeof result.isOk === 'function' && result.isOk()) {
        const walletData = result.value;
        logger.info('Wallet connection succeeded', null, 'RadixService');
        return { accounts: walletData.accounts as { address: string }[] };
      }

      const err = (result as { error?: { message?: string } }).error;
      throw new TransactionError(err?.message ?? 'Wallet connection rejected');
    } catch (error) {
      logger.error('Wallet connection failed', error, 'RadixService');
      if (error instanceof TransactionError) throw error;
      throw new TransactionError('Failed to connect wallet');
    }
  }

  async getBalance(accountAddress: string): Promise<number> {
    validateInput(walletAddressSchema, accountAddress, 'Invalid wallet address');

    return await withRetry(
      async () => {
        const response = await withTimeout(
          fetch(`${RADIX_CONFIG.gatewayUrl}/state/entity/details`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              addresses: [accountAddress],
              aggregation_level: 'Vault',
              opt_ins: { fungible_resource_balances: true },
            }),
          }),
          10000,
          'Balance fetch timed out',
        );

        if (!response.ok) {
          throw new NetworkError(`Failed to fetch balance: ${response.statusText}`);
        }

        const data = await response.json();
        const fungibleResources = data?.items?.[0]?.fungible_resources?.items ?? [];

        const xrdBalance = fungibleResources.find(
          (resource: { resource_address: string; amount?: string }) =>
            resource.resource_address === RADIX_CONFIG.xrdResourceAddress,
        );

        // Gateway returns amounts as human-readable decimal strings (e.g. "10.5").
        const balance = parseXrdAmount(xrdBalance?.amount ?? '0');

        // Validate but don't cap — old schema rejected huge balances. Use a
        // generous ceiling that's still a sanity check (10 trillion XRD).
        return validateInput(balanceSchema, balance, 'Invalid balance received');
      },
      { maxAttempts: 3, delayMs: 1000 },
    ).catch((error) => {
      logger.error('Error fetching balance', error, 'RadixService');
      return 0;
    });
  }

  async mintGachaBadge(accountAddress: string, tier: string, amount: number): Promise<string> {
    if (!this.rdt) await this.initialize();

    validateInput(walletAddressSchema, accountAddress, 'Invalid wallet address');
    validateInput(balanceSchema, amount, 'Invalid amount');

    if (!['common', 'rare', 'epic'].includes(tier)) {
      throw new TransactionError('Invalid tier');
    }

    if (!GACHA_DEPLOYED) {
      throw new TransactionError(
        'Gacha component is not yet deployed. Set VITE_GACHA_PACKAGE_ADDRESS and VITE_GACHA_COMPONENT_ADDRESS.',
      );
    }

    if (!rateLimiter.check(`mint_${accountAddress}`, { maxRequests: 5, windowMs: 60000, keyPrefix: 'mint' })) {
      throw new TransactionError('Too many mint requests. Please wait before trying again.');
    }

    const nonce = validateInput(nonceSchema, generateNonce());

    // The wallet address has already been validated by walletAddressSchema
    // (strict Bech32m regex) at the top of this function. We do NOT apply
    // a generic character whitelist here — domain-specific validation is
    // safer than regex-based sanitisation for manifest injection defence.

    const manifest = `
      CALL_METHOD
        Address("${accountAddress}")
        "withdraw"
        Address("${RADIX_CONFIG.xrdResourceAddress}")
        Decimal("${amount}");

      TAKE_FROM_WORKTOP
        Address("${RADIX_CONFIG.xrdResourceAddress}")
        Decimal("${amount}")
        Bucket("xrd_bucket");

      CALL_METHOD
        Address("${RADIX_CONFIG.gachaComponentAddress}")
        "mint_gacha_badge"
        Bucket("xrd_bucket")
        "${tier}"
        ${nonce}u64;

      CALL_METHOD
        Address("${accountAddress}")
        "deposit_batch"
        Expression("ENTIRE_WORKTOP");
    `;

    try {
      logger.info('Submitting mint transaction', { tier, amount }, 'RadixService');
      const result = await this.rdt!.walletApi.sendTransaction({
        transactionManifest: manifest,
        version: 1,
      });

      // RDT v2.x returns a Result monad (neverthrow). Unwrap it safely.
      if (result.isOk && typeof result.isOk === 'function' && result.isOk()) {
        const txHash = (result.value as { transactionIntentHash?: string })?.transactionIntentHash;
        if (!txHash || typeof txHash !== 'string') {
          throw new TransactionError('Wallet returned no transaction hash');
        }
        logger.info('Transaction submitted', { txHash }, 'RadixService');
        return txHash;
      }

      const err = (result as { error?: { message?: string } }).error;
      throw new TransactionError(err?.message ?? 'Transaction was rejected by the wallet');
    } catch (error) {
      logger.error('Transaction submission failed', error, 'RadixService');
      if (error instanceof TransactionError) throw error;
      throw new TransactionError('Failed to submit transaction');
    }
  }

  async getTransactionStatus(txHash: string): Promise<'success' | 'failed' | 'pending'> {
    validateInput(txHashSchema, txHash, 'Invalid transaction hash');
    return await withRetry(
      async () => {
        const response = await withTimeout(
          fetch(`${RADIX_CONFIG.gatewayUrl}/transaction/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ intent_hash: txHash }),
          }),
          10000,
          'Transaction status check timed out',
        );

        if (!response.ok) {
          throw new NetworkError('Failed to check transaction status');
        }

        const data = await response.json();
        if (data.status === 'CommittedSuccess') return 'success';
        if (data.status === 'CommittedFailure') return 'failed';
        return 'pending';
      },
      { maxAttempts: 2, delayMs: 500 },
    );
  }

}

export const radixService = new RadixService();
