# dApp Validation Setup

## Development workaround

Radix Wallet developer mode can bypass dApp validation for local testing. It is not a production solution and does not replace metadata configuration.

## Production validation

1. Create/select a dApp definition account on the same network as the contract.
2. Set `account_type`, name, description, first-party icon URL, exact `claimed_websites` origin, and current `claimed_entities` in the Radix developer console.
3. Set `VITE_RADIX_DAPP_DEFINITION` in the build environment.
4. Build and deploy. Vite writes the same address to `dist/.well-known/radix.json`.
5. Verify `https://your-origin/.well-known/radix.json` publicly returns that address.
6. Connect with a fresh Radix Wallet session and inspect the displayed dApp and origin.

Origins must match exactly, including scheme and host, with no trailing slash. Use first-party assets rather than historical preview domains.

## Troubleshooting

- **Cannot validate dApp:** confirm metadata committed, developer mode is not being relied on, and the wallet is on the correct network.
- **Invalid origin:** compare the browser origin and `claimed_websites` exactly.
- **Manifest missing:** check SPA rewrites do not intercept `/.well-known/radix.json`, and inspect the deployed file rather than only the source file.
- **Wrong dApp/address:** rebuild with the correct environment and clear old wallet sessions/service-worker tabs.
- **Contract not linked:** update `claimed_entities` after every contract redeployment.

See `DAPP_METADATA_CONFIGURATION.md` for field details.
