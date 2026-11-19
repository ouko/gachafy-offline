# Getting Started

## What this repository contains

GachaFi is a client-only Radix dApp. The Scrypto contract holds paid XRD and mints badge NFTs. The React app submits wallet transactions and reads balances, transaction status, NFT metadata, account inventory, and total mint count from a Radix Gateway.

There is no backend, creator-earnings system, governance, leaderboard, or mock mint mode. Daily streaks and consent choices are local UX state. The optional offline queue contains mint intents, not signed transactions, and is disabled by default.

## Prerequisites

- Node.js 20.19+ or 22+ and npm.
- A Radix wallet on Stokenet for end-to-end testing.
- Rust with the `wasm32-unknown-unknown` target for contract development.

## Install and run

```bash
git clone https://github.com/ouko/gachafy-offline.git
cd gachafy-offline
npm ci
cp .env.example .env
npm run dev
```

The development server listens on `http://localhost:8080`.

Set these public values in `.env` before wallet/mint testing:

| Variable | Purpose |
|---|---|
| `VITE_RADIX_NETWORK` | `stokenet` or `mainnet`; defaults to Stokenet |
| `VITE_RADIX_DAPP_DEFINITION` | dApp definition account for the selected network |
| `VITE_GACHA_PACKAGE_ADDRESS` | Deployed Scrypto package |
| `VITE_GACHA_COMPONENT_ADDRESS` | Instantiated `GachaMinter` component |
| `VITE_GACHA_BADGE_RESOURCE` | Badge resource created by that component |

Minting is disabled unless all three GachaFi addresses are present. Optional Gateway/XRD overrides, Sentry, and OneSignal settings are documented in `.env.example`. Every `VITE_` value is public in the built JavaScript; never add secrets.

## Project map

```text
src/
  components/          Reusable UI, badge images/cards, consent banner
  contexts/            Wallet, local game state, optional offline queue
  hooks/               Context adapters and browser hooks
  lib/
    radix.ts           RDT initialization and transaction submission
    radix-config.ts    Public network/address configuration
    gateway.ts         Validated Gateway reads and NFT parsers
    privacy.ts         Consent and local data export/deletion
    oneSignal.ts       Consent-gated push SDK loading
    logger.ts          Consent-gated Sentry and scrubbed logging
  pages/               Open, Reveal, Inventory, Privacy, landing, 404
  utils/               PWA and IndexedDB helpers
public/                Static assets and service workers
scrypto/gacha/         Scrypto 1.3.1 blueprint and integration tests
scripts/               Development and bundle-check scripts
```

## Contract development

```bash
rustup target add wasm32-unknown-unknown
cargo test --manifest-path scrypto/gacha/Cargo.toml
cargo build --manifest-path scrypto/gacha/Cargo.toml --target wasm32-unknown-unknown --release
```

On macOS, if native C++ compilation cannot find `<algorithm>`, use the installed SDK explicitly:

```bash
SDK="$(xcrun --show-sdk-path)"
CC_wasm32_unknown_unknown=/usr/local/opt/llvm/bin/clang \
CXXFLAGS="-isysroot $SDK -I$SDK/usr/include/c++/v1" \
  cargo test --manifest-path scrypto/gacha/Cargo.toml
```

See [SCRYPTO_GUIDE.md](SCRYPTO_GUIDE.md) for deployment and admin operations. The current NFT schema requires a new deployment; old components cannot be upgraded.

## Daily quality checks

```bash
npm run check
npm run lint
npm test -- --run
npm run build
npm run check:bundle
npm audit --audit-level=high
```

Use `npm run preview` to inspect the production build on port 8080. Do not test only the development server: CSP, service workers, routing, and build-time addresses differ in production.

## End-to-end developer flow

1. Configure a current Stokenet contract and dApp definition.
2. Connect a wallet and select common (8 XRD), rare (15 XRD), or epic (25 XRD).
3. Review and sign once in the wallet.
4. Wait for `CommittedSuccess`; Reveal resolves the emitted badge ID and reads its NFT data.
5. Open Collection and verify account NFTs, actual SP total, and global mint count.
6. Test delayed indexing and Gateway failure. Retry reads without resubmitting the transaction.
7. Open Privacy to test optional consent, local export, and deletion.

## Troubleshooting

| Symptom | Check |
|---|---|
| Wallet cannot initialize | dApp definition, network, wallet installation, browser CSP |
| Mint is disabled | All three GachaFi addresses; rebuild after changes |
| Reveal keeps waiting | Transaction committed but event/NFT not indexed; retry or open Collection |
| Collection shows an error | Gateway availability and badge resource configuration; assets are not lost |
| Push is absent | OneSignal configuration and explicit notification consent |
| Sentry is absent | DSN configuration and explicit error-reporting consent |

Read [ARCHITECTURE.md](ARCHITECTURE.md), [DEPLOYMENT.md](../DEPLOYMENT.md), and [README.production.md](../README.production.md) before release work.
