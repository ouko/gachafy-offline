import { RadixDappToolkit, RadixNetwork } from '@radixdlt/radix-dapp-toolkit';

// Stokenet configuration
export const STOKENET_CONFIG = {
  networkId: RadixNetwork.Stokenet, // Use the correct enum
  dAppDefinitionAddress: 'account_tdx_2_129vr3rwyz7gnwf35kkuxvx0fs4hkz0n5hem9utaejqra3sxf0m5wej',
  rpcUrl: 'https://stokenet.radixdlt.com',
  gatewayUrl: 'https://stokenet-gateway.radixdlt.com'
};

// XRD resource address on Stokenet
export const XRD_RESOURCE_ADDRESS = 'resource_tdx_2_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxtfd2jc';

// Gacha package and component addresses (these would need to be deployed)
export const GACHA_PACKAGE_ADDRESS = 'package_tdx_2_1p4r8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p';
export const GACHA_COMPONENT_ADDRESS = 'component_tdx_2_1cp4r8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p8p';

class RadixService {
  private rdt: RadixDappToolkit | null = null;
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      console.log('Initializing Radix DApp Toolkit...');
      this.rdt = RadixDappToolkit({
        dAppDefinitionAddress: STOKENET_CONFIG.dAppDefinitionAddress,
        networkId: STOKENET_CONFIG.networkId,
        applicationName: 'GachaFi',
        applicationVersion: '1.0.0',
      });

      console.log('Radix DApp Toolkit initialized successfully');
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Radix DApp Toolkit:', error);
      throw error;
    }
  }

  async connectWallet(): Promise<any> {
    if (!this.rdt) await this.initialize();
    
    try {
      console.log('Attempting wallet connection...');
      
      // Request login with accounts
      const result = await this.rdt!.walletApi.setRequestData({
        accounts: { quantifier: 'atLeast', quantity: 1 },
      });

      console.log('Wallet connection result:', result);
      return result;
    } catch (error) {
      console.error('Wallet connection error:', error);
      return null;
    }
  }

  async getBalance(accountAddress: string): Promise<number> {
    try {
      const response = await fetch(`${STOKENET_CONFIG.gatewayUrl}/state/entity/details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addresses: [accountAddress],
          aggregation_level: 'Vault',
          opt_ins: {
            fungible_resource_balances: true,
          },
        }),
      });

      const data = await response.json();
      const fungibleResources = data.items[0]?.fungible_resources?.items || [];
      
      const xrdBalance = fungibleResources.find(
        (resource: any) => resource.resource_address === XRD_RESOURCE_ADDRESS
      );

      return xrdBalance ? parseFloat(xrdBalance.amount) / Math.pow(10, 18) : 0;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0;
    }
  }

  async mintGachaBadge(accountAddress: string, tier: string, amount: number): Promise<string> {
    if (!this.rdt) await this.initialize();

    // Generate a simple nonce for VDF (in real implementation, this would be more complex)
    const nonce = Math.floor(Math.random() * 1000000);
    
    // Create the transaction manifest
    const manifest = `
      CALL_METHOD
        Address("${accountAddress}")
        "withdraw"
        Address("${XRD_RESOURCE_ADDRESS}")
        Decimal("${amount}");

      TAKE_FROM_WORKTOP
        Address("${XRD_RESOURCE_ADDRESS}")
        Decimal("${amount}")
        Bucket("xrd_bucket");

      CALL_METHOD
        Address("${GACHA_COMPONENT_ADDRESS}")
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
      const result = await this.rdt!.walletApi.sendTransaction({
        transactionManifest: manifest,
        version: 1,
      });

      return (result as any)?.value?.transactionIntentHash || 'mock_tx_' + Date.now();
    } catch (error) {
      console.error('Transaction error:', error);
      // Return a mock transaction hash for development
      return 'mock_tx_' + Date.now();
    }
  }

  async getTransactionStatus(txHash: string): Promise<'success' | 'failed' | 'pending'> {
    try {
      const response = await fetch(`${STOKENET_CONFIG.gatewayUrl}/transaction/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          intent_hash: txHash,
        }),
      });

      const data = await response.json();
      
      if (data.status === 'CommittedSuccess') return 'success';
      if (data.status === 'CommittedFailure') return 'failed';
      return 'pending';
    } catch (error) {
      console.error('Error checking transaction status:', error);
      return 'pending';
    }
  }
}

export const radixService = new RadixService();

// Helper function to shorten transaction hash for display
export const shortenTxHash = (hash: string): string => {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
};