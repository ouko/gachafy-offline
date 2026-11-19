# GachaFi Production Guide

This guide separates repository verification from operator-controlled launch requirements.

## Release model

GachaFi is a static React dApp. The only economic authority is the deployed Scrypto contract. The frontend reads public Radix Gateway data and stores limited preferences locally. There is no GachaFi API server or database.

The current contract adds `image_url` and `description` to `BadgeData`, exact-payment enforcement, and new read methods. Deploy a new package and component; do not point the frontend at an older deployment and expect the new schema or reads to exist.

## Required build configuration

| Variable | Purpose |
|---|---|
| `VITE_RADIX_NETWORK` | `stokenet` or `mainnet` |
| `VITE_RADIX_DAPP_DEFINITION` | dApp definition account for the selected network |
| `VITE_GACHA_PACKAGE_ADDRESS` | Newly deployed package |
| `VITE_GACHA_COMPONENT_ADDRESS` | Newly instantiated component |
| `VITE_GACHA_BADGE_RESOURCE` | Badge resource returned/read from that component |

Optional: `VITE_RADIX_GATEWAY_URL`, `VITE_XRD_RESOURCE_ADDRESS`, `VITE_ONESIGNAL_APP_ID`, `VITE_ONESIGNAL_SAFARI_WEB_ID`, and `VITE_SENTRY_DSN`. The offline unsigned-request queue is disabled by default. The former simulated bridge has been removed.

All Vite variables are public. Do not place admin keys, private keys, or API secrets in them.

## Verified build process

Use Node.js 20.19+ or 22+ and npm:

```bash
npm ci
npm run check
npm run lint
npm test -- --run
npm run build
npm run check:bundle
npm audit --audit-level=high
```

Contract gates:

```bash
cargo test --manifest-path scrypto/gacha/Cargo.toml
cargo build --manifest-path scrypto/gacha/Cargo.toml --target wasm32-unknown-unknown --release
```

CI provides equivalent frontend and contract jobs. Do not treat an old `dist/` directory as a release artifact; rebuild after every configuration or source change.

## Docker/nginx

```bash
docker compose up --build -d
curl --fail http://localhost:3000/health
```

The container serves on unprivileged port 8080 and Compose maps host port 3000. nginx runs as a non-root user. Terminate TLS at a trusted proxy or platform. The nginx configuration includes security headers on static assets, SPA routes, service workers, manifest, and health responses.

If `VITE_RADIX_GATEWAY_URL` uses a custom origin, add it to `connect-src` in both `security-headers.conf` and `netlify.toml`. Test wallet connection after any CSP change. COOP/COEP are intentionally not enabled because they can interfere with wallet and cross-origin NFT flows.

## Netlify and static hosts

Netlify uses `netlify.toml`: Node 22, `npm ci`, typecheck, tests, production build, SPA rewrites, and security headers. Configure public addresses in Netlify before deployment.

For another static host:

1. Build with `npm ci && npm run build`.
2. Publish `dist/`.
3. Rewrite unknown application routes to `/index.html` without rewriting real assets.
4. Apply the headers in `netlify.toml` or `security-headers.conf`.
5. Serve HTTPS and keep `/sw.js` and `/OneSignalSDKWorker.js` uncached.

Vercel and other platforms are supported only after supplying equivalent SPA rewrites and headers; no platform-specific deployment is performed by this repository.

## Launch checklist

### Contract and wallet

- [ ] Current Scrypto tests and release build pass.
- [ ] Current package/component deployed to Stokenet and exact common/rare/epic payments verified.
- [ ] Badge resource address verified from component state/read method.
- [ ] Pause, supply cap, withdrawal limit, and admin proof behavior tested with the operator wallet.
- [ ] Admin badge secured with an appropriate backup/signing process.
- [ ] dApp definition metadata and verified origin tested on the actual domain.
- [ ] Mainnet configuration reviewed independently before enabling real-value mints.

### Frontend

- [ ] Wallet connect, account change, disconnect, and insufficient balance tested.
- [ ] Successful mint resolves the actual NFT on Reveal and appears in Collection after refresh.
- [ ] Delayed indexing, Gateway outage, rejected signature, and committed failure tested.
- [ ] No duplicate transaction occurs during retries or repeated clicks.
- [ ] Pagination tested with an account holding more than one page of badges.
- [ ] Mobile Safari and Chrome tested on physical devices.
- [ ] Keyboard navigation, image fallback, and reduced motion checked.

### Privacy and operations

- [ ] Privacy notice reviewed for the actual operator and jurisdiction.
- [ ] Sentry/OneSignal processor agreements, retention, and transfer settings reviewed if enabled.
- [ ] Consent, withdrawal, local export, and local deletion tested.
- [ ] HTTPS, headers, service-worker update, and deep links verified on the production origin.
- [ ] Gateway availability/rate limits monitored; use a production Gateway provider or self-host if needed.
- [ ] Independent smart-contract security review completed before Mainnet value is accepted.

## Monitoring and recovery

Sentry is optional and consent-gated. Public Gateway errors remain visible in the UI and browser logs. A submitted transaction is never automatically re-signed. Recover using its intent hash in the Radix explorer, then retry Reveal or refresh Collection.

The contract is immutable. A code or schema fix requires deploying a new package/component and rebuilding the frontend with new addresses. Pause the old component where appropriate and communicate migration to users.

## Troubleshooting

- **Mint button disabled:** confirm all three GachaFi addresses and the dApp definition are set, then rebuild.
- **Balance unavailable during an outage:** the UI preserves the read error and retries; it does not convert the failure into a zero balance.
- **Reveal waits:** the transaction may be committed but not indexed. Keep the hash, retry, or open Collection.
- **Collection error:** this is a read failure, not asset loss. Retry and inspect the Gateway response.
- **Push prompt does not appear:** notifications require both configuration and explicit opt-in on `/privacy`.
- **Old service worker:** close old tabs and reload; service-worker cache version upgrades remove old GachaFi shell caches.
