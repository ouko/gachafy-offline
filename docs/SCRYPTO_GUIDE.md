# Scrypto Smart Contract Guide

Everything you need to build, test, deploy, and interact with the `GachaMinter` contract.

> **Scrypto version:** 1.3.1  
> **Network:** Babylon (Radix DLT)  
> **Blueprint:** `GachaMinter`

---

## 1. What the Contract Does

`GachaMinter` is a pay-to-mint badge factory:

1. User sends XRD payment
2. Contract verifies payment ≥ tier price
3. Contract mints a soulbound NFT badge (non-burnable)
4. Contract emits a `BadgeMinted` event for off-chain indexing
5. Admin can withdraw XRD, update tiers, or pause minting

### Key Properties

| Feature | Implementation |
|---------|---------------|
| **Soulbound** | `burn_roles: deny_all` — badges can never be destroyed |
| **Pause switch** | `enabled: bool` — admin can freeze minting instantly |
| **Payment validation** | `assert!(payment.amount() >= config.price)` — prevents underpay |
| **Admin control** | Single admin badge (supply = 2), required for all privileged ops |
| **Events** | `BadgeMinted`, `TierUpdated`, `XrdWithdrawn`, `EnabledChanged` |

---

## 2. Prerequisites

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add WebAssembly target (required for Scrypto)
rustup target add wasm32-unknown-unknown

# Install the Scrypto toolchain
cargo install scrypto-cli

# Verify
cargo check --version
```

---

## 3. Build & Test

```bash
cd scrypto/gacha

# Type check
cargo check

# Build WASM (for deployment)
cargo build --target wasm32-unknown-unknown --release

# The compiled artifacts land in:
# target/wasm32-unknown-unknown/release/gacha.wasm
# target/wasm32-unknown-unknown/release/gacha.rpd
```

---

## 4. Deploy (Stokenet)

### 4.1 Get XRD for gas

You need stokenet XRD to pay transaction fees:
- [Stokenet Faucet](https://stokenet-faucet.radixdlt.com/)
- Or use the Radix Wallet's built-in faucet

### 4.2 Deploy the package

Use the [Radix Dashboard](https://stokenet-dashboard.radixdlt.com/) or `resim` / `scrypto` CLI:

```bash
# Using the Radix Developer Console (recommended for beginners):
# 1. Go to https://stokenet-dashboard.radixdlt.com/
# 2. Connect your wallet
# 3. Developer Console → Deploy Package
# 4. Upload gacha.wasm + gacha.rpd
# 5. Sign the transaction
# 6. Copy the Package Address
```

### 4.3 Instantiate the component

After deploying the package, you need to call `instantiate_gacha_minter` to create an actual component:

```bash
# Using the publish_manifest.rtm as a template
cat scrypto/gacha/publish_manifest.rtm
```

The manifest should:
1. Call `GachaMinter::instantiate_gacha_minter(xrd_address)`
2. Deposit the returned admin badge into your account
3. Deposit the returned component badge (if any)

**What you get back:**
- `Global<GachaMinter>` → **Component Address** (save this!)
- `FungibleBucket` → **Admin Badge** (save this! You need it to withdraw funds)

### 4.4 Update your frontend `.env`

```bash
VITE_GACHA_PACKAGE_ADDRESS=package_tdx_2_1...
VITE_GACHA_COMPONENT_ADDRESS=component_tdx_2_1...
```

Rebuild the frontend:
```bash
npm run build
```

---

## 5. Admin Operations

All admin operations require the **admin badge** returned at instantiation.

### 5.1 Withdraw XRD

```rust
// Manifest snippet
CALL_METHOD
  Address("<YOUR_ACCOUNT>")
  "create_proof_of_amount"
  Address("<ADMIN_BADGE_ADDRESS>")
  Decimal("1");

CALL_METHOD
  Address("<GACHA_COMPONENT_ADDRESS>")
  "withdraw_xrd"
  Decimal("100")
  Proof("admin_badge_proof");

CALL_METHOD
  Address("<YOUR_ACCOUNT>")
  "deposit_batch"
  Expression("ENTIRE_WORKTOP");
```

### 5.2 Update a tier

```rust
CALL_METHOD
  Address("<GACHA_COMPONENT_ADDRESS>")
  "update_tier"
  "epic"
  Decimal("30")
  1200u64
  "epic"
  Proof("admin_badge_proof");
```

### 5.3 Pause / resume minting

```rust
CALL_METHOD
  Address("<GACHA_COMPONENT_ADDRESS>")
  "set_enabled"
  false
  Proof("admin_badge_proof");
```

---

## 6. Event Indexing

The contract emits these events for every state change:

| Event | When | Fields |
|-------|------|--------|
| `BadgeMinted` | Every successful mint | `tier`, `rarity`, `sp`, `nonce`, `badge_id`, `recipient` |
| `TierUpdated` | Admin updates or adds a tier | `tier`, `price`, `sp`, `rarity`, `action` ("updated" / "added") |
| `XrdWithdrawn` | Admin withdraws XRD | `amount`, `remaining` |
| `EnabledChanged` | Admin toggles pause | `enabled` |

Subscribe via the [Radix Gateway API](https://docs.radixdlt.com/docs/gateway-api) using the component address as the emitter filter.

---

## 7. Contract Upgrade Policy

**This contract is immutable.** Once deployed, the code cannot be changed.  
If you need to fix a bug or add a feature, you must:

1. Deploy a new package
2. Instantiate a new component
3. Update `VITE_GACHA_PACKAGE_ADDRESS` and `VITE_GACHA_COMPONENT_ADDRESS` in the frontend
4. (Optional) Pause the old component to prevent further mints

Plan accordingly: test thoroughly on stokenet before mainnet deployment.

---

## 8. Security Checklist Before Mainnet

- [ ] Deployed and tested on stokenet
- [ ] Admin badge stored in a secure wallet (hardware wallet preferred)
- [ ] dApp definition registered with correct origin
- [ ] Events verified via Gateway API
- [ ] Pause switch tested (can freeze minting)
- [ ] Tier prices validated (no zero-price tiers)
- [ ] Frontend uses the exact mainnet addresses
- [ ] `npm audit` clean
- [ ] SRI hashes match current CDN scripts

---

## 9. File Reference

| File | Purpose |
|------|---------|
| `scrypto/gacha/src/lib.rs` | Contract source code |
| `scrypto/gacha/Cargo.toml` | Rust dependencies |
| `scrypto/gacha/tests/lib.rs` | Unit tests |
| `scrypto/gacha/publish_manifest.rtm` | Example deployment manifest |
| `src/lib/radix.ts` | Frontend service that calls the contract |
| `src/lib/radix-config.ts` | Contract addresses & network config |
