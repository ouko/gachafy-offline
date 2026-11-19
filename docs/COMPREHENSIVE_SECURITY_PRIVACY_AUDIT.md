# GachaFi Security and Privacy Status

**Review date:** 2026-11-20  
**Scope:** Current React/PWA frontend, Scrypto contract, Gateway reads, CI/CD, Docker/nginx/Netlify, and local/third-party data flows.  
**Method:** Source review and local automated checks. This is not an independent security audit or legal opinion.

## Current summary

The earlier findings of free minting through non-positive prices, spoofable recipient events, accidental overpayment retention, inconsistent admin proof checks, fake creator earnings, local-constant reveals, unconditional OneSignal loading, and missing local privacy controls have been addressed in source.

The dependency lockfile was remediated and `npm audit --audit-level=high` reported **0 vulnerabilities** after the update. This is a point-in-time result, not a continuing guarantee; CI reruns the audit.

No Critical or High code finding is currently asserted by this review. Mainnet launch still requires independent contract review, a real Stokenet end-to-end test, production infrastructure verification, physical mobile testing, and operator legal/processor review.

## Contract controls

- Exact configured XRD payment; both underpayment and overpayment abort.
- Positive tier price/SP and non-empty labels.
- Shared non-empty admin-proof validation for every privileged method.
- Pause, maximum supply, and optional positive per-epoch withdrawal limit.
- Immutable component; resource owner remains admin-updatable as a documented recovery tradeoff.
- Non-burnable but transferable badges; no false soulbound claim.
- Immutable event transaction hash and badge ID support real chain resolution.
- NFT data includes first-party image URL and description.

Residual risk: the admin badge is operationally sensitive, resource ownership is intentionally recoverable/updatable, IDs use transaction hash/counter derivation, and no independent audit or Mainnet deployment is claimed. Contract test/release results are recorded by the actual verification run and CI, not assumed from source.

## Frontend and chain reads

- Strict wallet/tier/amount/hash/nonce validation before manifest construction.
- Cryptographic nonce generation fails closed if browser secure randomness is unavailable.
- One signing attempt per user action; retries apply to reads only.
- Reveal uses `BadgeMinted` plus current non-fungible data rather than local reward constants.
- Inventory follows resource and vault-ID pagination, batches at most 100 IDs, and validates Gateway responses.
- Read failures remain errors; they do not become fake empty inventory, zero supply, or failed transactions.
- Account changes cancel stale inventory updates.
- Static asset image fallback, keyboard controls, reduced motion, and explicit loading/error/empty states.

Residual risk: public Gateway availability and response integrity remain external dependencies. Browser validation/rate limiting are bypassable UX controls; only the contract protects economic operations.

## Privacy

- Sentry initializes only when configured and error-reporting consent is true.
- OneSignal loads only when configured and notification consent is true.
- Wallet connection never requests push permission.
- `/privacy` provides independent consent, withdrawal, local JSON export, and selective local deletion.
- Local export includes GachaFi storage and offline mint intents; deletion preserves unrelated origin storage.
- The notice explains public immutable wallet/transaction data, local retention, optional providers, and provider-side limitations.

Operator obligations remain: review the notice for the actual legal entity/jurisdiction, sign required processor agreements, configure retention/international transfers, and handle third-party or on-chain rights requests appropriately. Local deletion cannot erase blockchain data and does not claim provider-side deletion.

## Infrastructure and supply chain

- Production source maps disabled.
- OneSignal page/worker loaders are same-origin; consent prevents unconditional loading.
- Non-root nginx listens on 8080; health check uses the same port.
- Security headers are included on every nginx location, including responses with cache overrides.
- COOP/COEP are intentionally absent to avoid breaking wallet and NFT flows.
- SPA deep links, service-worker no-cache, and content-hashed asset caching configured.
- GitHub Actions pinned to immutable SHAs; CI covers frontend, contract, dependency audit, and secret scan.
- Local environment files and deployment scratch artifacts are ignored.

Custom Gateway origins must be added to CSP. TLS, proxy configuration, real response headers, container health, and hosting availability require deployment-time verification.

## Current verification commands

```bash
npm ci
npm run check
npm run lint
npm test -- --run
npm run build
npm run check:bundle
npm audit --audit-level=high
cargo test --manifest-path scrypto/gacha/Cargo.toml
cargo build --manifest-path scrypto/gacha/Cargo.toml --target wasm32-unknown-unknown --release
```

## Evidence from this review

- 75 frontend tests passed, including real RDT initialization with the patched transitive dependencies.
- Eight Scrypto tests passed after correcting the native/Wasm test harness calls.
- `scrypto build` produced `gacha.wasm` and `gacha.rpd`.
- Production preview returned 200 with expected content types for `/`, `/open`, `/inventory`, `/privacy`, `/.well-known/radix.json`, and `/sw.js`.
- No production source maps or unconditional OneSignal script were found in the built HTML.
- `npm audit --audit-level=high` reported zero vulnerabilities.
- Internal links in 26 Markdown files validated successfully.
- The pinned Docker image built successfully; its container passed health, SPA-route, security-header, missing-asset 404, and non-root `uid=100(app)` checks.

See `README.production.md` for external launch gates. Historical audit documents retain their original findings and have addenda; their old severity counts are not the current status.
