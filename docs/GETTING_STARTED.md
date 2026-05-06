# Getting Started with GachaFi

This guide walks you from zero to a running local instance — and explains what each part of the codebase does.

> **First-time?** Read this file top-to-bottom.  
> **Deploying?** See [DEPLOYMENT.md](../DEPLOYMENT.md).  
> **Auditing?** See [security-audit.md](./security-audit.md) and [backend-architecture-audit.md](./backend-architecture-audit.md).

---

## 1. What You Are Building

GachaFi is a **100 % client-side DApp** (decentralised application). There is no backend server. All state lives in one of two places:

| State | Where It Lives | Who Controls It |
|-------|---------------|-----------------|
| Wallet / XRD balance | Radix blockchain | User |
| Badge NFTs | Radix blockchain (minted by our smart contract) | User |
| Streaks, preferences, audio mute | `localStorage` / `IndexedDB` | User |
| Offline mint queue | `IndexedDB` | User |
| Creator earnings | **Not yet on-chain** (returns honest zeros) | — |

The **smart contract** (`scrypto/gacha/src/lib.rs`) is the only security boundary. Everything in the React app is UX-only and can be bypassed by a motivated user.

---

## 2. Prerequisites

```bash
# Node.js 20+ (check with `node --version`)
# Rust + cargo (only if you want to build the Scrypto contract)
# A Radix wallet for testing (browser extension or mobile app)
```

---

## 3. Install & Run

```bash
# 1. Clone
git clone https://github.com/ouko/gachafy-offline.git
cd gachafy-offline

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env

# 4. Edit .env (see section 4 below)
#    You need at least VITE_RADIX_DAPP_DEFINITION for the wallet button to work.

# 5. Start dev server
npm run dev
# → Open http://localhost:5173
```

---

## 4. Environment Variables (the ones that matter)

Open `.env` and fill in the blanks:

| Variable | Required? | What It Does |
|----------|-----------|--------------|
| `VITE_RADIX_NETWORK` | Yes | `stokenet` (testnet) or `mainnet` |
| `VITE_RADIX_DAPP_DEFINITION` | **Yes** | Your dApp definition account address. The wallet refuses to connect without this. |
| `VITE_GACHA_PACKAGE_ADDRESS` | For minting | The Scrypto package you deployed. Empty = mint button disabled. |
| `VITE_GACHA_COMPONENT_ADDRESS` | For minting | The component address inside that package. Empty = mint button disabled. |
| `VITE_ONESIGNAL_APP_ID` | No | Push notifications. Leave blank to disable. |
| `VITE_SENTRY_DSN` | No | Error tracking. Leave blank to disable. |

> **How do I get a dApp definition address?**  
> Go to the [Radix Dashboard](https://stokenet-dashboard.radixdlt.com/) → Deploy a dApp definition → Set your `localhost:5173` origin as the verified origin.

---

## 5. Project Structure (the map)

```
gachafi-offline/
├── src/
│   ├── components/          # UI pieces (buttons, cards, selectors)
│   ├── contexts/            # React context providers (wallet, game, offline)
│   ├── hooks/               # Reusable logic (useWallet, useAudio, useStreak)
│   ├── lib/                 # Services & utilities
│   │   ├── radix.ts         # ← Radix DApp Toolkit wrapper (wallet, transactions)
│   │   ├── radix-config.ts  # ← Network addresses & constants (no heavy deps)
│   │   ├── validation.ts    # ← Zod schemas (address format, amounts, nonces)
│   │   ├── oneSignal.ts     # Push notification wrapper
│   │   ├── logger.ts        # Logging + Sentry integration
│   │   └── featureFlags.ts  # Toggle features without redeploying
│   ├── pages/               # Route-level components (/open, /reveal, /creator)
│   └── utils/               # Pure helpers (offlineQueue, pwa detection)
├── public/                  # Static assets (fonts, icons, service worker)
├── scrypto/gacha/src/       # ← Smart contract (Rust/Scrypto)
├── docs/                    # Audits, architecture notes, guides
└── scripts/                 # One-off Node scripts for Radix dev tasks
```

---

## 6. The Smart Contract (Quick Start)

```bash
cd scrypto/gacha

# Check it compiles
cargo check

# Run tests (if any)
cargo test

# Build for deployment
cargo build --target wasm32-unknown-unknown --release
```

See [SCRYPTO_GUIDE.md](./SCRYPTO_GUIDE.md) for full deploy instructions.

---

## 7. Common Commands

```bash
# Development
npm run dev              # Vite dev server
npm run check            # TypeScript type check (tsc --noEmit)
npm run lint             # ESLint
npm test -- --run        # Vitest (unit tests)
npm run build            # Production build → dist/

# Preview the production build locally
npm run build && npm run preview

# Docker
docker-compose up -d     # Build & run with nginx
```

---

## 8. Typical Developer Workflow

1. **Start the dev server** (`npm run dev`)
2. **Open the app** in a browser with the Radix Wallet extension installed
3. **Connect wallet** — if the button is greyed out, check your `.env` has `VITE_RADIX_DAPP_DEFINITION`
4. **Try to mint** — if minting fails with "not deployed", you need to deploy the Scrypto contract (see SCRYPTO_GUIDE.md)
5. **Make changes** → `npm run check && npm run lint && npm test -- --run` → commit

---

## 9. Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| "Connect Wallet" button greyed out / does nothing | Missing `VITE_RADIX_DAPP_DEFINITION` | Fill in `.env` |
| Wallet connects but mint button says "Coming Soon" | `VITE_GACHA_COMPONENT_ADDRESS` is empty | Deploy the contract, paste the address into `.env` |
| "Invalid admin badge" when calling admin methods | Using the wrong admin badge | Use the badge returned at component instantiation |
| `npm run check` fails with type errors | Out of date `@radixdlt/radix-dapp-toolkit` types | `npm install` to refresh |
| Push notifications don't appear | OneSignal not configured or blocked | Check `.env` OneSignal IDs, or disable with blank values |

---

## 10. Security Reminders for Developers

- **Never commit `.env`** — it is in `.gitignore` for a reason.
- **All `VITE_*` variables are public** — they are bundled into the client JS. Do not put secrets there.
- **The smart contract is the only security boundary** — client-side rate limiting, streaks, etc. are cosmetic and trivially bypassable.
- **Run `npm audit`** before deploying to check for known vulnerabilities.
- **Keep branch protection on** — see [BRANCH_PROTECTION.md](./BRANCH_PROTECTION.md).

---

## 11. Where to Go Next

| Goal | File |
|------|------|
| Deploy to production | [DEPLOYMENT.md](../DEPLOYMENT.md) |
| Understand the smart contract | [SCRYPTO_GUIDE.md](./SCRYPTO_GUIDE.md) |
| Security posture | [security-audit.md](./security-audit.md) |
| Architecture decisions | [backend-architecture-audit.md](./backend-architecture-audit.md) |
| Design system & theming | [design-system.md](./design-system.md) |
| UX research & fixes | [ux-audit.md](./ux-audit.md) |
| CI / branch protection | [BRANCH_PROTECTION.md](./BRANCH_PROTECTION.md) |
