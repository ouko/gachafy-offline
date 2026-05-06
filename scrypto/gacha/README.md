# GachaFi Scrypto Contract

Scrypto v1.3.1 smart contract for the GachaFi mystery-box game.

## Architecture

| Element | Description |
|---------|-------------|
| `GachaMinter` | Main blueprint component. Holds XRD vault + badge resource manager. |
| `BadgeData` | Non-fungible data schema (name, tier, rarity, sp, nonce, epoch). |
| `TierConfig` | On-chain pricing & reward table. |
| `BadgeMinted` | Event emitted on every mint (indexer-friendly). |

## Public Methods

### `instantiate_gacha_minter(xrd_address: ResourceAddress)`
Returns `(component, admin_badge)`. Sets up default tiers (common=8 XRD, rare=15 XRD, epic=25 XRD).

### `mint_gacha_badge(payment: FungibleBucket, tier: String, nonce: u64)` → `NonFungibleBucket`
Validates payment `>=` tier price, deposits XRD, mints NFT badge with metadata, emits `BadgeMinted` event.

### Admin methods (require admin badge proof)
- `withdraw_xrd(amount: Decimal, admin_badge: Proof)` → `FungibleBucket`
- `update_tier(tier, price, sp, rarity, admin_badge)`
- `add_tier(tier, price, sp, rarity, admin_badge)`

### Read-only
- `get_tier_price(tier: String)` → `Decimal`
- `get_tier_config(tier: String)` → `TierConfig`
- `get_collected_xrd()` → `Decimal`
- `get_mint_counter()` → `u64`

## Build

```bash
cd scrypto/gacha
scrypto build
```

### macOS Note

Apple's default `clang` does not include the WebAssembly backend, which is required for compiling Scrypto contracts. If you see `No available targets are compatible with triple "wasm32-unknown-unknown"`, install LLVM via Homebrew and set the compiler path:

```bash
brew install llvm
export CC=/usr/local/opt/llvm/bin/clang
export CXX=/usr/local/opt/llvm/bin/clang++
scrypto build
```

## Test

```bash
scrypto test
```

> **Note:** First test run compiles the entire Radix Engine simulator (`scrypto-test` + `radix-engine` + `wasmi` + `wasm-opt`). This is a one-time cost of ~10–15 minutes depending on hardware. Subsequent runs are fast.

## Deploy

### 1. Build & publish (Stokenet)

```bash
scrypto build
resim publish .
```

Or via Radix Dashboard → Deploy Package.

### 2. Instantiate

```bash
resim call-function <package_address> GachaMinter instantiate_gacha_minter <xrd_address>
```

Save the returned **component address** and **admin badge address**.

### 3. Wire frontend

Add to `.env` / deployment environment:

```bash
VITE_GACHA_PACKAGE_ADDRESS=<package_address>
VITE_GACHA_COMPONENT_ADDRESS=<component_address>
```

Then set `GACHA_DEPLOYED = true` in `src/lib/radix-config.ts`.

## Frontend Transaction Manifest

```
CALL_METHOD
    Address("<user_account>")
    "withdraw"
    Address("<xrd_address>")
    Decimal("8")
;
TAKE_ALL_FROM_WORKTOP
    Address("<xrd_address>")
    Bucket("payment")
;
CALL_METHOD
    Address("<gacha_component>")
    "mint_gacha_badge"
    Bucket("payment")
    "common"
    12345u64
;
CALL_METHOD
    Address("<user_account>")
    "deposit_batch"
    Expression("ENTIRE_WORKTOP")
;
```

## Access Control

| Resource | Minter Role | Burner Role |
|----------|-------------|-------------|
| Admin Badge | n/a (fixed supply of 2) | n/a |
| Gacha Badge | Admin badge proof required | `deny_all` (soulbound) |

The component holds one admin badge in its vault to authorize minting. The deployer retains the second admin badge for withdrawals and tier management.
