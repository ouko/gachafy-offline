const { LTSRadixEngineToolkit } = require('@radixdlt/radix-engine-toolkit');

async function main() {
  const addresses = await LTSRadixEngineToolkit.Derive.knownAddresses(2);
  console.log(JSON.stringify(addresses, null, 2));
}

main().catch(console.error);
