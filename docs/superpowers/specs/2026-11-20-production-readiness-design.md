# GachaFi Production Readiness Design

**Date:** 2026-11-20
**Repository state:** Existing uncommitted security and contract work is preserved and reviewed as part of this change.

## Context and outcome

GachaFi is a client-only React/TypeScript dApp with a Scrypto `GachaMinter` contract. It already submits real wallet transactions; it does not contain the JavaScript store, governance screen, or hardcoded leaderboard described by the older fix brief. The production gap is the rest of the chain-backed loop: users cannot inspect their real NFTs, the reveal is derived from local tier constants rather than the minted NFT, and global statistics/creator earnings are placeholders.

The outcome is a deployable application whose displayed minted assets and statistics come from Radix, whose contract rejects ambiguous payments and consistently validates admin proofs, whose optional third-party processing requires consent, and whose documentation distinguishes verified code readiness from operator-controlled deployment and legal tasks.

## Chosen approach

Preserve the existing common/rare/epic fixed-price badge economy and current contract interface where practical. Extend it with display metadata and read methods rather than adopting the brief's incompatible random-loot/prize-pool economy. Do not add a backend, fake governance, or global player rankings.

Rejected alternatives:

1. **Replace the contract with the brief verbatim.** This would change tokenomics, introduce a new random-loot model, and invalidate the current UI and deployment manifests without a demonstrated need.
2. **Add a backend leaderboard and creator accounting service.** This would add custody, privacy, deployment, and operational scope. Global rankings remain absent until there is a real indexed data source.

## Contract design

- Require the exact configured XRD price so direct callers cannot accidentally donate overpayment.
- Validate admin proofs through one private helper used by every privileged method.
- Validate new configuration values, including positive withdrawal limits and non-empty tier/rarity labels.
- Store `image_url` and `description` in each badge's immutable NFT data. Use first-party assets with frontend fallbacks.
- Expose the badge resource address and total mint count through read-only methods.
- Preserve pause, supply cap, events, admin withdrawal limits, and immutable component behavior.
- Expand Scrypto tests for exact payment, pause, supply limits, metadata, admin authorization, and withdrawal validation.

Changing NFT data requires a new package/component deployment. Existing deployments are not claimed to be upgraded in place.

## Frontend chain-data design

Add a small, typed Gateway read layer with timeouts, bounded retries, response validation, and no silent conversion of failures into empty or zero chain data.

- Resolve a successful transaction to its emitted `BadgeMinted` event and then load the corresponding non-fungible data.
- The reveal screen displays the resolved NFT's name, rarity, SP, image, and transaction link. It offers retry and inventory navigation if Gateway indexing is delayed or fails; it never invents a loot item.
- Load the connected account's badge IDs and NFT data from the configured badge resource, following Gateway pagination and clearing stale inventory on account changes/disconnect.
- Add an inventory/collection route with loading, empty, error, and retry states. Calculate the connected user's SP from their actual NFT data and show total minted supply from the component.
- Replace the placeholder creator dashboard route with the real collection view; retain a redirect for old `/creator` links.
- Submit each mint at most once per user action. Retry read/status operations, not wallet signing, to avoid duplicate charges. A rejected signature is terminal; a submitted transaction remains recoverable by hash.

## Privacy and local-data design

- Load OneSignal only after explicit notification consent; initialize Sentry only after explicit error-reporting consent.
- Provide a privacy/settings view with independent consent controls, a plain-language privacy notice, local-data export, and local-data deletion.
- Local deletion clears GachaFi localStorage keys, the offline queue database, cached logs, and revokes local consent. It explains that blockchain records cannot be deleted and that third-party deletion requests are governed by the relevant provider.
- Do not request push permission automatically on wallet connection.
- Remove unconditional third-party script loading from the HTML shell.

## Production and operational design

- Add `VITE_GACHA_BADGE_RESOURCE` to the public configuration and CI build inputs. Contract/package/component/resource values remain public configuration, never secrets.
- Apply non-breaking dependency security updates and review upstream Radix transitive advisories separately. The build is not called audit-clean unless the actual audit exits successfully.
- Keep production source maps disabled and static assets self-hosted where already supported.
- Verify nginx headers without cross-origin isolation settings that block legitimate wallet or image flows.
- Ensure CI runs frontend tests, typecheck, lint, build, bundle checks, dependency audit, and Scrypto tests. Pin GitHub Actions to immutable commit SHAs.
- Keep deployment addresses out of committed environment files; operators supply real Stokenet/Mainnet values at build time.

## Error handling and accessibility

Every asynchronous view has an explicit loading, failure, empty, and success state. Errors use plain language and preserve transaction hashes for recovery. Interactive controls are keyboard accessible, have labels, and respect reduced-motion preferences. No error path claims a transaction failed merely because a read API is unavailable.

## Verification

- Frontend: unit/component tests for Gateway parsing, inventory account changes, reveal success/error/retry, consent gating, and the existing mint flow; then `npm run check`, `npm run lint`, `npm test -- --run`, `npm run build`, and `npm run check:bundle`.
- Contract: `cargo test`, release Wasm build, and Rust formatting/linting available through the installed toolchain.
- Security: `npm audit --audit-level=high` with any unavoidable upstream residual risk documented precisely.
- Deployment artifact: build and health-check the Docker image when Docker is available; otherwise verify the production preview and record the unverified container check.
- End-to-end: exercise the production build with a connected Stokenet wallet if a configured deployment is available. No Mainnet deployment, real payment, mobile-device test, external audit, signed processor agreement, or legal approval is claimed without evidence.

## Documentation

Update the README, architecture, Scrypto guide, deployment guides, environment template, security/privacy audit status, and production checklist to describe the code as delivered. Historical audits retain their findings but receive an explicit current-status addendum rather than presenting resolved issues as open. Document the exact deployment migration required by the NFT schema change.
