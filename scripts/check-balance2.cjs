async function main() {
  const account = 'account_tdx_2_16y4mg0t9huh2un0tzyakgvr0nzpz2su8vzkl6xhp4re204r545fj3y';
  
  const response = await fetch('https://babylon-stokenet-gateway.radixdlt.com/state/entity/details', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      network: 'stokenet',
      addresses: [account],
      aggregation_level: 'Vault',
      opt_ins: { fungible_resource_balances: true },
    }),
  });
  
  const data = await response.json();
  console.log('Raw response keys:', Object.keys(data));
  console.log('First item keys:', Object.keys(data.items?.[0] ?? {}));
  console.log('Fungible resources:', JSON.stringify(data.items?.[0]?.fungible_resources, null, 2));
}

main().catch(console.error);
