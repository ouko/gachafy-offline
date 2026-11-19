# GachaFi

A client-only gacha dApp on Radix. Users connect a Radix wallet, pay a fixed XRD tier price, and receive a transferable badge NFT with on-chain name, rarity, SP, nonce, epoch, image URL, and description.

The repository contains the React/TypeScript frontend, PWA shell, Scrypto contract, tests, and deployment configuration. It does not contain a backend, mock mint mode, governance, player leaderboard, creator earnings, or an NFT marketplace.

## Current status

The codebase includes the complete intended mint/read flow and production build configuration. A public launch still requires an operator to deploy the current contract, configure real addresses, verify a Stokenet mint end to end, complete legal/processor review, and test target mobile devices. No Mainnet deployment is claimed by this repository.

## Quick start

Prerequisites: Node.js 20.19+ or 22+, npm, and a Radix wallet. Rust/Scrypto 1.3.1 is needed only for contract work.

```bash
git clone https://github.com/ouko/gachafy-offline.git
cd gachafy-offline
npm ci
cp .env.example .env
# Set the Radix addresses in .env; never put secrets in VITE_ variables.
npm run dev
```

Open `http://localhost:8080`. Minting remains disabled until all package, component, and badge resource addresses are configured.

## Radix configuration

```bash
VITE_RADIX_NETWORK=stokenet
VITE_RADIX_DAPP_DEFINITION=
VITE_GACHA_PACKAGE_ADDRESS=
VITE_GACHA_COMPONENT_ADDRESS=
VITE_GACHA_BADGE_RESOURCE=
```

`VITE_RADIX_GATEWAY_URL` and `VITE_XRD_RESOURCE_ADDRESS` have network defaults. `VITE_ONESIGNAL_APP_ID` and `VITE_SENTRY_DSN` are optional and used only after the corresponding user consent. All `VITE_` values are embedded in public browser assets.

See [docs/SCRYPTO_GUIDE.md](docs/SCRYPTO_GUIDE.md) for building and deploying the contract. The current NFT schema requires a new package/component deployment; an older component cannot be upgraded in place.

## Application routes

| Route | Purpose |
|---|---|
| `/` | Landing and install prompt; redirects to Open |
| `/open` | Wallet, tier selection, transaction submission and status recovery |
| `/reveal` | Resolves the actual `BadgeMinted` event and NFT data |
| `/inventory` | Paginated account NFTs, actual account SP, and global mint count |
| `/privacy` | Consent, privacy notice, local export, and local deletion |
| `/creator` | Legacy redirect to `/inventory` |

## Architecture

- **Frontend:** React 18, TypeScript, Vite 7, Tailwind, React Router 7.
- **Wallet:** lazily loaded Radix DApp Toolkit 2.3.
- **Chain reads:** validated Radix Gateway REST requests with timeouts, bounded retries, and pagination.
- **Contract:** Scrypto 1.3.1 `GachaMinter`, exact XRD payment, admin proofs, pause, supply and withdrawal limits.
- **Local state:** React Context; streaks and consent in localStorage; optional mint intents in IndexedDB.
- **Offline:** service-worker shell. Wallet signatures and chain reads require connectivity. The offline mint queue is disabled by default.
- **Hosting:** static hosts, Netlify, or non-root nginx on port 8080 via Docker.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for data flow and trust boundaries.

## Quality gates

```bash
npm run check
npm run lint
npm test -- --run
npm run build
npm run check:bundle
npm audit --audit-level=high

cd scrypto/gacha
cargo test
cargo build --target wasm32-unknown-unknown --release
```

CI runs the frontend gates, dependency audit, secret scan, Scrypto tests, and release Wasm build. GitHub Actions are pinned to commit SHAs.

## Production deployment

For Docker:

```bash
docker compose up --build -d
curl http://localhost:3000/health
```

For Netlify, the included `netlify.toml` installs, tests, builds, applies security headers, and supports SPA routes. Other static hosts must provide equivalent deep-link rewrites and security headers.

Build-time addresses must be supplied in the hosting environment; changing them requires a rebuild. See [DEPLOYMENT.md](DEPLOYMENT.md), [README.production.md](README.production.md), and [SELF_HOSTING.md](SELF_HOSTING.md).

## Privacy and security

The smart contract is the economic security boundary. Browser validation and rate limiting are UX controls, not abuse prevention. Production source maps are disabled, dependencies are audited, logs are scrubbed, and nginx/Netlify apply CSP and related headers.

Sentry and OneSignal are off without configuration and consent. `/privacy` provides local data export/deletion. Blockchain data is public and cannot be erased. Operators remain responsible for legal review, processor agreements, vendor retention settings, and incident response.

## Documentation

- [Getting started](docs/GETTING_STARTED.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Scrypto guide](docs/SCRYPTO_GUIDE.md)
- [Deployment](DEPLOYMENT.md)
- [Production checklist](README.production.md)
- [Self-hosting](SELF_HOSTING.md)
- [Current security/privacy status](docs/COMPREHENSIVE_SECURITY_PRIVACY_AUDIT.md)
- [Production readiness design](docs/superpowers/specs/2026-11-20-production-readiness-design.md)
- [Implementation plan](docs/superpowers/plans/2026-11-20-production-readiness.md)

Historical audits describe their review dates; their current-status addenda identify later fixes.

## License and support

No open-source license file is currently provided. Use the GitHub issue tracker for support and privacy requests; never post private keys or sensitive personal information.
