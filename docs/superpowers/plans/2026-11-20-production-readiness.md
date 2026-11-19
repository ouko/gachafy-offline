# GachaFi Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a production-buildable Radix dApp with chain-backed mint reveal, inventory and supply statistics, a hardened Scrypto contract, consent-based third-party integrations, current documentation, and verified quality gates.

**Architecture:** Keep the existing React Context + lazy Radix DApp Toolkit client and immutable Scrypto blueprint. Add a dependency-light Gateway module for typed reads, React routes for collection/privacy, and build-time public configuration for the badge resource. Never retry wallet signing automatically.

**Tech Stack:** React 18, TypeScript, Vite, Vitest/Testing Library, Zod, Radix Gateway REST API, Scrypto 1.3.1, nginx/Docker, GitHub Actions.

## Global Constraints

- Preserve the existing common/rare/epic economy; do not add the brief's prize-pool/random-loot economy.
- No backend, mock minting, fabricated leaderboard, governance, creator earnings, or USD estimates.
- Retry Gateway reads only. A wallet signing attempt is terminal until its transaction hash is recovered.
- `VITE_` values are public; never commit credentials or local `.env` files.
- Existing uncommitted work is reviewed and preserved, not reset.
- Code readiness does not imply deployed Mainnet infrastructure, external audit, device testing, or legal sign-off.

---

### Task 1: Reproducible dependencies and public configuration

**Files:**
- Modify: `package.json`, `package-lock.json`, `vite.config.ts`
- Modify: `.env.example`, `src/vite-env.d.ts`, `src/lib/radix-config.ts`, `src/lib/featureFlags.ts`
- Modify: `src/lib/radix.test.ts`
- Remove if unused after import inspection: `@radixdlt/radix-engine-toolkit`, `lovable-tagger`, `bun.lockb`

**Interfaces:**
- Produces: `RADIX_CONFIG.gachaBadgeResourceAddress: string`.
- Produces: `GACHA_DEPLOYED` is true only when package, component, and badge resource addresses are configured.

- [ ] **Step 1: Add failing configuration tests**

Extend `src/lib/radix.test.ts` with assertions that the badge resource is exposed and deployment requires the complete contract configuration:

```ts
expect(RADIX_CONFIG).toHaveProperty('gachaBadgeResourceAddress');
expect(RADIX_CONFIG.gachaBadgeResourceAddress).toMatch(/^$|^resource_/);
```

- [ ] **Step 2: Run the focused test and observe the missing property**

Run: `npm test -- --run src/lib/radix.test.ts`
Expected: FAIL on `gachaBadgeResourceAddress` before implementation.

- [ ] **Step 3: Add configuration and environment contract**

Add to `radix-config.ts`:

```ts
gachaBadgeResourceAddress: import.meta.env.VITE_GACHA_BADGE_RESOURCE || '',
```

Add to `featureFlags.ts`:

```ts
export const GACHA_DEPLOYED = Boolean(
  import.meta.env.VITE_GACHA_PACKAGE_ADDRESS &&
  import.meta.env.VITE_GACHA_COMPONENT_ADDRESS &&
  import.meta.env.VITE_GACHA_BADGE_RESOURCE
);
```

Document `VITE_GACHA_BADGE_RESOURCE=` in `.env.example` and `ImportMetaEnv`. Remove the unused engine toolkit and Lovable plugin/imports after `Grep` confirms no runtime imports. Use npm as the only JS package manager.

- [ ] **Step 4: Remediate dependencies without downgrading Radix**

Run `npm audit fix`, then inspect `npm audit --audit-level=high`. Upgrade direct dependencies with compatible releases. Use targeted `overrides` only for patched transitive versions compatible with the parent API; do not use `npm audit fix --force` to downgrade RDT. Update Zod call sites from `error.errors` to `error.issues` if Zod 4 is selected.

- [ ] **Step 5: Verify and commit**

Run: `npm ci && npm run check && npm test -- --run && npm run build`
Expected: all frontend gates pass. Run `npm audit --audit-level=high` and record any remaining upstream advisories exactly.

```bash
git add package.json package-lock.json vite.config.ts .env.example src/vite-env.d.ts src/lib/radix-config.ts src/lib/featureFlags.ts src/lib/radix.test.ts
git commit -m "build: harden dependencies and Radix configuration"
```

### Task 2: Harden and test the Scrypto contract

**Files:**
- Modify: `scrypto/gacha/src/lib.rs`
- Modify: `scrypto/gacha/tests/lib.rs`
- Modify: `scrypto/gacha/README.md`
- Add: `public/badges/common.png`, `public/badges/rare.png`, `public/badges/epic.png`

**Interfaces:**
- Produces immutable NFT fields `image_url: String` and `description: String`.
- Produces `get_badge_resource_address() -> ResourceAddress` and `get_total_minted() -> u64`.
- Privileged methods consume a valid non-empty proof of `admin_badge_address`.
- Mint requires `payment.amount() == config.price`.

- [ ] **Step 1: Write failing contract tests**

Add tests that instantiate through `PackageFactory::compile_and_publish` and assert:

```rust
let total: u64 = env.call_method_typed(component, "get_total_minted", &()).unwrap();
assert_eq!(total, 0);
let resource: ResourceAddress = env
    .call_method_typed(component, "get_badge_resource_address", &())
    .unwrap();
assert_eq!(resource, badge_resource_address);
```

Add separate tests proving overpayment fails, paused minting fails, a zero-supply cap blocks minting, an invalid admin proof is rejected, a negative withdrawal limit is rejected, and minted data contains the expected image URL and description.

- [ ] **Step 2: Run contract tests and confirm missing methods**

Run:

```bash
PATH="$HOME/.cargo/bin:$PATH" CXXFLAGS="-isysroot $(xcrun --show-sdk-path)" cargo test
```

Expected: FAIL to compile because the new read methods do not exist. If the SDK flag is unnecessary on the repaired host, rerun without it and use the successful form in documentation.

- [ ] **Step 3: Implement minimal contract changes**

Add the NFT fields and populate them from fixed first-party HTTPS URLs. Change payment validation to exact equality. Add:

```rust
fn assert_admin(&self, proof: Proof) {
    proof.check(self.admin_badge_address);
}

pub fn get_badge_resource_address(&self) -> ResourceAddress {
    self.badge_resource_manager.address()
}

pub fn get_total_minted(&self) -> u64 {
    self.mint_counter - 1
}
```

Use `assert_admin` in every admin method. Assert non-empty labels and `limit > Decimal::ZERO` when a withdrawal limit is `Some`. Keep resource ownership and component upgrade policy unchanged.

- [ ] **Step 4: Verify contract and assets**

Copy the existing badge artwork into the three first-party asset paths if tier-specific artwork is unavailable; the UI must not pretend these are distinct random loot templates. Run `cargo fmt --check`, `cargo test`, and `cargo build --target wasm32-unknown-unknown --release` with the local Rust path. Expected: tests and release build pass.

- [ ] **Step 5: Commit**

```bash
git add scrypto/gacha/src/lib.rs scrypto/gacha/tests/lib.rs scrypto/gacha/README.md public/badges
git commit -m "feat: harden badge minting and metadata"
```

### Task 3: Typed Radix Gateway reads

**Files:**
- Create: `src/lib/gateway.ts`, `src/lib/gateway.test.ts`
- Modify: `src/lib/validation.ts`, `src/lib/radix.ts`
- Test against request/response shapes from `radixdlt/babylon-gateway` generated `StateApi` models.

**Interfaces:**
- Produces:

```ts
export interface GachaBadge {
  id: string;
  resourceAddress: string;
  name: string;
  tier: 'common' | 'rare' | 'epic';
  rarity: 'common' | 'rare' | 'epic';
  sp: number;
  nonce: number;
  mintedAtEpoch: number;
  imageUrl: string;
  description: string;
}

export function getBadgeByTransaction(txHash: string): Promise<GachaBadge | null>;
export function getBadgeInventory(accountAddress: string): Promise<GachaBadge[]>;
export function getTotalMinted(): Promise<number>;
```

- [ ] **Step 1: Write failing parser and API tests**

Mock `fetch` and cover committed transaction event extraction, non-fungible field extraction, paginated inventory, malformed responses, non-2xx responses, and total supply. A representative test:

```ts
expect(await getBadgeByTransaction('txid_test_123')).toMatchObject({
  id: '#42#', name: 'RARE Badge #42', sp: 350, rarity: 'rare'
});
expect(fetch).toHaveBeenCalledWith(
  expect.stringContaining('/transaction/committed-details'),
  expect.objectContaining({ method: 'POST' })
);
```

Use a transaction hash fixture accepted by validation; do not use real wallet data.

- [ ] **Step 2: Run tests before implementation**

Run: `npm test -- --run src/lib/gateway.test.ts`
Expected: FAIL because `gateway.ts` does not exist.

- [ ] **Step 3: Implement bounded Gateway calls**

Create one `gatewayRequest<T>(path, body, schema)` helper using `withTimeout`, `withRetry`, JSON parsing, and Zod response schemas. Use `/transaction/committed-details` for the `BadgeMinted` event, `/state/non-fungible/data` for NFT fields, `/state/entity/page/non-fungibles` with `aggregation_level: 'Vault'` and `non_fungible_include_nfids: true` for inventory, and `/state/entity/details` for `mint_counter`. Follow `next_cursor` until exhausted with a 100-page safety bound. Filter inventory to `RADIX_CONFIG.gachaBadgeResourceAddress`; deduplicate IDs and sort newest first.

Parse Scrypto programmatic JSON by `field_name`/`type_name` and value, including enum variants. Return `null` only when the transaction is valid but its badge is not indexed yet. Throw `NetworkError` for transport/schema failures so the UI can distinguish failure from an empty collection.

- [ ] **Step 4: Make nonce generation fail securely**

Replace the `Math.random` fallback in `radix.ts` with:

```ts
if (!globalThis.crypto?.getRandomValues) {
  throw new TransactionError('Secure random number generation is unavailable');
}
```

Validate the transaction hash before Gateway calls. Do not catch inventory/status errors and return plausible empty/zero data.

- [ ] **Step 5: Verify and commit**

Run: `npm run check && npm test -- --run src/lib/gateway.test.ts src/lib/radix.test.ts`
Expected: all Gateway and Radix tests pass.

```bash
git add src/lib/gateway.ts src/lib/gateway.test.ts src/lib/validation.ts src/lib/radix.ts src/lib/radix.test.ts
git commit -m "feat: read badges and supply from Radix Gateway"
```

### Task 4: Real reveal, inventory, and statistics

**Files:**
- Create: `src/pages/Inventory.tsx`, `src/pages/Inventory.test.tsx`, `src/components/BadgeCard.tsx`
- Modify: `src/pages/Reveal.tsx`, `src/pages/Open.tsx`, `src/App.tsx`, `src/components/BottomNav.tsx`
- Remove after route migration: `src/pages/Creator.tsx`
- Modify: `src/components/GameInfo.tsx`

**Interfaces:**
- Consumes Task 3's `GachaBadge`, `getBadgeByTransaction`, `getBadgeInventory`, and `getTotalMinted`.
- Reveal route state remains `{ tier: Tier; txHash: string }` for compatibility, but displayed values come only from `GachaBadge`.

- [ ] **Step 1: Write failing inventory and reveal tests**

Test loading, disconnected, empty, error/retry, and populated states. Verify two NFTs with SP 100 and 350 render total SP 450 and their images. Verify reveal fetches by transaction hash and does not use the tier's local SP constant. Verify account change triggers a fresh request and stale responses cannot overwrite the new account.

- [ ] **Step 2: Run component tests before implementation**

Run: `npm test -- --run src/pages/Inventory.test.tsx src/pages/Reveal.test.tsx`
Expected: FAIL because the real views are absent.

- [ ] **Step 3: Implement chain-backed views**

`Inventory.tsx` loads inventory and total supply when the account changes, exposes Refresh, and derives `totalSp` with:

```tsx
const totalSp = badges.reduce((sum, badge) => sum + badge.sp, 0);
```

`BadgeCard.tsx` renders an accessible `<img src={badge.imageUrl} alt={badge.name} loading="lazy">` and a static first-party fallback on error. `Reveal.tsx` polls `getBadgeByTransaction(txHash)` for up to 60 seconds, then shows a retryable indexing message with the explorer link and Collection button. Disable animations under `prefers-reduced-motion` and clean up timers/animation frames.

- [ ] **Step 4: Correct mint recovery and navigation**

Keep one `mintGachaBadge` call per click. On `CommittedSuccess`, navigate to reveal with the hash. On `CommittedFailure`, show failure and clear pending state. On Gateway errors, retain the hash and offer status retry/dismiss. Remove automatic push-permission requests from wallet connection. Replace `/creator` with `<Navigate to="/inventory" replace />` and label the nav item Collection. Change GameInfo copy so streaks/boosters are not advertised as paid rewards or improved odds unless the contract implements them.

- [ ] **Step 5: Verify and commit**

Run: `npm run check && npm test -- --run src/pages src/lib && npm run build`
Expected: all tests and build pass; no Creator earnings placeholders or local-constant reveal remain.

```bash
git add src/pages src/components src/App.tsx src/contexts/WalletContext.tsx
git commit -m "feat: add chain-backed reveal and collection"
```

### Task 5: Consent, privacy notice, and local data rights

**Files:**
- Create: `src/lib/privacy.ts`, `src/lib/privacy.test.ts`, `src/pages/Privacy.tsx`, `src/pages/Privacy.test.tsx`, `src/components/ConsentBanner.tsx`
- Modify: `src/main.tsx`, `src/lib/logger.ts`, `src/lib/oneSignal.ts`, `src/App.tsx`, `src/components/BottomNav.tsx`, `index.html`
- Modify: `src/contexts/OfflineContext.tsx`, `src/utils/offlineQueue.ts`

**Interfaces:**
- Produces:

```ts
export type ConsentCategory = 'errorReporting' | 'notifications';
export function getConsent(category: ConsentCategory): boolean;
export function setConsent(category: ConsentCategory, value: boolean): void;
export function exportLocalData(): Promise<string>;
export function clearLocalData(): Promise<void>;
```

- [ ] **Step 1: Write failing consent and data tests**

Cover absent consent returning false, independent category persistence, malformed storage, JSON export of GachaFi keys and queued requests, deletion of the offline database, and no OneSignal/Sentry initialization before consent. Verify wallet connection never calls `Notification.requestPermission`.

- [ ] **Step 2: Run privacy tests before implementation**

Run: `npm test -- --run src/lib/privacy.test.ts src/pages/Privacy.test.tsx`
Expected: FAIL because the privacy module/view do not exist.

- [ ] **Step 3: Implement consent gating and local controls**

Store only `gachafi.consent.v1` with category booleans and an ISO timestamp. `main.tsx` calls `initSentry()` only when `getConsent('errorReporting')` is true. Remove the static OneSignal script from `index.html`; dynamically add the self-hosted loader only when notification consent is granted. Remove OneSignal initialization/permission from `WalletContext`.

Add a dismissible banner when optional integrations are configured and no choice exists. Add `/privacy` with independent toggles, Export My Data, Delete My Data, and a notice covering wallet/Gateway data, local streak/queue data, Sentry, OneSignal, immutable blockchain records, provider retention, and the repository issue contact. Refresh after consent changes that require SDK initialization/teardown. OneSignal withdrawal opts out of push and clears local consent; it does not claim to delete provider-side records.

- [ ] **Step 4: Verify and commit**

Run: `npm run check && npm test -- --run src/lib/privacy.test.ts src/pages/Privacy.test.tsx src/pages/Open.test.tsx && npm run build`
Expected: all pass and the production HTML contains no unconditional OneSignal script.

```bash
git add src/lib/privacy.ts src/lib/privacy.test.ts src/pages/Privacy.tsx src/pages/Privacy.test.tsx src/components/ConsentBanner.tsx src/main.tsx src/lib/logger.ts src/lib/oneSignal.ts src/App.tsx src/components/BottomNav.tsx src/contexts/OfflineContext.tsx src/utils/offlineQueue.ts index.html
git commit -m "feat: add consent and local privacy controls"
```

### Task 6: Deployment gates and truthful documentation

**Files:**
- Modify: `.github/workflows/ci.yml`, `Dockerfile`, `docker-compose.yml`, `nginx.conf`, `netlify.toml`, `public/sw.js`
- Modify: `README.md`, `README.production.md`, `DEPLOYMENT.md`, `SELF_HOSTING.md`, `RADIX_SETUP.md`, `REAL_WALLET_MODE.md`, `DAPP_METADATA_CONFIGURATION.md`, `DAPP_VALIDATION_SETUP.md`
- Modify: `docs/GETTING_STARTED.md`, `docs/ARCHITECTURE.md`, `docs/SCRYPTO_GUIDE.md`, `docs/COMPREHENSIVE_SECURITY_PRIVACY_AUDIT.md`, and historical audit addenda where needed
- Modify: `.gitignore`
- Remove generated deployment scratch artifacts from version control candidates: `scrypto/gacha/instantiate*.html`, QR images, and debug manifests unless specifically referenced as canonical examples

**Interfaces:**
- CI build receives `VITE_GACHA_BADGE_RESOURCE` from repository variables.
- Documentation names `/open`, `/reveal`, `/inventory`, and `/privacy` and the exact-payment contract behavior.

- [ ] **Step 1: Add contract and security CI gates**

Pin every action to an immutable commit SHA. Add a Rust job with a pinned toolchain action, `cargo test --manifest-path scrypto/gacha/Cargo.toml`, and release Wasm build. Keep npm audit as a real gate only after Task 1 makes it pass; document upstream exceptions rather than adding a blanket `continue-on-error`.

- [ ] **Step 2: Verify deployment configuration**

Remove COEP `require-corp` unless a browser test proves wallet and NFT assets work with it. Keep non-root nginx on 8080, source maps off, security headers, SPA fallback, and health check. Increment the service-worker cache version and avoid caching Gateway responses. Add generated deployment scratch files and `graphify-out/` to `.gitignore` without deleting user-owned canonical manifests.

- [ ] **Step 3: Rewrite operational documentation to current reality**

Document Node 20.19+ or 22+, npm, Scrypto 1.3.1, required addresses, exact payment, NFT schema redeployment, collection/reveal reads, consent behavior, local-data limitations, and external launch requirements. Remove unsupported Lighthouse scores, fake production readiness guarantees, stale recipient event fields, `>=` payment statements, and claims that a Mainnet/Stokenet deployment was tested when it was not.

- [ ] **Step 4: Run the complete verification suite**

```bash
npm ci
npm run check
npm run lint
npm test -- --run
npm run build
npm run check:bundle
npm audit --audit-level=high
PATH="$HOME/.cargo/bin:$PATH" CXXFLAGS="-isysroot $(xcrun --show-sdk-path)" cargo test --manifest-path scrypto/gacha/Cargo.toml
PATH="$HOME/.cargo/bin:$PATH" cargo build --manifest-path scrypto/gacha/Cargo.toml --target wasm32-unknown-unknown --release
git diff --check
```

Expected: every command exits 0. Build the Docker image and probe `/health` if Docker is running. Start `npm run preview`, request `/`, `/inventory`, `/privacy`, and a deep-link, and verify the built HTML/headers. Real wallet minting is verified only if configured Stokenet contract addresses and a test wallet are available.

- [ ] **Step 5: Review, commit, and push**

Run `git status --short`, inspect the complete diff, scan staged files for secrets, and ensure generated build output is not staged. Commit the remaining reviewed changes with `git commit -m "chore: prepare GachaFi for production deployment"`. Push `main` to `https://github.com/ouko/gachafy-offline`, then confirm the remote HEAD and report the commit SHA plus any unverified external launch gates.
