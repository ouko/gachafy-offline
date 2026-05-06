import type { RadixDappToolkit } from '@radixdlt/radix-dapp-toolkit';
import { withRetry, withTimeout, NetworkError, TransactionError } from './errorHandling';
import { validateInput, walletAddressSchema, balanceSchema, nonceSchema } from './validation';
import { logger } from './logger';
import { rateLimiter } from './rateLimiter';
import { GACHA_DEPLOYED } from './featureFlags';
import { RADIX_CONFIG, parseXrdAmount } from './radix-config';

/** Cryptographically-random uint64-safe nonce. Falls back to Math.random
 *  only if crypto.getRandomValues is unavailable (very old browsers). */
const generateNonce = (): number => {
  try {
    const buf = new Uint32Array(2);
    crypto.getRandomValues(buf);
    // Combine to a value within Number.MAX_SAFE_INTEGER (2^53 - 1).
    // Use top 21 bits of the high word + 32 bits of the low word.
    const hi = buf[0] >>> 11; // 21 bits
    const lo = buf[1]; // 32 bits
    return hi * 0x100000000 + lo;
  } catch {
    // Last-ditch fallback. Not secure; logged loudly.
    logger.warn('crypto.getRandomValues unavailable, falling back to Math.random', null, 'RadixService');
    return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  }
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
    } catch (error) {
      logger.error('Failed to initialize Radix DApp Toolkit', error, 'RadixService');
      throw new NetworkError('Failed to initialize wallet connection');
    }
  }

  async connectWallet(): Promise<{ accounts: { address: string }[] } | null> {
    if (!this.rdt) await this.initialize();

    if (!rateLimiter.check('wallet_connect', { maxRequests: 3, windowMs: 60000, keyPrefix: 'radix' })) {
      logger.warn('Wallet connection rate limited', null, 'RadixService');
      return null;
    }

    try {
      logger.info('Attempting wallet connection', null, 'RadixService');
      const { DataRequestBuilder } = await import('@radixdlt/radix-dapp-toolkit');
      await this.rdt!.walletApi.setRequestData(DataRequestBuilder.accounts().atLeast(1));
      const result = await this.rdt!.walletApi.sendRequest();
      logger.info('Wallet connection succeeded', null, 'RadixService');
      return result;
    } catch (error) {
      logger.error('Wallet connection failed', error, 'RadixService');
      return null;
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

    // Defensive sanitization: Radix addresses should only contain alphanumeric
    // and underscore characters. Anything else could break manifest syntax.
    const safeAddress = accountAddress.replace(/[^a-zA-Z0-9_]/g, '');
    if (safeAddress !== accountAddress) {
      throw new TransactionError('Wallet address contains invalid characters');
    }

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
        ${nonce}u64
        "${safeAddress}";

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

      const txHash = (result as { value?: { transactionIntentHash?: string } })?.value?.transactionIntentHash;
      if (!txHash || typeof txHash !== 'string') {
        throw new TransactionError('Wallet returned no transaction hash');
      }
      logger.info('Transaction submitted', { txHash }, 'RadixService');
      return txHash;
    } catch (error) {
      logger.error('Transaction submission failed', error, 'RadixService');
      if (error instanceof TransactionError) throw error;
      throw new TransactionError('Failed to submit transaction');
    }
  }

  async getTransactionStatus(txHash: string): Promise<'success' | 'failed' | 'pending'> {
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
    ).catch((error) => {
      logger.warn('Error checking transaction status', error, 'RadixService');
      return 'pending' as const;
    });
  }

  /**
   * Query an account's NFT holdings to surface created Capsules.
   * Returns the raw gateway items; callers filter for the Capsule resource.
   *
   * On-chain aggregation of earnings is not implemented yet — see the
   * Creator dashboard for honest zeros.
   */
  async getUserCapsules(walletAddress: string): Promise<unknown[]> {
    validateInput(walletAddressSchema, walletAddress, 'Invalid wallet address');

    try {
      const response = await withTimeout(
        fetch(`${RADIX_CONFIG.gatewayUrl}/state/entity/details`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            addresses: [walletAddress],
            aggregation_level: 'Vault',
            opt_ins: {
              ancestor_identities: false,
              component_royalty_vault_balance: false,
              package_royalty_vault_balance: false,
              non_fungible_include_nfids: true,
              explicit_metadata: [],
            },
          }),
        }),
        10000,
        'getUserCapsules timed out',
      );

      if (!response.ok) {
        throw new NetworkError(`Failed to fetch user capsules: ${response.statusText}`);
      }

      const data = await response.json();
      return data.items ?? [];
    } catch (error) {
      logger.error('Error fetching user capsules', error, 'RadixService');
      return [];
    }
  }
}

export const radixService = new RadixService();
