# Radix Wallet Setup

GachaFi defaults to Stokenet. Test XRD has no monetary value. Never share a seed phrase or private key with the app or support.

## Install and configure

1. Install the official Radix Wallet browser extension or mobile app from [wallet.radixdlt.com](https://wallet.radixdlt.com/).
2. Create/import an account and back up the wallet securely.
3. Select Stokenet (network ID 2).
4. Obtain test XRD through the wallet's faucet or the official Stokenet faucet if available.
5. Open GachaFi and select Connect Wallet.
6. Review the dApp definition, origin, requested accounts, and network before approving.

The app uses `https://babylon-stokenet-gateway.radixdlt.com` for Stokenet reads and `https://mainnet.radixdlt.com` for Mainnet reads. A custom Gateway can be configured at build time and must also be allowed by the deployment CSP.

## Open a box

1. Select Common (8 XRD), Rare (15 XRD), or Epic (25 XRD).
2. Select Open and review the wallet transaction. The tier payment is exact; network fees are additional and determined by Radix.
3. Sign once. Rejecting or closing the wallet does not submit a transaction.
4. After `CommittedSuccess`, Reveal loads the actual NFT. If indexing is delayed, keep the transaction hash, retry, or open Collection.
5. Collection shows badges held by the connected account, their actual SP, and the component's global mint count.

## Troubleshooting

- **No wallet prompt:** install/update Radix Wallet, verify the selected network, and disable conflicting extensions. Desktop installed PWAs cannot use a browser extension; open the app in the browser. Mobile PWAs may use the wallet app.
- **Validation warning:** configure the dApp definition metadata, claimed website, and `/.well-known/radix.json` as described in `DAPP_VALIDATION_SETUP.md`.
- **Insufficient funds:** account for both the exact tier price and network fee.
- **Pending status:** use the provided explorer link. A status-read outage is not a failed transaction and never causes automatic re-signing.
- **Committed failure:** inspect the explorer error; no badge was minted and failed transactions do not deposit the tier payment into the contract.
- **Wrong account assets:** disconnect/change accounts in the wallet; Collection reloads for the new address.

## Mainnet

Mainnet uses real XRD. Set `VITE_RADIX_NETWORK=mainnet` and supply Mainnet dApp/package/component/badge-resource addresses through the build environment. Do not edit source constants to switch networks. Deploy and audit the current contract, test Stokenet first, and complete the production checklist before accepting real value.
