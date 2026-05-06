const { RadixEngineToolkit } = require('@radixdlt/radix-engine-toolkit');

async function main() {
  const ret = new RadixEngineToolkit();
  await ret.initialize();
  
  const publicKeyHex = '028a106622eb0808b37e9eef0aeb088a1309bacafea457efbf940cfa271fbe316f';
  const publicKey = new Uint8Array(Buffer.from(publicKeyHex, 'hex'));
  
  // Derive virtual account address for Stokenet (network id 2)
  const address = await ret.deriveVirtualAccountAddress(
    { value: publicKey, curve: 'secp256k1' },
    2
  );
  
  console.log('Account address:', address);
}

main().catch(console.error);
