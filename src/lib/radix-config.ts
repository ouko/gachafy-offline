// Lightweight Radix configuration and utilities.
// This file has NO dependency on @radixdlt/radix-dapp-toolkit so it can be
// imported eagerly without bloating the initial bundle.

// ----------------------------------------------------------------------------
// Network configuration
// ----------------------------------------------------------------------------

type RadixNetworkName = 'stokenet' | 'mainnet';

const NETWORK_DEFAULTS: Record<RadixNetworkName, {
  networkId: number;
  gatewayUrl: string;
  xrdResourceAddress: string;
}> = {
  stokenet: {
    networkId: 2,
    gatewayUrl: 'https://babylon-stokenet-gateway.radixdlt.com',
    xrdResourceAddress: 'resource_tdx_2_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxtfd2jc',
  },
  mainnet: {
    networkId: 1,
    gatewayUrl: 'https://mainnet.radixdlt.com',
    xrdResourceAddress: 'resource_rdx1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxradxrd',
  },
};

const RAW_NETWORK = (import.meta.env.VITE_RADIX_NETWORK ?? 'stokenet').toLowerCase();
const NETWORK: RadixNetworkName = RAW_NETWORK === 'mainnet' ? 'mainnet' : 'stokenet';
const NETWORK_DEFAULT = NETWORK_DEFAULTS[NETWORK];

export const RADIX_CONFIG = {
  network: NETWORK,
  networkId: NETWORK_DEFAULT.networkId,
  gatewayUrl: import.meta.env.VITE_RADIX_GATEWAY_URL || NETWORK_DEFAULT.gatewayUrl,
  dAppDefinitionAddress:
    import.meta.env.VITE_RADIX_DAPP_DEFINITION ||
    (NETWORK === 'stokenet'
      ? 'account_tdx_2_129vr3rwyz7gnwf35kkuxvx0fs4hkz0n5hem9utaejqra3sxf0m5wej'
      : ''),
  xrdResourceAddress: import.meta.env.VITE_XRD_RESOURCE_ADDRESS || NETWORK_DEFAULT.xrdResourceAddress,
  gachaPackageAddress: import.meta.env.VITE_GACHA_PACKAGE_ADDRESS || '',
  gachaComponentAddress: import.meta.env.VITE_GACHA_COMPONENT_ADDRESS || '',
  gachaBadgeResourceAddress: import.meta.env.VITE_GACHA_BADGE_RESOURCE || '',
  appName: import.meta.env.VITE_APP_NAME || 'GachaFi',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
};

export const STOKENET_CONFIG = {
  networkId: RADIX_CONFIG.networkId,
  dAppDefinitionAddress: RADIX_CONFIG.dAppDefinitionAddress,
  rpcUrl: RADIX_CONFIG.gatewayUrl,
  gatewayUrl: RADIX_CONFIG.gatewayUrl,
};

export const XRD_RESOURCE_ADDRESS = RADIX_CONFIG.xrdResourceAddress;
export const GACHA_PACKAGE_ADDRESS = RADIX_CONFIG.gachaPackageAddress;
export const GACHA_COMPONENT_ADDRESS = RADIX_CONFIG.gachaComponentAddress;

// ----------------------------------------------------------------------------
// XRD precision helpers
// ----------------------------------------------------------------------------

export const parseXrdAmount = (amountStr: string): number => {
  if (!amountStr) return 0;
  const n = Number(amountStr);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
};

export const shortenTxHash = (hash: string): string => {
  if (!hash || hash.length < 10) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
};

// Radix block explorer URLs for transaction lookup.
export const getTxExplorerUrl = (txHash: string): string => {
  const base = NETWORK === 'mainnet'
    ? 'https://dashboard.radixdlt.com'
    : 'https://stokenet-dashboard.radixdlt.com';
  return `${base}/transaction/${txHash}`;
};
