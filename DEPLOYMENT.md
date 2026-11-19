# Deployment

## 1. Prepare the current contract

The NFT schema and payment checks changed in this release. Build, test, and deploy a new Scrypto package/component using [docs/SCRYPTO_GUIDE.md](docs/SCRYPTO_GUIDE.md). Existing components are immutable and cannot be upgraded in place.

Record the package, component, and badge resource addresses. Configure the dApp definition for the same network and production origin.

## 2. Configure the build

Use Node.js 20.19+ or 22+ and npm. Set:

```bash
VITE_RADIX_NETWORK=stokenet
VITE_RADIX_DAPP_DEFINITION=account_...
VITE_GACHA_PACKAGE_ADDRESS=package_...
VITE_GACHA_COMPONENT_ADDRESS=component_...
VITE_GACHA_BADGE_RESOURCE=resource_...
```

Optional Sentry and OneSignal values enable integrations only after user consent. All `VITE_` variables are public. Local `.env` files are intentionally ignored.

Verify before deployment:

```bash
npm ci
npm run check
npm test -- --run
npm run build
npm run check:bundle
npm audit --audit-level=high
```

## 3. Choose a host

### Docker

```bash
docker compose up --build -d
curl --fail http://localhost:3000/health
```

The container listens on 8080; Compose maps it to 3000. Add HTTPS through a reverse proxy. If using a custom Gateway origin, add it to the CSP in `security-headers.conf` before building.

### Netlify

Import the repository and set the environment variables before deploying. `netlify.toml` uses Node 22, runs typecheck/tests/build, publishes `dist`, applies security headers, and handles SPA deep links.

### Other static hosts

Build with `npm run build` and publish `dist`. Configure unknown route rewrites to `/index.html`, HTTPS, and security headers equivalent to `netlify.toml`. Keep service-worker files uncached. Platform support is configuration-based; this repository does not deploy to Vercel, Cloudflare, AWS, or another provider automatically.

## 4. Verify the release

- Open `/open`, `/inventory`, `/privacy`, and a direct deep link.
- Connect and disconnect a Stokenet wallet; change accounts and verify Collection refreshes.
- Submit a test mint once and confirm the exact NFT on Reveal and in Collection.
- Test wallet rejection, committed failure, delayed indexing, and Gateway retry without duplicate signing.
- Confirm global mint count and account SP match chain data.
- Test consent, push opt-in/out, local export, and deletion.
- Test mobile Safari/Chrome and PWA upgrade behavior.
- Check production headers and ensure no source maps or secrets are published.

See [README.production.md](README.production.md) for the full Mainnet launch checklist. A successful build alone is not proof of a deployed or audited production system.
