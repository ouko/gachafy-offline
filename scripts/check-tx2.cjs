async function main() {
  const notarizedTxId = 'notarizedtransaction_tdx_2_1e9vfj67z9567h05xwcwjszh0nnxquj675dpuc43uxvgwv9d0zscss7kgqw';
  
  const response = await fetch('https://babylon-stokenet-gateway.radixdlt.com/transaction/committed-details', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      network: 'stokenet',
      intent_hash: notarizedTxId,
    }),
  });
  
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}

main().catch(console.error);
