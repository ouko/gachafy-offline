# Real Wallet Mode

GachaFi has no mock or demo mint path. It uses Radix DApp Toolkit for real wallet requests and transaction submission. The default network is Stokenet; Mainnet requires separate deployed addresses.

## Configuration

```bash
VITE_RADIX_NETWORK=stokenet
VITE_RADIX_DAPP_DEFINITION=account_tdx_2_...
VITE_GACHA_PACKAGE_ADDRESS=package_tdx_2_...
VITE_GACHA_COMPONENT_ADDRESS=component_tdx_2_...
VITE_GACHA_BADGE_RESOURCE=resource_tdx_2_...
```

All values are public build configuration. Minting is disabled when any GachaFi contract address is missing. No source edit is needed to switch networks; rebuild after changing environment values.

## Expected behavior

- Wallet connection shares the selected public account and starts balance polling.
- Opening a box submits one exact-price transaction after explicit wallet approval.
- Transaction status reads never submit another transaction.
- Reveal resolves the actual `BadgeMinted` event and NFT metadata.
- Collection loads the account's current badge resource holdings with pagination.
- Wallet connection does not request push permission. OneSignal and Sentry require separate consent on `/privacy`.

## Test checklist

1. Connect a Stokenet account with enough test XRD for tier price plus network fees.
2. Reject a signature and verify no pending hash is created.
3. Submit a Common mint and verify the exact NFT on Reveal and in Collection.
4. Change accounts and verify the inventory changes.
5. Simulate Gateway failure and verify errors/retry without another wallet signature.
6. Confirm committed failures do not produce a badge or local daily streak.

See `RADIX_SETUP.md` for wallet setup and `README.production.md` before Mainnet use.
