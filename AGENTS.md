# GachaFi Agent Guidelines

## Current stack

- React 18, TypeScript, Vite 7, React Router 7, Tailwind, npm.
- Radix DApp Toolkit 2.3 and validated Radix Gateway REST reads.
- Scrypto 1.3.1 contract in `scrypto/gacha`.
- Vitest and Testing Library tests in `src/**/*.test.ts*`.

The legacy React 17/Zustand app from the remote rewritten history is superseded. Do not restore its mock mint, fake governance, hardcoded leaderboard, PostHog, or simulated bridge behavior.

## Core rules

- The Scrypto contract is the economic security boundary. Browser validation/rate limits are UX only.
- Never add mock minting or fabricated chain statistics. Chain views need explicit loading, empty, error, and retry states.
- Submit a wallet transaction at most once per user action. Retry status/Gateway reads, never automatic wallet re-signing.
- Keep account-specific state scoped to the active wallet and cancel stale reads on account changes.
- All `VITE_` values are public. Never add private keys or server secrets to them.
- Sentry and OneSignal require configuration and explicit consent. Wallet connection must not request push permission.
- Preserve the existing fixed common/rare/epic badge economy unless a reviewed design changes it.

## UI and accessibility

- Keep game-first visuals and thumb-friendly primary actions.
- Use common gray, rare cyan/blue, and epic purple consistently. Custom tiers need a neutral fallback.
- NFT images need accessible alt text and a first-party fallback.
- Respect reduced motion and keep controls keyboard accessible.

## Verification

```bash
npm run check
npm run lint
npm test -- --run
npm run build
npm run check:bundle
npm audit --audit-level=high
cargo test --manifest-path scrypto/gacha/Cargo.toml
```

Use `scrypto build` before contract deployment to produce Wasm and RPD artifacts. On macOS, use Homebrew LLVM only for `CC_wasm32_unknown_unknown` when Apple Clang cannot emit Wasm; see `docs/SCRYPTO_GUIDE.md` for the full command.

Run production-preview or Docker health checks for deployment changes. Update current documentation when behavior, routes, configuration, contract interfaces, or launch status changes. Historical audits must remain clearly marked as historical.

## Git

Do not force-push or discard pre-existing workspace changes. Review remote divergence before merging and rerun verification on the final merged tree.
