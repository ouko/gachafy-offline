# Scrypto Contract Guide

**Blueprint:** `GachaMinter`
**Scrypto:** 1.3.1
**Location:** `scrypto/gacha`

## Contract behavior

The contract is a fixed-price badge minter:

| Tier | Exact XRD payment | SP |
|---|---:|---:|
| common | 8 | 100 |
| rare | 15 | 350 |
| epic | 25 | 1000 |

Each badge stores its name, tier, rarity, SP, nonce, mint epoch, image URL, and description. The `BadgeMinted` event includes tier, rarity, SP, nonce, badge ID, and immutable transaction hash. It does not contain a spoofable recipient string.

Underpayment and overpayment abort. Admin methods validate a non-empty proof of the admin badge through one shared helper. Minting supports pause and a maximum-supply cap; withdrawals support an optional per-epoch limit.

Badges are non-burnable by resource rule but transferable, not soulbound. The component has `OwnerRole::None` and cannot be upgraded. The badge resource owner role is admin-updatable for recovery; operators must protect the admin badge accordingly.

## Build and test

Install the verified Rust toolchain, Wasm target, source component, and Scrypto tooling compatible with 1.3.1:

```bash
rustup toolchain install 1.93.1
rustup component add rust-src --toolchain 1.93.1
rustup target add wasm32-unknown-unknown --toolchain 1.93.1
cd scrypto/gacha
cargo test
scrypto build
```

`scrypto build` produces the Wasm and package-definition artifacts for deployment. A plain Cargo release build is also checked in CI:

```bash
cargo build --target wasm32-unknown-unknown --release
```

On macOS, if native dependencies cannot find C++ headers:

```bash
SDK="$(xcrun --show-sdk-path)"
CC_wasm32_unknown_unknown=/usr/local/opt/llvm/bin/clang \
CXXFLAGS="-isysroot $SDK -I$SDK/usr/include/c++/v1" cargo test
```

## Deploy to Stokenet

1. Build with `scrypto build`.
2. Use the Stokenet developer console to publish the Wasm and package definition.
3. Call the package function:

```text
GachaMinter::instantiate_gacha_minter(<network XRD resource address>)
```

4. Deposit the returned admin badge into the operator account.
5. Record the package address, component address, admin badge address, and badge resource address.
6. Verify `get_badge_resource_address` and `get_total_minted` against Gateway/component state.

Configure the frontend with all three public GachaFi addresses:

```bash
VITE_GACHA_PACKAGE_ADDRESS=package_tdx_2_...
VITE_GACHA_COMPONENT_ADDRESS=component_tdx_2_...
VITE_GACHA_BADGE_RESOURCE=resource_tdx_2_...
```

Rebuild after changing addresses. The current NFT schema requires a new package/component; never reuse an older deployment for this release.

## Mint manifest

The frontend constructs the equivalent of:

```text
CALL_METHOD
  Address("<USER_ACCOUNT>")
  "withdraw"
  Address("<XRD_RESOURCE>")
  Decimal("8");
TAKE_FROM_WORKTOP
  Address("<XRD_RESOURCE>")
  Decimal("8")
  Bucket("payment");
CALL_METHOD
  Address("<GACHA_COMPONENT>")
  "mint_gacha_badge"
  Bucket("payment")
  "common"
  <SECURE_NONCE>u64;
CALL_METHOD
  Address("<USER_ACCOUNT>")
  "deposit_batch"
  Expression("ENTIRE_WORKTOP");
```

The frontend then resolves the mint event through the Gateway and reads the badge NFT. It does not infer the result from the selected tier.

## Admin manifests

Create a proof from the operator account and move it from the auth zone into a named proof before the admin call:

```text
CALL_METHOD
  Address("<OPERATOR_ACCOUNT>")
  "create_proof_of_amount"
  Address("<ADMIN_BADGE_RESOURCE>")
  Decimal("1");
POP_FROM_AUTH_ZONE
  Proof("admin_proof");
CALL_METHOD
  Address("<GACHA_COMPONENT>")
  "set_enabled"
  false
  Proof("admin_proof");
```

For withdrawal:

```text
CALL_METHOD
  Address("<OPERATOR_ACCOUNT>")
  "create_proof_of_amount"
  Address("<ADMIN_BADGE_RESOURCE>")
  Decimal("1");
POP_FROM_AUTH_ZONE
  Proof("admin_proof");
CALL_METHOD
  Address("<GACHA_COMPONENT>")
  "withdraw_xrd"
  Decimal("1")
  Proof("admin_proof");
CALL_METHOD
  Address("<OPERATOR_ACCOUNT>")
  "deposit_batch"
  Expression("ENTIRE_WORKTOP");
```

`set_max_supply` accepts `Option<u64>`; `set_withdrawal_limit` accepts `Option<Decimal>` and rejects zero/negative limits. Tier updates/additions require positive price and SP plus non-empty labels.

## Events and reads

The frontend uses `BadgeMinted` for transaction-to-badge resolution. Collection reads current account vault IDs and NFT data with pagination. Global mint count comes from component `mint_counter - 1`; no player leaderboard or creator earnings are derived.

## Mainnet checklist

- [ ] Current tests, release build, and independent security review pass.
- [ ] Stokenet exact payments and rejected over/underpayments verified.
- [ ] NFT metadata and `BadgeMinted` resolution verified on the actual frontend.
- [ ] Pause, supply cap, invalid proofs, withdrawal limits, and withdrawal tested.
- [ ] Admin badge storage and backup reviewed.
- [ ] dApp definition and badge resource metadata reference the production origin/assets.
- [ ] New Mainnet package/component/resource addresses independently reviewed.
- [ ] Old component paused and migration communicated when replacing a deployment.
