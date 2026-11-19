import { describe, expect, it } from 'vitest';
import { DataRequestBuilder, RadixDappToolkit } from '@radixdlt/radix-dapp-toolkit';

describe('Radix DApp Toolkit patched dependency compatibility', () => {
  it('initializes and builds an account request with patched Valibot and UUID', async () => {
    const toolkit = RadixDappToolkit({
      dAppDefinitionAddress: 'account_tdx_2_129vr3rwyz7gnwf35kkuxvx0fs4hkz0n5hem9utaejqra3sxf0m5wej',
      networkId: 2,
      applicationName: 'GachaFi Test',
      applicationVersion: '1.0.0',
    });

    expect(
      toolkit.walletApi.setRequestData(DataRequestBuilder.accounts().atLeast(1)),
    ).toBeDefined();
    expect(toolkit.walletApi.getWalletData()).toBeUndefined();
    toolkit.destroy();
  });
});
