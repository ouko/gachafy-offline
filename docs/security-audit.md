# GachaFi Security Audit

> **Historical review.** The May 2026 code snippets and resolutions below are not current source. Recipient events were subsequently removed in favor of transaction hashes, exact payment replaced `>=`, badges are transferable rather than soulbound, and current controls are summarized in `COMPREHENSIVE_SECURITY_PRIVACY_AUDIT.md`.

**Date:** 2026-05-06  
**Auditors:** Security Engineer + Blockchain Security Auditor (agent personas)  
**Scope:** Smart contracts, React frontend, PWA shell, service worker, CI/CD, deployment infrastructure, supply chain  
**Method:** Manual line-by-line code review, threat modeling (STRIDE), OWASP Top 10 mapping, dependency vulnerability scanning  

---

## Executive Summary

| Category | Findings | Status |
|----------|----------|--------|
| Smart Contract | 1 Low, 2 Informational | No critical vulnerabilities |
| Frontend | 1 Medium, 3 Low, 2 Informational | Actionable fixes identified |
| Infrastructure | 1 Low, 2 Informational | Solid baseline, gaps in CI |
| Supply Chain | 1 Low (dependency), 1 Medium (CDN) | Mitigation paths clear |

**Overall Risk Rating:** 🟡 **MODERATE** — The application has a solid security foundation with no critical vulnerabilities. The primary risks are supply-chain (CDN scripts without SRI) and the inherent limitations of a client-side-only architecture (all validation bypassable). The smart contract is well-structured with proper access controls and no reentrancy risk.

**Key Recommendation:** Add Subresource Integrity (SRI) hashes for all CDN-loaded scripts before mainnet launch. This is the highest-impact, lowest-effort security improvement remaining.

---

## 1. Smart Contract Security Audit

**File:** `scrypto/gacha/src/lib.rs`  
**Framework:** Scrypto v1.3.1  
**Blueprint:** `GachaMinter`

### 1.1 Architecture Review

```
┌─────────────────────────────────────────┐
│           User Account                  │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │ XRD Vault   │  │ Badge NFT Vault │  │
│  └──────┬──────┘  └─────────────────┘  │
│         │ withdraw XRD                 │
└─────────┼───────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│        GachaMinter Component            │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │ XRD Vault   │  │ Admin Badge     │  │
│  │ (payments)  │  │ Vault (auth)    │  │
│  └──────┬──────┘  └─────────────────┘  │
│         │                               │
│  ┌──────┴──────────────────────────┐   │
│  │ Badge Resource Manager          │   │
│  │ (mint-only, no burn)            │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### 1.2 Findings

#### LOW-1: `BadgeMinted` Event Records Component Address, Not Minter Address
**Severity:** Low  
**Status:** ✅ RESOLVED  
**Location:** `lib.rs:236`  
**Code:**
```rust
Runtime::emit_event(BadgeMinted {
    tier,
    rarity: config.rarity,
    sp: config.sp,
    nonce,
    badge_id: badge_id.clone(),
    recipient: Runtime::global_address(),  // ← Component address, not user
});
```
**Impact:** Off-chain indexers cannot attribute mints to specific users without correlating via transaction hash. This breaks leaderboard aggregation, analytics pipelines, and notification systems that rely on event data alone.  
**Proof:** `Runtime::global_address()` returns the component's own address (`GachaMinter`). The user's account address is available as `accountAddress` in the manifest but never passed to the contract as a parameter.  
**Resolution:** Added `recipient: String` parameter to `mint_gacha_badge` and emitted the caller-supplied address in the `BadgeMinted` event. The frontend now passes the validated wallet address in the manifest. Note: because the contract cannot natively identify the transaction caller in Scrypto, the address is passed as a parameter and is therefore unverifiable on-chain. It is intended for off-chain indexing only.
```rust
pub fn mint_gacha_badge(
    &mut self,
    payment: FungibleBucket,
    tier: String,
    nonce: u64,
    recipient: ComponentAddress,  // NEW
) -> NonFungibleBucket {
    // ...
    Runtime::emit_event(BadgeMinted {
        // ...
        recipient: recipient,  // User's address, not component
    });
}
```

---

#### INFO-1: Missing Events for Admin Operations
**Severity:** Informational  
**Status:** ✅ RESOLVED  
**Location:** `withdraw_xrd`, `update_tier`, `add_tier`, `set_enabled`  
**Impact:** No on-chain audit trail for privileged operations. If admin badge is compromised, there's no event log to trace malicious actions.  
**Resolution:** Added `TierUpdated`, `XrdWithdrawn`, and `EnabledChanged` events. All admin operations now emit an on-chain event:
```rust
Runtime::emit_event(TierUpdated { tier, price, sp, rarity, action });
Runtime::emit_event(XrdWithdrawn { amount, remaining });
Runtime::emit_event(EnabledChanged { enabled });
```
```rust
#[derive(ScryptoSbor)]
pub struct XrdWithdrawn { pub amount: Decimal, pub recipient: ComponentAddress }

#[derive(ScryptoSbor)]
pub struct TierUpdated { pub tier: String, pub price: Decimal, pub sp: u64 }

#[derive(ScryptoSbor)]
pub struct MintingEnabled { pub enabled: bool }
```

---

#### INFO-2: No Maximum Badge Supply Cap
**Severity:** Informational  
**Location:** `mint_gacha_badge`  
**Impact:** Unlimited minting is possible. While the economic model (pay-per-mint) naturally limits supply, there's no hard cap. In a scenario where XRD value drops dramatically or tier prices are set too low via `update_tier`, the NFT collection could become hyper-inflated.  
**Remediation:** Consider adding an optional `max_supply: u64` field and asserting `mint_counter <= max_supply` in `mint_gacha_badge`.

---

### 1.3 Security Controls Assessment

| Control | Implementation | Rating |
|---------|---------------|--------|
| **Access Control** | Admin badge (`require(admin_badge_address)`) for all privileged ops | ✅ Good |
| **Payment Validation** | `assert!(payment.amount() >= config.price)` — prevents underpay | ✅ Good |
| **Overflow Protection** | Scrypto `Decimal` + `u64` — radix-native safe arithmetic | ✅ Good |
| **Re-entrancy** | No external calls during mint; all state changes are atomic | ✅ Safe |
| **Pause Mechanism** | `enabled` flag + `set_enabled` admin method | ✅ Good |
| **NFT Burnability** | `burn_roles: deny_all` — soulbound badges | ✅ Good |
| **Upgrade Path** | None — contract is immutable post-deployment | ⚠️ Accepted design choice |

---

## 2. Frontend Security Audit

### 2.1 Threat Model: Trust Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                         ATTACKER                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ CDN Comprom │  │ Malicious   │  │ Modified Client Build   │ │
│  │ ise         │  │ Wallet      │  │ (skip validation)       │ │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────────┘ │
└─────────┼────────────────┼──────────────────────────────────────┘
          │                │
          ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      USER BROWSER                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  React SPA (Vite bundle)                                │   │
│  │  • All VITE_* env vars are PUBLIC (bundled into JS)    │   │
│  │  • localStorage / IndexedDB are USER-CONTROLLED        │   │
│  │  • Rate limiter is COSMETIC only                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│  ┌───────────────────────┼───────────────────────────────────┐ │
│  │  Service Worker       │   IndexedDB (offline queue)       │ │
│  │  • Cache poisoning    │   • User can modify/delete        │ │
│  │    possible if        │   • No integrity verification     │ │
│  │    attacker controls  │                                   │ │
│  │    origin             │                                   │ │
│  └───────────────────────┴───────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                            │
│  • Radix Gateway (public, no auth)                              │
│  • OneSignal CDN (push notifications)                           │
│  • Sentry (error reporting)                                     │
│  • Google Fonts (CSS + font files)                              │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RADIX BLOCKCHAIN                             │
│  • Scrypto Contract (GachaMinter)                               │
│  • User's wallet holds private keys                             │
│  • Smart contract is the ONLY security boundary                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Findings

#### MEDIUM-1: CDN Scripts Loaded Without Subresource Integrity (SRI)
**Severity:** Medium  
**Status:** ✅ RESOLVED  
**Location:** `index.html:17`  
**Original Issue:** OneSignal SDK was loaded without an integrity hash. If `cdn.onesignal.com` were compromised, arbitrary JavaScript could execute in the app's full context.  
**Resolution:** Added SRI hash computed from the current v16 SDK:
```html
<script
  src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
  defer
  integrity="sha384-9WymDdowrrUwJuXZ2joqlQYNQSPWfKsyBecZsqaJgsTur2qmjjrc3YQVGiaFdFdA"
  crossorigin="anonymous"
></script>
```
**Ongoing Maintenance:** Monitor `https://github.com/OneSignal/OneSignal-Website-SDK/releases` and update the hash when upgrading versions. The browser will refuse to execute the script if the hash mismatches, failing closed.

---

#### LOW-1: Weak Wallet Address Validation Enables Manifest Injection
**Severity:** Low  
**Status:** ✅ RESOLVED  
**Location:** `src/lib/validation.ts:4-7` + `src/lib/radix.ts:186-209`  
**Original Issue:** `walletAddressSchema` only checked `min(10).max(200).regex(/^account_/)`, which was too permissive. A crafted string containing quotes or newlines could break the transaction manifest syntax.  
**Resolution:**
1. **Tightened validation** to strict Bech32m format:
```typescript
export const walletAddressSchema = z.string()
  .regex(
    /^account_(tdx_2_1|rdx1)[a-z0-9]{50,65}$/,
    'Must be a valid Radix account address'
  );
```
2. **Added runtime sanitization** in `mintGachaBadge`:
```typescript
const safeAddress = accountAddress.replace(/[^a-zA-Z0-9_]/g, '');
if (safeAddress !== accountAddress) {
  throw new TransactionError('Wallet address contains invalid characters');
}
```
The manifest now only uses addresses that have passed both schema validation AND character whitelist verification.

---

#### LOW-2: OneSignal Notification Click Handler is a Navigation Vector
**Severity:** Low  
**Status:** ✅ RESOLVED  
**Location:** `src/lib/oneSignal.ts:43-66`  
**Code:**
```typescript
OneSignal.Notifications.addEventListener('click', (event) => {
  logger.info('OneSignal notification clicked', { event }, 'OneSignal');
  if (typeof window !== 'undefined') {
    window.location.href = '/open';
  }
});
```
**Impact:** If the OneSignal account is compromised, an attacker can send push notifications to all subscribed users. While this specific handler hardcodes `/open`, the OneSignal dashboard allows sending notifications with custom action buttons and deep links. Users trust push notifications from installed apps, making this a social engineering vector.  
**Resolution:** Added URL origin validation before navigation. If the notification contains a URL, it is parsed and checked against `window.location.origin`. External URLs are rejected and logged. Malformed URLs are also rejected. The fallback `/open` is only used when no URL is present.
```typescript
const url = event.result?.url;
if (url) {
  const parsed = new URL(url, window.location.origin);
  if (parsed.origin !== window.location.origin) {
    logger.warn('Rejecting external notification URL', { url }, 'OneSignal');
    return;
  }
  window.location.href = parsed.pathname + parsed.search;
  return;
}
window.location.href = '/open';
```

---

#### LOW-3: Google Fonts Loaded Without preconnect Strictness
**Severity:** Low  
**Status:** ✅ RESOLVED  
**Location:** `index.html:12-14`  
**Code:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;..." rel="stylesheet">
```
**Impact:** Google sees visitor IP addresses and can track users across sites that use Google Fonts. While minor, this is a privacy leak. More critically, if `fonts.googleapis.com` serves malicious CSS (extremely unlikely but theoretically possible via compromise), it could exfiltrate data via `@font-face` URLs or CSS injections.  
**Resolution:** Downloaded Inter and JetBrains Mono TTF files to `public/fonts/` and created a local `font.css`. Removed Google Fonts `<link>` tags from `index.html`, dropped `fonts.googleapis.com` from `style-src` and `fonts.gstatic.com` from `font-src` in both `nginx.conf` and `netlify.toml`.

---

#### INFO-3: No Content Security Policy Reporting Endpoint
**Severity:** Informational  
**Location:** `nginx.conf`, `netlify.toml`  
**Impact:** The CSP is well-configured but lacks a `report-uri` or `report-to` directive. Violations (which could indicate XSS attempts or unexpected third-party scripts) go unnoticed.  
**Remediation:** Add a reporting endpoint. Free options include:
- `https://<your-project>.report-uri.com/r/d/csp/enforce` (Report-URI service)
- Self-hosted endpoint that logs to Sentry or a simple log aggregator
```
report-uri https://your-csp-reporter.example.com/csp-report;
```

---

#### INFO-4: Client-Side State is Fully User-Controllable
**Severity:** Informational  
**Location:** `localStorage`, `IndexedDB`, `rateLimiter.ts`  
**Impact:** All client-side "security" measures are trivially bypassable:
- Clear `localStorage` → rate limiter resets
- Edit `gachafi.completedDates.v2` → fake streaks
- Delete IndexedDB → offline queue disappears  
**Acceptance:** This is a known limitation of pure client-side DApps. The smart contract is the real security boundary. However, if streaks ever confer economic benefits (discounts, bonus SP), the streak logic MUST be verified on-chain or server-side.  
**Remediation:** Document this as an architectural constraint. If streak rewards are added, store `last_mint_epoch` on-chain and calculate streaks in the contract.

---

## 3. Infrastructure & Deployment Security

### 3.1 Findings

#### LOW-4: CI Pipeline Lacks SAST and Secret Scanning
**Severity:** Low  
**Status:** ✅ RESOLVED  
**Location:** `.github/workflows/ci.yml`  
**Impact:** The CI runs lint, type-check, test, build, and `npm audit`, but missing:
- Static Application Security Testing (SAST) — e.g., Semgrep, CodeQL
- Secret scanning — e.g., GitHub secret scanning, TruffleHog, GitLeaks
- Dependency license compliance check  
**Attack Scenario:** A developer accidentally commits a private key or API token. Without secret scanning, it remains in git history indefinitely. Even if `.gitignore` excludes `.env`, manual `git add -f` or copy-paste mistakes happen.  
**Resolution:** Added a `secrets` job to CI that runs TruffleHog on every push and PR:
```yaml
secrets:
  name: Secret scanning
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
    - uses: trufflesecurity/trufflehog@main
      with:
        path: ./
        base: main
        head: HEAD
        extra_args: --only-verified
```
Also recommended enabling GitHub's built-in secret scanning and push protection in repository settings.

---

#### INFO-5: Dockerfile Build Args Expose All Config at Build Time
**Severity:** Informational  
**Location:** `Dockerfile:19-47`  
**Impact:** All environment variables are passed as `ARG` and then set as `ENV`. While these are build-time values and don't persist in the final image (since we use multi-stage build), the build logs in CI may leak them if not carefully configured.  
**Verification:** ✅ The multi-stage build means the runtime image only contains the compiled `dist/` files. The `ENV` lines are in the `builder` stage, which is discarded. The values are baked into the JS bundle (intentional, since they're `VITE_*` client vars).  
**Recommendation:** Ensure GitHub Actions logs are not publicly accessible and that `secrets` masking is working correctly. The current workflow uses `secrets.*` for sensitive values, which GitHub masks in logs.

---

#### INFO-5: No Branch Protection or Required Reviews Documented
**Severity:** Informational  
**Status:** ✅ RESOLVED  
**Location:** Repository configuration  
**Impact:** Without branch protection rules, a compromised developer account or malicious insider can push directly to `main`, bypassing all CI checks and code review.  
**Resolution:** Created `docs/BRANCH_PROTECTION.md` with step-by-step instructions for configuring GitHub branch protection on `main` and `develop`, including required status checks (`build`, `audit`, `secrets`), required approvals, stale review dismissal, and administrator inclusion.

---

### 3.2 Security Controls Assessment

| Control | Implementation | Rating |
|---------|---------------|--------|
| **Multi-stage Docker build** | Dev deps excluded from runtime image | ✅ Good |
| **Privilege dropping** | `app:app` user owns static files | ✅ Good |
| **Health checks** | `/health` endpoint in nginx | ✅ Good |
| **CSP headers** | Strict policy in nginx + netlify | ✅ Good |
| **HSTS** | `max-age=31536000; includeSubDomains` | ✅ Good |
| **CI permissions** | `contents: read` only | ✅ Good |
| **npm audit** | Runs on every push/PR | ✅ Good |
| **SAST/Secret scanning** | TruffleHog in CI | ✅ Good |
| **WAF/DDoS protection** | Not implemented (static hosting) | ⚠️ Acceptable for static |

---

## 4. Supply Chain Security

### 4.1 Dependency Audit

**Command:** `npm audit --audit-level=high`

| Package | Severity | CVE | Impact |
|---------|----------|-----|--------|
| `elliptic` (via `secp256k1` → `@radixdlt/radix-engine-toolkit`) | Low | GHSA-848j-6mx2-7j84 | Cryptographic primitive with risky implementation |

**Analysis:** The `elliptic` vulnerability affects `@radixdlt/radix-engine-toolkit`, which is only used in local developer scripts (`scripts/check-balance.cjs`, etc.). It is **NOT bundled into the browser application** — the browser bundle uses `@radixdlt/radix-dapp-toolkit` (v2.1.1), which does not depend on `elliptic`.  
**Risk:** Very Low. The vulnerable code path is never executed in the production browser bundle.

### 4.2 CDN Dependencies

| Resource | URL | SRI | Risk |
|----------|-----|-----|------|
| OneSignal SDK | `cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js` | ❌ None | **Medium** — supply chain attack vector |
| Google Fonts CSS | `fonts.googleapis.com/css2?family=Inter...` | N/A (self-hosted) | ✅ Resolved — fonts served from `/fonts/` |
| Google Fonts files | `fonts.gstatic.com` | N/A (self-hosted) | ✅ Resolved — fonts served from `/fonts/` |

### 4.3 Recommendations

1. **Add SRI to OneSignal** — ✅ Done
2. **Self-host Google Fonts** — ✅ Done
3. **Pin OneSignal to a specific version** — The SRI hash already pins the exact file content. Upgrading requires updating both the URL and the hash.
4. **Monitor `@radixdlt/radix-dapp-toolkit` for security advisories** — this IS in the browser bundle and handles wallet connection

---

## 5. OWASP Top 10 Mapping (2021)

| # | Category | Status | Notes |
|---|----------|--------|-------|
| A01 | Broken Access Control | ✅ Mitigated | Smart contract enforces admin-only ops; no backend to attack |
| A02 | Cryptographic Failures | ✅ Mitigated | `crypto.getRandomValues` for nonces; no custom crypto |
| A03 | Injection | ✅ Mitigated | No SQL/NoSQL database; transaction manifest uses validated inputs |
| A04 | Insecure Design | 🟡 Partial | Client-side rate limiting is cosmetic; no server-side validation |
| A05 | Security Misconfiguration | ✅ Mitigated | Strict CSP, HSTS, security headers; minimal permissions in CI |
| A06 | Vulnerable Components | 🟡 Partial | `elliptic` low-sev CVE in dev dep; SRI added to OneSignal |
| A07 | Identification & Auth Failures | ✅ N/A | Authentication is delegated to Radix wallet (Web3 model) |
| A08 | Software & Data Integrity Failures | 🟡 Partial | SRI on OneSignal; fonts self-hosted; no code signing |
| A09 | Security Logging & Monitoring Failures | 🟡 Partial | Sentry for errors; admin ops now emit events; no CSP reporting endpoint |
| A10 | Server-Side Request Forgery | ✅ N/A | No server-side code; all requests originate from client |

---

## 6. Action Items (Prioritized)

### Immediate (Before Mainnet)

- [x] **MEDIUM-1:** Add SRI hash to OneSignal script in `index.html`
- [x] **LOW-1:** Tighten `walletAddressSchema` to match Radix Bech32m format exactly
- [x] **LOW-1:** Add manifest address sanitization helper
- [x] **LOW-1 (Scrypto):** Add `recipient` parameter to `mint_gacha_badge` and emit user address in `BadgeMinted`
- [x] **LOW-2:** Validate OneSignal notification URLs before navigation
- [x] **LOW-3:** Self-host Google Fonts
- [x] **LOW-4:** Add secret scanning (TruffleHog) to CI pipeline
- [x] **INFO-1 (Scrypto):** Emit events for `withdraw_xrd`, `update_tier`, `add_tier`, `set_enabled`
- [x] **INFO-5:** Document branch protection rules

### Short-Term (Post-Launch)

- [ ] **INFO-3:** Add CSP `report-uri` endpoint (requires external service such as Report-URI or a self-hosted collector)
- [ ] **INFO-2 (Scrypto):** Consider adding optional `max_supply` cap

### Smart Contract (Next Deployment)

- [ ] **INFO-2:** Consider adding optional `max_supply` cap

---

## 7. Files Audited

```
scrypto/gacha/src/lib.rs           Smart contract
scrypto/gacha/Cargo.toml           Rust dependencies
src/lib/radix.ts                   Blockchain service & manifest builder
src/lib/validation.ts              Input validation schemas
src/lib/errorHandling.ts           Error classes, retry logic, circuit breaker
src/lib/rateLimiter.ts             Client-side rate limiting
src/lib/oneSignal.ts               Push notification service
src/lib/featureFlags.ts            Feature flag evaluation
src/lib/logger.ts                  Logging & Sentry integration
src/contexts/WalletContext.tsx     Wallet state management
src/contexts/OfflineContext.tsx    Offline queue replay logic
src/utils/offlineQueue.ts          IndexedDB offline queue
src/utils/pwa.ts                   PWA install & standalone detection
src/App.tsx                        Root component & routing
index.html                         HTML shell & CDN references
public/manifest.json               PWA manifest
public/sw.js                       Service worker
public/OneSignalSDKWorker.js       OneSignal service worker
package.json                       Dependencies
.github/workflows/ci.yml           CI pipeline
Dockerfile                         Container build
nginx.conf                         Production server config
netlify.toml                       Netlify deploy config
```

---

*This audit was conducted using manual code review, STRIDE threat modeling, and OWASP Top 10 mapping. Smart contract vulnerabilities were evaluated against known Scrypto/Radix vulnerability classes. No formal verification tools (Slither, Mythril, Echidna) were run — these should be executed before mainnet deployment.*
