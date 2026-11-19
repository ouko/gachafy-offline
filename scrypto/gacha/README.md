# GachaFi Scrypto Contract

Scrypto 1.3.1 blueprint for fixed-price GachaFi badge minting.

## Behavior

`GachaMinter` accepts exactly 8 XRD for common, 15 XRD for rare, or 25 XRD for epic. It mints an integer-ID non-fungible badge containing name, tier, rarity, SP, client nonce, mint epoch, first-party image URL, and description. Overpayment and underpayment both abort.

The contract emits `BadgeMinted`, `TierUpdated`, `XrdWithdrawn`, `EnabledChanged`, and `GachaMinterInitialized`. Privileged methods require a valid non-empty proof of the admin badge. Pause, maximum supply, tier management, withdrawal limits, and XRD withdrawal are supported.

Badges cannot be burned by resource rules, but they are transferable and therefore not soulbound. The component is immutable. The badge resource owner role remains admin-updatable; this is an explicit recovery-versus-immutability tradeoff.

## Build and test

```bash
rustup target add wasm32-unknown-unknown
cargo test
cargo build --target wasm32-unknown-unknown --release
```

On macOS with missing C++ headers:

```bash
SDK="$(xcrun --show-sdk-path)"
CC_wasm32_unknown_unknown=/usr/local/opt/llvm/bin/clang \
CXXFLAGS="-isysroot $SDK -I$SDK/usr/include/c++/v1" cargo test
```

If WebAssembly compilation reports no compatible target, install LLVM and set only `CC_wasm32_unknown_unknown` to Homebrew LLVM. Keep Apple Clang for host C++ code to avoid mixing incompatible header sets. CI also runs tests and the release Wasm build.

## Public interface

- `instantiate_gacha_minter(xrd_address)` returns the component and deployer admin badge.
- `mint_gacha_badge(payment, tier, nonce)` returns the minted NFT bucket.
- `get_tier_price`, `get_tier_config`, `get_collected_xrd`, `get_mint_counter`, `get_total_minted`, `get_badge_resource_address`, `is_enabled`, `get_max_supply`, `get_withdrawal_limit`, and `get_withdrawn_this_epoch` provide reads.
- `withdraw_xrd`, `update_tier`, `add_tier`, `set_enabled`, `set_max_supply`, and `set_withdrawal_limit` require admin proof.

## Deployment

Build the Wasm and package definition with the Scrypto toolchain, publish the package, then call `instantiate_gacha_minter` with the selected network's XRD resource. Deposit the returned admin badge into the operator account.

Record all three frontend values:

```bash
VITE_GACHA_PACKAGE_ADDRESS=package_...
VITE_GACHA_COMPONENT_ADDRESS=component_...
VITE_GACHA_BADGE_RESOURCE=resource_...
```

The current NFT data schema is not compatible with an older component. Deploy a new package/component rather than reusing an old address. Test exact payments, events, metadata reads, admin authorization, pause, and withdrawal behavior on Stokenet before Mainnet.

See [../../docs/SCRYPTO_GUIDE.md](../../docs/SCRYPTO_GUIDE.md) for manifests and operational checks.
