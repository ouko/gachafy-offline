const { SimpleTransactionBuilder } = require('@radixdlt/radix-engine-toolkit');

function toHexString(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function main() {
  const networkId = 2;
  const validFromEpoch = 207598;
  const toAccount = 'account_tdx_2_16y4mg0t9huh2un0tzyakgvr0nzpz2su8vzkl6xhp4re204r545fj3y';

  console.log('Funding account:', toAccount);

  const compiledTx = await SimpleTransactionBuilder.freeXrdFromFaucet({
    networkId,
    validFromEpoch,
    toAccount,
  });

  const hex = toHexString(compiledTx.compiled);
  console.log('Transaction hex length:', hex.length);

  const response = await fetch('https://babylon-stokenet-gateway.radixdlt.com/transaction/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      network: 'stokenet',
      notarized_transaction_hex: hex,
    }),
  });

  const data = await response.json();
  console.log('Gateway response:', JSON.stringify(data, null, 2));
}

main().catch(console.error);
