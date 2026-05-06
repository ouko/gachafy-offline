# GachaFi Architecture Overview

A high-level map of how the pieces fit together.

---

## Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER'S DEVICE                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  React 18 SPA (Vite)                                       │   │
│  │  • All state in React Context + TanStack Query             │   │
│  │  • localStorage / IndexedDB for offline queue & prefs      │   │
│  │  • Service Worker caches static assets                     │   │
│  │  • NO backend server — pure client-side                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                          │                                          │
│  ┌───────────────────────┼──────────────────────────────────────┐  │
│  │  Service Worker       │  IndexedDB (offline queue)           │  │
│  │  • Caches JS/CSS/fonts│  • Queued mint requests             │  │
│  │  • Offline fallback   │  • Replayed when connection returns │  │
│  └───────────────────────┴──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
           │                    │ HTTPS
           │                    ▼
           │         ┌────────────────────────┐
           │         │  Radix Gateway API     │
           │         │  (public, read-only)   │
           │         └────────────────────────┘
           │                    │
           ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      RADIX DLT BLOCKCHAIN                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  GachaMinter Component (Scrypto)                           │   │
│  │  • Holds XRD payments in vault                              │   │
│  │  • Mints soulbound badge NFTs                               │   │
│  │  • Admin-only: withdraw, update tiers, pause                │   │
│  │  • Emits events for off-chain indexing                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                          │                                          │
│  ┌───────────────────────┼──────────────────────────────────────┐  │
│  │  User's Wallet        │  Badge NFT Resource                  │  │
│  │  (holds private keys) │  (mint-only, no burn)                │  │
│  └───────────────────────┴──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Principles

1. **No backend** — There is no server-side code. No API routes, no database, no auth server. The smart contract is the only authority.

2. **Client-side only** — Everything in `src/` runs in the user's browser. Any "validation" in the frontend (rate limits, streak checks, tier prices) is for UX only and can be bypassed.

3. **Wallet as identity** — The user's Radix wallet address IS their identity. No passwords, no sessions, no cookies.

4. **Immutable contract** — The Scrypto code cannot be changed after deployment. If you need a fix, deploy a new package + component and update the frontend addresses.

---

## Data Flow: Minting a Badge

```
1. User selects tier → clicks "Open"
2. Frontend validates inputs (Zod schemas)
3. Frontend constructs a Radix transaction manifest
4. Frontend submits manifest via Radix DApp Toolkit
5. User's wallet extension / mobile app shows the manifest
6. User signs the transaction
7. Radix Wallet submits to the Radix ledger
8. Contract validates payment ≥ tier price
9. Contract mints badge NFT → deposits into user's account
10. Contract emits BadgeMinted event
11. Frontend polls Gateway API for transaction status
12. Frontend shows "Success!" + navigates to reveal page
```

---

## Trust Boundaries

| Layer | Trust Level | Why |
|-------|------------|-----|
| Radix blockchain | **Trusted** | Decentralised consensus, immutable ledger |
| User's wallet | **Trusted** | Holds private keys, signs transactions |
| React frontend | **Untrusted** | Can be modified by user (DevTools, modified build) |
| Service Worker | **Untrusted** | User can unregister or replace it |
| localStorage / IndexedDB | **Untrusted** | User can clear or edit |

This is why **all economic logic must live in the smart contract**. The frontend is a pretty interface, not a security layer.

---

## External Dependencies

| Service | Purpose | Can It Be Removed? |
|---------|---------|-------------------|
| Radix Gateway API | Read blockchain state (balances, transaction status) | No — but you can self-host |
| OneSignal CDN | Push notifications | Yes — UI degrades gracefully |
| Sentry CDN | Error tracking | Yes — errors log to console instead |
| Google Fonts | Typography | **Already removed** — self-hosted |

---

## File Responsibility Map

| File | What It Owns |
|------|-------------|
| `src/lib/radix.ts` | Wallet connection, transaction building, balance polling |
| `src/lib/radix-config.ts` | Network constants (addresses, URLs) — zero heavy deps |
| `src/lib/validation.ts` | Zod schemas for all user input |
| `src/contexts/WalletContext.tsx` | Wallet state, balance polling, connection lifecycle |
| `src/contexts/GameContext.tsx` | Game state (selected tier, booster, streaks) |
| `src/contexts/OfflineContext.tsx` | Offline queue, network detection, replay logic |
| `src/lib/oneSignal.ts` | Push notification initialization & event handling |
| `src/lib/logger.ts` | Structured logging + Sentry integration |
| `public/sw.js` | Service worker for offline caching |
| `scrypto/gacha/src/lib.rs` | Smart contract: minting, admin ops, events |
