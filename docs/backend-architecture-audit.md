# GachaFi Backend Architecture Audit

> **Historical review.** There is still no backend. The placeholder Creator dashboard has been removed; current Collection/Reveal views use paginated Gateway NFT data and component supply, while streaks remain local and non-economic. Exact payment and transferable (not soulbound) badges are documented in `ARCHITECTURE.md`.

**Date:** 2026-05-06  
**Auditor:** Backend Architect (kimi-agent)  
**Scope:** Smart contracts, service architecture, data persistence, external integrations, CI/CD, deployment security, and backend operational posture.  
**Status:** Complete — all backend surfaces reviewed.

---

## Executive Summary

GachaFi is a **100% client-side static SPA** with no traditional backend server. All "backend" functionality is delegated to:

1. **Radix DLT blockchain** — Scrypto smart contract handles payments, NFT minting, and access control.
2. **Third-party SaaS APIs** — OneSignal (push), Sentry (observability), Radix Gateway (blockchain RPC).
3. **Browser APIs** — IndexedDB (offline queue), Service Worker (PWA shell caching).

**Critical Finding:** The project documents Supabase as its backend, yet there is **zero Supabase integration** in the application code — no client library, no database schema, no Edge Functions, no RLS policies, and no migrations. This creates a false sense of backend infrastructure.

**Second Critical Finding:** Because there is no server-side layer, **all rate limiting, validation, and abuse prevention are client-side only** and trivially bypassable. The Scrypto smart contract is the sole security boundary.

**Verdict:** The backend architecture is minimal by design (a blockchain-native DApp), but the gap between documented infrastructure (Supabase) and actual infrastructure is a project risk. The smart contract is well-structured, and the deployment pipeline is sound.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT BROWSER                           │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │  React SPA  │  │  Service Worker│  │  IndexedDB          │ │
│  │  (Vite)     │  │  (sw.js)       │  │  (offlineQueue)     │ │
│  └──────┬──────┘  └──────────────┘  └─────────────────────┘ │
│         │                                                    │
│  ┌──────┴────────────────────────────────────────────────┐  │
│  │  Client-Side "Backend" Services                        │  │
│  │  • RadixService        — wallet, balance, transactions │  │
│  │  • OneSignalService    — push notification client      │  │
│  │  • Logger + Sentry     — error tracking                │  │
│  │  • RateLimiter         — UX debouncing (not security)  │  │
│  │  • OfflineQueueDB      — IndexedDB queue persistence   │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────┬───────────────────────────────────────────────────┘
           │  HTTPS
           ▼
┌─────────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES (Third-Party)                 │
│  • Radix Gateway API  — babylon-stokenet-gateway.radixdlt.com│
│  • OneSignal CDN      — cdn.onesignal.com                    │
│  • Sentry             — error tracking DSN                   │
│  • Google Fonts       — fonts.googleapis.com                 │
└─────────────────────────────────────────────────────────────┘
           ▼
┌─────────────────────────────────────────────────────────────┐
│              RADIX DLT BLOCKCHAIN (On-Chain)                 │
│  • Scrypto Contract: GachaMinter                             │
│  • XRD Token Vault                                           │
│  • NFT Badge Resource (soulbound)                            │
│  • BadgeMinted Events                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              SUPABASE (Documented but UNUSED)                │
│  • Project ID in config.toml                                 │
│  • NO client code, NO migrations, NO Edge Functions          │
│  • NO database tables, NO RLS policies                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Scrypto Smart Contract Analysis

**File:** `scrypto/gacha/src/lib.rs` (321 lines)  
**Framework:** Scrypto v1.3.1  
**Blueprint:** `GachaMinter`

### 2.1 Contract Capabilities

| Function | Access | Description |
|----------|--------|-------------|
| `instantiate_gacha_minter` | Public (constructor) | Creates component, mints 2 admin badges (1 for component auth, 1 for deployer) |
| `mint_gacha_badge` | Public | Accepts XRD payment ≥ tier price, mints soulbound NFT badge, emits `BadgeMinted` event |
| `withdraw_xrd` | Admin only | Withdraws collected XRD from vault |
| `update_tier` | Admin only | Modifies existing tier price/SP/rarity |
| `add_tier` | Admin only | Adds new tier configuration |
| `get_tier_price` | Read-only | Returns price for a tier |
| `get_tier_config` | Read-only | Returns full config for a tier |
| `get_collected_xrd` | Read-only | Returns total XRD in vault |
| `get_mint_counter` | Read-only | Returns next badge ID |

### 2.2 Security Assessment

| Control | Implementation | Rating |
|---------|---------------|--------|
| **Access Control** | Admin badge (`require(admin_badge_address)`) for privileged ops | ✅ Good |
| **Payment Validation** | `assert!(payment.amount() >= config.price)` — allows overpayment | ✅ Acceptable (tips) |
| **NFT Burnability** | `burn_roles` set to `deny_all` — badges are soulbound | ✅ Good |
| **Mint Authorization** | Only component can mint (via `admin_badge_vault.authorize_with_amount`) | ✅ Good |
| **Event Emission** | `BadgeMinted` emitted on every mint for off-chain indexing | ✅ Good |
| **Tier Validation** | `.expect("Invalid tier...")` — panics on unknown tier | ⚠️ Okay (tx fails loudly) |
| **Overflow Protection** | Uses Scrypto `Decimal` and `u64` — radix-native safe arithmetic | ✅ Good |
| **Re-entrancy** | No external calls during mint; XRD vault `put` is atomic | ✅ Safe |

### 2.3 Contract Risks

1. **No on-chain randomness for tier rolling.** The contract does NOT determine rarity randomly — it only mints the tier the user paid for. The `nonce` is client-generated and stored as metadata. If future versions intend to roll rarity on-chain, a VDF or oracle is required.
2. **Fixed admin badge supply (2).** If the deployer loses their admin badge, there is no recovery mechanism. Consider a multi-sig or threshold scheme for production.
3. **No pause/freeze mechanism.** There is no way to halt minting in case of an emergency or discovered vulnerability.
4. **No upgrade path.** The blueprint is not designed for proxy upgrades. Future changes require redeployment and user migration.

---

## 3. Service Architecture (Client-Side Backend Logic)

### 3.1 RadixService (`src/lib/radix.ts`)

| Aspect | Detail |
|--------|--------|
| **Initialization** | Lazy-loads `@radixdlt/radix-dapp-toolkit` on first use |
| **Wallet Connection** | Rate-limited (3/min), uses `DataRequestBuilder.accounts().atLeast(1)` |
| **Balance Fetching** | `POST /state/entity/details`, retry ×3, 10s timeout, validates with Zod |
| **Transaction Submit** | Constructs Scrypto manifest client-side, submits via wallet API |
| **Status Polling** | `POST /transaction/status`, retry ×2, 500ms delay |
| **Nonce Generation** | `crypto.getRandomValues` → 53-bit safe integer; falls back to `Math.random` with warning |

**Observations:**
- Transaction manifests are built as raw strings with template literals. This is idiomatic for Radix DApps but requires careful sanitization. The `tier` parameter is validated against a whitelist (`['common', 'rare', 'epic']`), which prevents manifest injection.
- The `amount` parameter is interpolated directly into the manifest as a decimal string. It is validated by `balanceSchema`, but there is no explicit check that it matches a known tier price. The smart contract enforces the minimum, so overpayment is accepted as a "tip."

### 3.2 Rate Limiter (`src/lib/rateLimiter.ts`)

**Critical:** This is a **client-side UX convenience**, not a security control. It uses `localStorage` for state tracking and can be bypassed by:
- Clearing localStorage
- Opening an incognito window
- Modifying the JavaScript bundle
- Calling the Radix gateway directly

**Recommendation:** Do not rely on client-side rate limiting for economic abuse prevention. The smart contract's payment requirement is the real defense.

### 3.3 Offline Queue (`src/utils/offlineQueue.ts`, `src/contexts/OfflineContext.tsx`)

| Aspect | Detail |
|--------|--------|
| **Storage** | IndexedDB (`GachaFiOfflineQueue` DB, `mintRequests` store) |
| **Schema** | `{ id, tier, timestamp, nonce, userId? }` |
| **Replay** | On `online` event or `PROCESS_QUEUE` message, SW broadcasts to clients; main thread replays via `radixService.mintGachaBadge` |
| **Feature Flag** | `VITE_FEATURE_OFFLINE_QUEUE` (default `false`) |

**Risk:** The `userId` field is optional and is **not always passed** from `Open.tsx`. The replay loop skips requests without `userId`, silently orphaning them. This is documented in `docs/ux-audit.md` (Finding #1).

**Architectural Note:** True offline minting is impossible — wallet signing requires the user's private key, which is only accessible online via the Radix wallet. The offline queue is a "queue and retry" pattern, not a genuine offline capability.

---

## 4. Data Persistence & Storage

### 4.1 Supabase Integration — GHOST BACKEND

**Files:**
- `supabase/config.toml` — contains only `project_id = "ibicvmavajmuoygedeyw"`
- `src/integrations/supabase/` — **empty directory** (0 files)

**Evidence of non-use:**
- No `@supabase/supabase-js` in `package.json`
- No Supabase client initialization anywhere in `src/`
- No database migrations, no Edge Functions, no RLS policies
- `CODE_REVIEW.md` explicitly states: *"The client is initialised and persists sessions to localStorage, but no code actually reads/writes Supabase data"*
- `.env.example` does NOT contain `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, or `VITE_SUPABASE_PROJECT_ID`

**Impact:**
- No server-side persistence for user profiles, leaderboards, game state, or analytics
- No server-side authentication or session management
- No Row-Level Security
- No serverless functions for scheduled tasks (e.g., push notification cron)

**Recommendation:** Either:
1. **Remove Supabase references** from documentation and config if not needed, OR
2. **Actually implement Supabase** with proper schema, RLS, and Edge Functions for backend operations.

### 4.2 Local Storage Usage

| Data | Location | Risk |
|------|----------|------|
| Offline mint queue | IndexedDB | Low — local only, replayed then cleared |
| Streak completion dates | `localStorage` (`gachafi.completedDates.v2`) | Medium — user can modify; no server validation |
| Wallet connection state | `localStorage` (Radix DApp Toolkit) | Low — standard practice |
| OneSignal player ID | `localStorage` / OneSignal SDK | Low — standard practice |
| Rate limiter state | `localStorage` | Low — cosmetic only |

---

## 5. External Service Integrations

### 5.1 Radix DLT Gateway

**Endpoints Used:**
- `POST /state/entity/details` — balance + NFT holdings
- `POST /transaction/status` — transaction status polling

**Security:**
- Gateway URLs are configurable via env (`VITE_RADIX_GATEWAY_URL`)
- Defaults are official Radix endpoints (Stokenet/Mainnet)
- No API key required for gateway reads
- Writes are signed by the user's wallet — the app never handles private keys

**Resilience:**
- `withRetry` wrapper (3 attempts, 1s delay) on balance fetches
- `withTimeout` (10s) on all gateway calls
- Fallback to `0` balance on persistent failure

### 5.2 OneSignal (Push Notifications)

**File:** `src/lib/oneSignal.ts`  
**SDK:** `react-onesignal` v3.3.0

| Aspect | Detail |
|--------|--------|
| **App ID** | `VITE_ONESIGNAL_APP_ID` (env-driven, no-op if blank) |
| **Safari ID** | `VITE_ONESIGNAL_SAFARI_WEB_ID` (optional) |
| **Worker** | `public/OneSignalSDKWorker.js` imports from CDN |
| **Scheduled Push** | **Not implemented** — code comment explicitly states this requires a backend cron |

**Risk:** OneSignal App ID is bundled into client JS. This is expected — OneSignal IDs are public identifiers. The risk is low.

**Missing:** No server-side cron for scheduled streak reminders. The previous fake `setTimeout` "daily reminders" scheduler was removed in the hardening pass.

### 5.3 Sentry (Error Tracking)

**File:** `src/lib/logger.ts`  
**SDK:** `@sentry/react` v8.0.0

| Aspect | Detail |
|--------|--------|
| **DSN** | `VITE_SENTRY_DSN` (env-driven, disabled if blank) |
| **Filtering** | Drops `info`/`debug` levels; denies browser extension URLs |
| **Sample Rate** | 10% in production, 100% in development |
| **Release Tag** | `VITE_APP_VERSION` |

**Risk:** Sentry DSN is bundled into client JS. DSNs are designed to be public; the worst-case risk is a malicious actor flooding your Sentry project with fake events.

### 5.4 Google Fonts

**File:** `index.html`
- `https://fonts.googleapis.com` (CSS)
- `https://fonts.gstatic.com` (font files)

**Note:** External CSS injection is a minor privacy concern (Google sees visitor IPs). Self-hosting fonts would eliminate this.

---

## 6. CI/CD & Deployment Security

### 6.1 GitHub Actions (`/.github/workflows/ci.yml`)

| Job | Steps | Notes |
|-----|-------|-------|
| `build` | Checkout → Node 20 → `npm ci` → type check → lint → test → build → bundle size check → artifact upload | Solid pipeline |
| `audit` | `npm audit --audit-level=high` | Good practice |

**Build Environment:**
- Secrets: `VITE_ONESIGNAL_APP_ID`, `VITE_ONESIGNAL_SAFARI_WEB_ID`, `VITE_RADIX_DAPP_DEFINITION`, `VITE_SENTRY_DSN`
- Variables: `VITE_RADIX_NETWORK`, `VITE_RADIX_GATEWAY_URL`, `VITE_GACHA_*_ADDRESS`, `VITE_FEATURE_*`

**Security Notes:**
- `permissions: contents: read` — minimal permissions ✅
- `concurrency` group with `cancel-in-progress: true` — saves CI minutes ✅
- Actions pinned to `@v4` — good hygiene ✅
- No deployment steps in CI (intentionally removed) — deployment is manual, which is safer for a web3 app ✅

### 6.2 Docker (`Dockerfile`, `docker-compose.yml`)

| Aspect | Detail |
|--------|--------|
| **Build Stage** | `node:20-alpine` — runs `npm ci`, type check, lint, build |
| **Runtime Stage** | `nginx:alpine` — serves static files on port 80 |
| **Privileges** | Drops to non-root `app:app` user ✅ |
| **Health Check** | `wget` ping to `/health` every 30s ✅ |

**Observations:**
- Multi-stage build keeps dev dependencies out of the runtime image ✅
- `.dockerignore` exists and excludes `node_modules`, `.git`, etc. ✅
- `docker-compose.yml` removed obsolete `version:` key and added build args ✅

### 6.3 Netlify (`netlify.toml`)

- Build command mirrors Docker: `npm ci && npm run check && npm run build`
- CSP header in `netlify.toml` is in sync with `nginx.conf` ✅
- SPA rewrite: `/*` → `/index.html` ✅
- No-cache headers for service workers ✅

### 6.4 Vercel (`vercel.json`)

- Standard SPA routing and security headers
- Note: `X-XSS-Protection: 1; mode=block` is deprecated; `nginx.conf` correctly sets it to `0`. `vercel.json` should be updated to match.

---

## 7. Security Audit Findings

### 🔴 Critical

#### C1. No Server-Side Security Boundary
**Finding:** The application has no backend server. All validation, rate limiting, and abuse prevention are client-side.
**Impact:** A malicious actor can bypass all client-side restrictions by directly interacting with the Radix gateway or smart contract.
**Mitigation:** The smart contract enforces payment and access control, which is the correct security boundary for a DApp. However, features like leaderboards, streaks, and analytics have no server-side validation and are trivially gameable.
**Recommendation:** If competitive features (leaderboards, streak rewards) are added, they MUST be validated server-side or on-chain.

#### C2. Supabase Documented but Unused — False Infrastructure
**Finding:** Multiple documentation files described Supabase as the backend, yet zero code used it.
**Impact:** New developers or auditors may assume RLS, auth, and database persistence exist.
**Status:** RESOLVED — All Supabase references removed from README.md, README.production.md, DEPLOYMENT.md, INDEPENDENCE.md, LOVABLE_INDEPENDENCE_CHECKLIST.md, SELF_HOSTING.md, CODE_REVIEW.md, and DATABASE_ALTERNATIVES.md. The `supabase/` directory has been deleted.

### 🟡 High

#### H1. Client-Side Secret Exposure (By Design, but Noted)
**Finding:** All environment variables are `VITE_*` prefixed and bundled into the client JS bundle.
**Impact:** OneSignal App ID, Sentry DSN, all Radix addresses, and feature flags are public.
**Mitigation:** This is expected for a static SPA. The OneSignal ID and Sentry DSN are designed to be public. Radix addresses are on-chain public data. No actual secrets (private keys, API tokens) are exposed.
**Recommendation:** Ensure no one accidentally adds a server secret with `VITE_` prefix. Document this risk in `CONTRIBUTING.md`.

#### H2. No Transaction Validation Server-Side
**Finding:** Transaction manifests are constructed client-side and submitted directly to the user's wallet.
**Impact:** A compromised or malicious client build could construct manifests that drain user funds or interact with wrong components.
**Mitigation:** The wallet (Radix Wallet mobile app / browser extension) shows the user the full transaction manifest before signing. The user is the final authority.
**Recommendation:** For additional safety, consider publishing a canonical manifest hash or template that the app validates against before submission.

#### H3. No Smart Contract Pause / Emergency Stop
**Finding:** The Scrypto contract had no `pause` or `freeze` function.
**Impact:** If a bug was discovered, there would be no way to halt minting.
**Status:** RESOLVED — Added `enabled: bool` state to `GachaMinter`, `set_enabled` admin method, and `is_enabled` read-only method. Minting now asserts `self.enabled` and panics with "Minting is currently paused" when disabled.

### 🟢 Medium

#### M1. Service Worker Offline Fallback Is Plain Text
**Finding:** If cache miss occurs during offline navigation, the SW returns `new Response('Offline', { status: 503 })`.
**Impact:** User sees an unstyled "Offline" text instead of the app shell.
**Recommendation:** Return a minimal branded HTML fallback page. Documented in `docs/ux-audit.md` (Finding #8).

#### M2. No Smart Contract Upgrade Path
**Finding:** The contract is not designed for upgrades (no proxy pattern).
**Impact:** Future changes require full redeployment, new component addresses, and user migration.
**Recommendation:** For a production gacha game with evolving mechanics, consider a component factory or proxy pattern. This is a medium-term architectural decision, not an immediate fix.

#### M3. Vercel Security Headers Diverge from Nginx
**Finding:** `vercel.json` set `X-XSS-Protection: 1; mode=block` while `nginx.conf` correctly set it to `0`.
**Impact:** Inconsistent security posture across deploy targets.
**Status:** RESOLVED — `vercel.json` updated: `X-XSS-Protection` changed to `0`, added `Permissions-Policy` and `Strict-Transport-Security` to match `nginx.conf` and `netlify.toml`.

---

## 8. Operational Readiness

### 8.1 Monitoring & Observability

| System | Status | Gaps |
|--------|--------|------|
| Sentry | ✅ Configured | No performance monitoring (only error tracking) |
| Structured Logging | ✅ `logger.ts` with context/tags | No log aggregation backend; logs are client-side only |
| Health Check | ✅ `/health` in nginx | No application-level health metrics |
| Uptime Monitoring | ❌ Not configured | Recommend Pingdom / UptimeRobot for gateway monitoring |

### 8.2 Backup & Disaster Recovery

| Asset | Backup Strategy | Risk |
|-------|----------------|------|
| Source Code | GitHub | Low |
| Smart Contract | On-chain (immutable) | Medium — admin badge loss = no recovery |
| User Data (queue, streaks) | LocalStorage/IndexedDB only | **High** — device loss = data loss |

**Critical Gap:** Because there is no server-side database, all user progression data (streaks, offline queue) lives on the user's device. There is no cloud backup or sync. A user who clears their browser data or switches devices loses their streak history.

### 8.3 Scaling Considerations

| Bottleneck | Current State | Future Risk |
|------------|--------------|-------------|
| Radix Gateway | Free public endpoint | High traffic may hit rate limits; consider self-hosted gateway |
| Static Assets | Nginx/Netlify CDN | Low risk — standard static hosting |
| Smart Contract | On-chain throughput | Radix network handles this; no app-level scaling needed |

---

## 9. Recommendations (Prioritized)

### Immediate (Do Before Mainnet)

1. **Add a contract pause mechanism.** An `enabled` boolean + admin-gated `set_enabled` method. This is standard for any production contract handling user funds.
2. **Resolve the Supabase ambiguity.** Either:
   - Delete `supabase/` directory and all Supabase references from docs, OR
   - Implement a real Supabase backend with schema, RLS, and Edge Functions.
3. **Fix the orphaned offline queue.** Pass `address` to `queueMintRequest` so `userId` is always present. Already documented in UX audit.
4. **Align Vercel headers** with nginx/Netlify, or delete `vercel.json` if unused.

### Short-Term (Post-Launch)

5. **Implement server-side streak validation.** If streaks ever confer rewards (price discounts, bonus SP), the streak logic must be verifiable. Options:
   - On-chain: store last-mint epoch in contract, calculate streak there
   - Off-chain: Supabase Edge Function validates streak against `BadgeMinted` events
6. **Add a backend for scheduled push notifications.** OneSignal REST API calls from a server cron (Vercel Cron, Supabase Edge Scheduler, or GitHub Actions cron) to send streak reminders.
7. **Add application metrics.** Beyond Sentry errors, track: daily active users, mint volume, tier distribution, conversion rates. This requires a backend analytics pipeline or on-chain indexer.

### Long-Term (Architecture Evolution)

8. **Consider a contract factory / proxy pattern** if you anticipate frequent tier additions, price changes, or game mechanic updates.
9. **Self-host a Radix Gateway** or use a gateway provider with SLAs if traffic grows. The public gateway is best-effort.
10. **Implement a real backend** (Supabase/PostgreSQL + Edge Functions) for:
    - Cross-device user sync
    - Global leaderboards
    - Server-side analytics
    - Rate limiting and abuse detection
    - Push notification scheduling

---

## 10. Action Items Checklist

- [x] **C1:** Add `enabled` flag + `set_enabled` admin method to Scrypto contract
- [x] **C2:** Remove all Supabase references and ghost integration
- [x] **H3:** Document `VITE_*` exposure risk in `.env.example`
- [x] **M3:** Update `vercel.json` security headers
- [ ] **Ops:** Set up uptime monitoring for the chosen gateway URL (external — pick Pingdom/UptimeRobot)
- [ ] **Ops:** Evaluate on-chain vs off-chain streak validation before any streak rewards launch (product decision)
- [ ] **Ops:** Design push notification backend cron (OneSignal REST API) — requires server infra
- [ ] **Ops:** Add application metrics / analytics pipeline — requires backend or on-chain indexer

---

## Files Referenced in This Audit

```
scrypto/gacha/src/lib.rs              Scrypto smart contract
scrypto/gacha/Cargo.toml              Rust dependencies
.env.example                          Environment variables
public/sw.js                          Service worker
src/lib/radix.ts                      Radix blockchain service
src/lib/radix-config.ts               Network configuration
src/lib/radix-lazy.ts                 Lazy loader for Radix toolkit
src/lib/oneSignal.ts                  Push notification service
src/lib/logger.ts                     Logging + Sentry integration
src/lib/rateLimiter.ts                Client-side rate limiting
src/lib/validation.ts                 Zod schemas
src/lib/errorHandling.ts              Error classes and retry logic
src/utils/offlineQueue.ts             IndexedDB offline queue
src/contexts/OfflineContext.tsx       Offline queue replay logic
src/contexts/WalletContext.tsx        Wallet state + balance polling
.github/workflows/ci.yml              CI pipeline
Dockerfile                            Container build
docker-compose.yml                    Local orchestration
nginx.conf                            Production server config
netlify.toml                          Netlify deploy config
vercel.json                           Vercel deploy config
vercel.json                           DELETED — deploy target consolidated to Docker + Netlify
```

---

*This audit was conducted via static code review. Smart contract vulnerabilities should be validated with formal auditing tools (e.g., Scrypto static analysis, Radix testnet fuzzing) before mainnet deployment. The operational recommendations assume the project will grow beyond a pure client-side DApp.*
