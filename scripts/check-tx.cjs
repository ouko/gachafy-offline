async function main() {
  const txId = 'txid_tdx_2_13yr6gadxq42xledjjr8px8vmxncr7h2du4fqv6smhc4fnpyyagtsk6urgd';
  
  const response = await fetch('https://babylon-stokenet-gateway.radixdlt.com/transaction/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      network: 'stokenet',
      intent_hash: txId,
    }),
  });
  
  const data = await response.json();
  console.log('Status:', JSON.stringify(data, null, 2));
}

main().catch(console.error);
