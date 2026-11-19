# GachaFi Architecture

## System map

```text
React SPA / PWA
  ├─ WalletContext ─────── lazy Radix DApp Toolkit ─────── Radix Wallet
  ├─ Open ──────────────── transaction manifest ────────── GachaMinter
  ├─ Reveal/Inventory ──── typed Gateway reads ─────────── Radix Gateway
  ├─ GameContext ───────── localStorage (streaks only)
  ├─ OfflineContext ────── IndexedDB (optional unsigned mint intents)
  ├─ Privacy ───────────── local consent, export and deletion
  ├─ Sentry ────────────── optional, consent-gated error reports
  └─ OneSignal ─────────── optional, consent-gated push subscriptions

GachaMinter (Scrypto)
  ├─ XRD vault
  ├─ tier configuration and exact-payment checks
  ├─ badge resource manager and NFT data
  ├─ admin proof checks, pause, supply and withdrawal limits
  └─ BadgeMinted and administrative events
```

There is no GachaFi backend. Static hosting serves the frontend; the wallet signs transactions; Radix is authoritative for assets and payment state.

## Mint and reveal flow

1. Open validates account, tier, amount, deployment configuration, connectivity, and local click rate.
2. `RadixService` creates a cryptographic nonce and a manifest withdrawing exactly the selected tier price.
3. The wallet displays and signs the manifest. A signature attempt is never automatically repeated.
4. `mint_gacha_badge` checks enabled state, tier, supply cap, and exact payment, then mints the NFT and emits `BadgeMinted` with its local ID and transaction hash.
5. Open polls `/transaction/status`. `CommittedSuccess` records the local daily streak and opens Reveal; `CommittedFailure` clears pending state. Read failures preserve the hash and retry status only.
6. Reveal reads `/transaction/committed-details`, extracts the event's badge ID, then reads `/state/non-fungible/data`.
7. The displayed name, image, rarity, description, and SP come from that NFT, not local tier constants. Indexing delay has a retryable state and an explorer link.

## Inventory and statistics

`src/lib/gateway.ts` reads `/state/entity/page/non-fungibles` with Vault aggregation, filters the configured badge resource, and follows both resource-page and vault-ID cursors. NFT data is requested in batches of at most 100. Responses are validated and burned/malformed entries are not shown as valid badges.

Collection calculates account SP by summing current badge NFT data. Global supply is `mint_counter - 1` read from component state. There is no global player ranking because no indexed ranking data source exists.

## Trust boundaries

| Component | Trust and limitation |
|---|---|
| Scrypto contract | Economic security boundary; exact payment and admin rules are enforced on-chain |
| Radix Wallet | Holds keys and presents/signs transactions |
| Radix Gateway | Read/indexing dependency; transport or schema failures are surfaced, never converted to fake success |
| React frontend | Untrusted client; validation and rate limiting are UX controls only |
| localStorage/IndexedDB | User-controlled local state; streaks and queued intents have no economic authority |
| Service worker | Caches static shell only; does not sign mints or cache Gateway responses |
| Sentry/OneSignal | Optional external processors, disabled until configured and consented |

## Contract ownership and upgrades

The component is globalized with `OwnerRole::None` and cannot be upgraded in place. The badge resource has an admin-updatable owner role, while minting requires the component-held admin badge. Badge burning is disabled, but badges remain transferable; they are not soulbound.

The NFT schema now includes image URL and description. Any schema or logic change requires a new package/component, new frontend addresses, and operator-managed migration. Pause the old component when appropriate.

## Privacy and local data

Wallet addresses are sent to the Gateway for core reads and are public on-chain. Streak dates, consent, and optional queued requests stay on the device until cleared. Privacy settings export/delete local GachaFi data only; they cannot erase blockchain data or promise provider-side deletion.

OneSignal's self-hosted loader is inserted after notification consent. Sentry initializes only after error-reporting consent. Wallet connection never requests push permission.

## Deployment boundaries

Vite embeds configuration at build time. Docker runs non-root nginx on 8080; Netlify and nginx apply CSP/security headers and SPA rewrites. Production source maps are disabled. COOP/COEP are not enabled because wallet and NFT compatibility must not be sacrificed for unused isolation.

CI runs frontend checks, tests, build, bundle budget, dependency audit, secret scanning, Scrypto tests, and release Wasm compilation. These checks do not replace an independent contract audit, real Stokenet wallet test, legal review, or physical mobile testing.
