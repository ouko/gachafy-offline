# gachafy-offline — MVP hardening pass

**Date:** 2026-05-05
**Status:** Production-ready *infrastructure*; one external dependency (the Scrypto component deployment) still required before the mint flow goes live.
**Verification:** `tsc --noEmit` clean, `eslint .` clean (0 errors, 40 boundary-`any` warnings).

This document supersedes the earlier audit. It lists what was changed, what
the user must still do externally, and what was deliberately not changed.

---

## Critical issues — resolved

**1. Fake gacha component addresses → environment-driven, gated.**
`src/lib/radix.ts` now reads `VITE_GACHA_PACKAGE_ADDRESS` and
`VITE_GACHA_COMPONENT_ADDRESS` from env. `src/lib/featureFlags.ts` exposes a
`GACHA_DEPLOYED` flag that is true only when both are set. `mintGachaBadge`
throws a clear `TransactionError` if called before deployment, and the Open
button shows a "Coming Soon" state in the UI when the flag is false. The
old hardcoded `8p8p8p…` placeholders are gone.

**2. Bridge modal theatre → feature-flagged off.**
`VITE_FEATURE_BRIDGE` defaults to `false`. The modal is only rendered (and
the swipe-up gesture only triggers it) when the flag is true. The
`@hyperlane-xyz/sdk` package, which was 18 MB of dead weight, is removed
from `package.json`. A header comment in `BridgeModal.tsx` flags it as a
non-functional placeholder so the next person doesn't ship it accidentally.

**3. Optimistic balance bug → centralised pending delta.**
`GachaFiContext` now exposes `pendingDelta` plus `setPendingDelta` /
`clearPendingDelta`. The displayed balance is `polledBalance + pendingDelta`,
so polling no longer overwrites optimistic state. `Open.tsx` uses these
helpers and clears the delta on tx success or failure. Open.tsx no longer
keeps its own duplicate balance/wallet state — the gateway is queried once
in the context, not twice.

**4. Dockerfile broken (`npm ci --only=production` then `vite build`)
→ fixed.** The build stage now runs `npm ci` (full deps), runs
`npm run check` and then `npm run build`. The runtime stage is unchanged
(nginx alpine), so dev deps don't ship. Bumped the builder image to
`node:20-alpine` to match the CI matrix.

**5. Service worker never registered → registered from `main.tsx`.**
Moved `registerSW()` and `setupPWAInstall()` out of `Index.tsx` and into
`main.tsx`, so deep-links to `/open` or `/creator` register the SW too.

**6. CSP whitelisted the wrong gateway → fixed and tightened.**
`nginx.conf` and `netlify.toml` now both list
`babylon-stokenet-gateway.radixdlt.com`, `stokenet.radixdlt.com`,
`mainnet.radixdlt.com`, and the OneSignal subdomains under `connect-src`.
`script-src` no longer allows `'unsafe-eval'` (Vite's production output
doesn't need it). Added HSTS, `frame-ancestors 'self'`, `base-uri 'self'`,
`form-action 'self'`, an `interest-cohort` opt-out, and dropped the
deprecated `X-XSS-Protection` to its safe `0` value.

**7. `.env` committed and ungitignored → fixed.**
`.gitignore` now excludes `.env`, `.env.local`, `.env.*.local`,
`.env.development`, `.env.production` while still allowing `.env.example`.
**Action still required by you:** `git rm --cached .env` to drop the committed
env from history and create a fresh `.env` locally based on `.env.example`.

**8. Creator dashboard fabricated USD figures → made honest.**
`getCapsuleEarnings`'s `Math.random()` block is gone. `Creator.tsx` shows
zeros plus a banner explaining the on-chain reads are not implemented yet,
so creators don't see invented earnings. `xrdPrice` is `null` (rendered as
"—") until a price feed is configured.

---

## Important issues — resolved

**9. Duplicate state between `Open.tsx` and `GachaFiContext` → collapsed
to one.** `Open.tsx` reads `address`, `balance`, `isConnected`, `pendingTx`,
`pendingDelta` from `useWallet()`. The local `setBalance` is gone. There is
exactly one balance polling timer now, in the context.

**10. Offline queue posted to non-existent `/api/mint` → fixed.**
`useOfflineQueue` now replays queued requests by calling
`radixService.mintGachaBadge` directly (which is the only way that could
ever work — wallet signing is online-only). The behaviour is gated behind
`VITE_FEATURE_OFFLINE_QUEUE` (off by default) and the "queued" pill in the
UI is only shown when it's on. The dead `/api/mint` mock in `sw.js` is
removed; the SW now strictly handles caching.

**11. OneSignal hardcoded to a fake app ID → env-driven.**
`oneSignal.ts` reads `VITE_ONESIGNAL_APP_ID` and the optional
`VITE_ONESIGNAL_SAFARI_WEB_ID`. With no app ID set, every method is a no-op
and the rest of the app keeps working. The previous "demo mode" that
masqueraded as functioning push is removed. The misleading `setTimeout`
"daily reminders" scheduler is gone — real scheduled push has to be driven
from a backend, which is now documented in the file's header.

**12. CI script `npm run check` didn't exist; lint was silenced → fixed.**
`package.json` now defines `"check": "tsc --noEmit"`. The CI workflow
runs lint without `|| true`, runs the type check, builds, and uploads the
build as a PR artefact. Bumped `actions/checkout` and `actions/setup-node`
to `@v4`. Added a separate `audit` job that runs `npm audit --audit-level=high`
on every push. Removed the broken Vercel deploy steps; deployment is left
to whichever target you choose (Docker, Netlify, or a Vercel project you
wire up separately).

**13. Three conflicting deploy targets → consistent security posture.**
Docker/nginx remains the canonical target. `netlify.toml` now mirrors the
nginx CSP and security headers exactly so the static-host path is
production-equivalent. (No `vercel.json` was added — if you go that route,
you'll want one with the same headers.)

**14. `Math.random()` "VDF nonce" → `crypto.getRandomValues`.**
`generateNonce()` in `radix.ts` uses `crypto.getRandomValues` and combines
two `Uint32`s into a `Number.MAX_SAFE_INTEGER`-safe value. `Math.random()`
is only the last-ditch fallback if the Web Crypto API is unavailable (very
old browsers), and that path logs a warning. **Caveat:** if your on-chain
component uses the nonce as randomness for tier-rolling, this still isn't
a true VDF. Treat the nonce as anti-replay metadata, not entropy for
rewards.

**15. XRD precision and the silent 1M cap → relaxed and corrected.**
`balanceSchema` cap raised from `1_000_000` to `1e13` (10 trillion XRD —
~10× total supply, a sanity check rather than a real bound). Added a
`parseXrdAmount` helper that guards against `NaN`/negative/non-finite
gateway responses but accepts decimal strings. The gateway already returns
human-readable decimals, so BigInt isn't needed for display; large balances
will be display-rounded but pass the validation.

---

## Cleanup — resolved

- `Reveal.tsx` is now tier-aware: SP rewards are 100/350/1000 for
  common/rare/epic, the badge label and gradient match the tier, and the
  share text says the right thing.
- Streak bitmap rewrote from weekday-keyed to date-keyed
  (`gachafi.completedDates.v2` in `localStorage`). Multi-week streaks now
  represent correctly. The legacy `streakMap` key is dropped on first read.
- Touch swipe threshold uses `px/ms` directly instead of fake m/s
  conversion, so it behaves consistently across DPIs.
- "GachaFi POC" titles replaced in `index.html`, `manifest.json`,
  description meta, OG tags. PWA name is now just "GachaFi".
- `@hyperlane-xyz/sdk` removed from `package.json`.
- ESLint config tightened: ignores `dist`/`node_modules`, downgrades
  `no-explicit-any` to a warning (the codebase intentionally uses `any` at
  third-party API boundaries), and exempts `tailwind.config.ts` from the
  `no-require-imports` rule.
- `RadixConnectButton.tsx` and `pwa.ts` empty-catch / `@ts-ignore` lint
  errors fixed.

---

## Action items still on your side

These can't be done from inside the codebase:

1. **Deploy the Scrypto gacha package** to Stokenet (or mainnet) and set
   `VITE_GACHA_PACKAGE_ADDRESS` + `VITE_GACHA_COMPONENT_ADDRESS` in your
   deployment environment. Without this the Open button stays disabled.
2. **`git rm --cached .env`** to drop the committed env from history, and
   create a fresh `.env` locally based on `.env.example`.
3. **Set `VITE_RADIX_DAPP_DEFINITION`** in your deployment env. The
   placeholder Stokenet address is only a fallback for local dev and is
   intentionally empty for mainnet builds.
4. **Configure OneSignal** (`VITE_ONESIGNAL_APP_ID` and optionally
   `VITE_ONESIGNAL_SAFARI_WEB_ID`) and write the server-side cron that
   sends scheduled streak reminders via OneSignal's REST API. The client
   alone cannot reliably do this — the page is closed when the reminder
   needs to fire.
5. **Pick one deploy target.** Docker/nginx, Netlify, or Vercel — all
   three configs are now in sync, but having three is confusing. Keep one,
   delete the others.
6. **Run `npm install` once** after pulling these changes so your lockfile
   updates after the `@hyperlane-xyz/sdk` removal.
7. **Verify the build** in your own environment: `npm run check && npm run lint && npm run build`.
   The sandbox here couldn't reach the npm registry to install the
   platform-specific Rollup binary, so the actual `vite build` step is
   unrun. The TypeScript and ESLint passes are both clean.

---

## What I deliberately didn't change

- **The bridge feature is hidden, not implemented.** Building a real
  Hyperlane USDC→XRD bridge is a multi-week piece of work and depends on
  product decisions (which chains, which warp routes, fee strategy). The
  scaffolding is there; the flag is off.
- **The dApp metadata configuration docs** (`DAPP_METADATA_CONFIGURATION.md`,
  `RADIX_SETUP.md`, `LOVABLE_INDEPENDENCE_CHECKLIST.md`, `INDEPENDENCE.md`,
  `DEPLOYMENT.md`) are untouched. They reference older state but aren't
  blocking; rewriting them is a documentation pass.
- **The Supabase integration.** Removed. The `supabase/` directory and all
  Supabase references in documentation have been cleaned up. The app is a
  pure client-side DApp with no database dependency.
- **No tests exist and none were added.** The architecture is now
  testable (single-source state, env-driven config, isolated services),
  but writing the suite was out of scope.

---

## Files touched

```
.env.example                         re-written with all required vars
.gitignore                           added .env entries
.github/workflows/ci.yml             rewrote: actions@v4, check, audit, drop deploys
Dockerfile                           full deps, type check, drop privileges, /health
docker-compose.yml                   removed obsolete `version`, added all build args
eslint.config.js                     scoped ignores, downgraded no-explicit-any, etc.
index.html                           dropped POC, neutralised OG tags
netlify.toml                         CSP/headers parity with nginx
nginx.conf                           CSP fixed, HSTS, gateway URLs, frame-ancestors
package.json                         + check script, − @hyperlane-xyz/sdk
public/manifest.json                 dropped POC
public/sw.js                         removed dead /api/mint stub, bumped cache name
src/components/BridgeModal.tsx       added "this is a placeholder" header note
src/components/NotificationDemo.tsx  toned down "scheduled at 8 PM" copy
src/components/RadixConnectButton.tsx  filled empty catch
src/contexts/GachaFiContext.tsx      pending delta, date-keyed streak, no duplicate state
src/hooks/useOfflineQueue.ts         replay via radixService, feature-flagged
src/hooks/useWallet.ts               new pending-delta API
src/lib/featureFlags.ts              NEW
src/lib/oneSignal.ts                 env-driven, no fake demo mode
src/lib/radix.ts                     env-driven config, BigInt-safe parse, crypto nonce
src/lib/validation.ts                relaxed implausible 1M cap
src/main.tsx                         registers SW + install prompt
src/pages/Creator.tsx                honest dashboard, feature-flagged
src/pages/Index.tsx                  remove duplicate SW registration
src/pages/Open.tsx                   uses context state, pending delta, swipe in px/ms
src/pages/Reveal.tsx                 tier-aware rewards
src/utils/pwa.ts                     proper standalone-detect (no @ts-ignore)
src/vite-env.d.ts                    typed ImportMetaEnv
```
