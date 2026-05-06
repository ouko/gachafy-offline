const { LTSRadixEngineToolkit, PublicKey } = require('@radixdlt/radix-engine-toolkit');

async function main() {
  const publicKeyBytes = new Uint8Array(Buffer.from('028a106622eb0808b37e9eef0aeb088a1309bacafea457efbf940cfa271fbe316f', 'hex'));
  const publicKey = new PublicKey.Secp256k1(publicKeyBytes);
  
  const address = await LTSRadixEngineToolkit.Derive.virtualAccountAddress(publicKey, 2);
  console.log('Stokenet account:', address);
}

main().catch(console.error);
