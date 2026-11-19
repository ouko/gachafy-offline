# GachaFi Scrypto Smart Contract Security Audit

> **Historical review.** The May 2026 findings refer to an older contract. The current source removes recipient spoofing, requires exact payment, centralizes admin-proof checks, validates withdrawal limits, adds NFT display metadata/read methods, and expands tests. A fresh independent audit is still required before Mainnet.

**Auditor:** Blockchain Security Auditor (Radix DLT / Scrypto Specialist)  
**Contract:** `GachaMinter` Blueprint  
**Source:** `/Users/lukeouko/gachafy-offline/scrypto/gacha/src/lib.rs`  
**Framework:** Scrypto v1.3.1  
**Date:** 2026-05-06  
**Commit Scope:** `lib.rs`, `Cargo.toml`, `tests/lib.rs`, `src/lib/radix.ts`, `src/lib/radix-config.ts`

---

## Executive Summary

The `GachaMinter` contract is a straightforward NFT minting blueprint that exchanges XRD for tiered non-fungible "badge" NFTs. While the asset-oriented design of Scrypto eliminates many classes of traditional smart contract vulnerabilities (e.g., reentrancy, integer wrapping), several significant issues remain—ranging from **Critical** economic vulnerabilities to **High** severity event-integrity flaws and a **broken test suite**.

### Risk Rating: **HIGH**

The contract handles real XRD payments and emits events that off-chain infrastructure relies on for leaderboards and analytics. Two **Critical** findings allow free minting and complete event spoofing, respectively. Several **High** and **Medium** findings expose users to accidental overpayment, grant the admin sweeping unilateral powers, and leave the project with no test coverage for the vast majority of execution paths.

### Findings by Severity

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 3 |
| Medium | 4 |
| Low | 5 |
| Informational | 7 |

---

## Architecture Review

### Data Flow

```
┌─────────────────┐     withdraw XRD      ┌──────────────────┐
│  User Account   │ ─────────────────────>│  Worktop (XRD)   │
└─────────────────┘                       └──────────────────┘
                                                   │
                                                   │ TAKE_FROM_WORKTOP
                                                   ▼
                                          ┌──────────────────┐
                                          │ Bucket("xrd")    │
                                          └──────────────────┘
                                                   │
                          mint_gacha_badge()       │
                                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         GachaMinter Component                        │
│  ┌─────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │ xrd_vault   │  │ badge_resource_mgr  │  │ admin_badge_vault   │  │
│  │ (Fungible)  │  │ (NonFungible)       │  │ (Fungible, 1 badge) │  │
│  └─────────────┘  └─────────────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────────────┐                            │
│  │tier_configs │  │ mint_counter (u64)  │                            │
│  │ HashMap     │  │ enabled: bool       │                            │
│  └─────────────┘  └─────────────────────┘                            │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          │ mint_non_fungible(&badge_id, BadgeData{...})
                          ▼
                                          ┌──────────────────┐
                                          │  Badge NFT       │
                                          │  (returned)      │
                                          └──────────────────┘
                          │
                          │ emit BadgeMinted{ tier, rarity, sp, nonce,
                          │                 badge_id, recipient }
                          ▼
```

### Key State

| State Field | Type | Purpose |
|-------------|------|---------|
| `xrd_vault` | `FungibleVault` | Holds all XRD payments |
| `badge_resource_manager` | `NonFungibleResourceManager` | Mints badge NFTs |
| `tier_configs` | `HashMap<String, TierConfig>` | Price/SP per tier |
| `admin_badge_address` | `ResourceAddress` | Access-control reference |
| `admin_badge_vault` | `FungibleVault` | Holds the 1 admin badge used for `authorize_with_amount` |
| `mint_counter` | `u64` | Monotonic ID generator (starts at 1) |
| `enabled` | `bool` | Emergency pause switch |

### Authorization Model

- **Minting:** Open to anyone; no proof required.
- **Admin operations** (`withdraw_xrd`, `update_tier`, `add_tier`, `set_enabled`): Require a `Proof` whose `resource_address` matches `admin_badge_address`.
- **Badge minting authorization:** The component holds 1 admin badge in `admin_badge_vault`. It calls `authorize_with_amount(dec!(1), || { ... mint_non_fungible(...) })` to satisfy the resource manager's `mint_roles`.

---

## Detailed Findings

---

### C-001 — Negative or Zero Tier Price Allows Free Minting

**Severity:** Critical  
**Location:** `lib.rs:307-356` (`update_tier`, `add_tier`)  
**Category:** Payment Validation / Economic Attack

#### Description

Both `update_tier` and `add_tier` accept a `price: Decimal` parameter without validating that it is strictly positive. In Scrypto, `Decimal` can represent negative values. If an admin (or a compromised admin key) sets a tier price to `0` or a negative number, the check in `mint_gacha_badge`:

```rust
assert!(
    payment.amount() >= config.price,
    "Payment must be at least {} XRD for tier {}, received {}",
    config.price,
    tier,
    payment.amount()
);
```

...will pass for **any** non-negative payment amount, including zero. An attacker can then mint badges for free by supplying an empty or minimal XRD bucket.

#### Impact

- Complete economic bypass of the minting mechanism.
- Unlimited free NFTs, devaluing the collection and destroying any revenue model.

#### Proof of Concept

```rust
// Admin (or compromised admin) calls:
update_tier(
    "common".to_string(),
    dec!("-1"),   // negative price
    100u64,
    "common".to_string(),
    admin_badge_proof
);

// Any user can now mint for free:
let empty_bucket = BucketFactory::create_fungible_bucket(xrd, dec!("0"), ...);
mint_gacha_badge(empty_bucket, "common".to_string(), 1u64, "anyone".to_string());
// passes because 0 >= -1
```

#### Remediation

Add strict validation in both `update_tier` and `add_tier`:

```rust
pub fn update_tier(
    &mut self,
    tier: String,
    price: Decimal,
    sp: u64,
    rarity: String,
    admin_badge: Proof,
) {
    assert!(
        admin_badge.resource_address() == self.admin_badge_address,
        "Invalid admin badge"
    );
    assert!(price > Decimal::ZERO, "Price must be strictly positive");
    assert!(sp > 0, "SP must be strictly positive");
    assert!(!tier.is_empty(), "Tier id cannot be empty");
    assert!(!rarity.is_empty(), "Rarity cannot be empty");

    let exists = self.tier_configs.contains_key(&tier);
    self.tier_configs.insert(
        tier.clone(),
        TierConfig { price, sp, rarity: rarity.clone() },
    );
    Runtime::emit_event(TierUpdated {
        tier,
        price,
        sp,
        rarity,
        action: if exists { "updated".to_string() } else { "created".to_string() },
    });
}
```

Apply the same validation to `add_tier`, plus an explicit "already exists" guard (see H-003).

---

### C-002 — `recipient` in `BadgeMinted` Event is Fully Spoofable

**Severity:** Critical  
**Location:** `lib.rs:219-279` (`mint_gacha_badge`), `lib.rs:39-49` (`BadgeMinted` event)  
**Category:** Event Integrity / Off-Chain Deception

#### Description

The `BadgeMinted` event includes a `recipient: String` field that is **passed directly by the caller** with zero on-chain validation:

```rust
pub fn mint_gacha_badge(
    &mut self,
    payment: FungibleBucket,
    tier: String,
    nonce: u64,
    recipient: String,   // <── caller-controlled, arbitrary string
) -> NonFungibleBucket {
    ...
    Runtime::emit_event(BadgeMinted {
        tier,
        rarity: config.rarity,
        sp: config.sp,
        nonce,
        badge_id: badge_id.clone(),
        recipient,        // <── emitted exactly as provided
    });
```

The frontend (`radix.ts:229`) passes the user's account address, but a malicious actor can construct a custom transaction manifest that passes **any** address—or any arbitrary string—as `recipient`.

#### Impact

- Off-chain indexers, leaderboards, and reward-distribution logic that trusts `recipient` will attribute mints to the wrong accounts.
- A user could frame another user for a mint, or inflate another user's leaderboard score.
- If rewards are ever airdropped based on event logs, funds could be misdirected.

#### Proof of Concept

```
CALL_METHOD
  Address("account_rdx1...attacker")
  "withdraw"
  Address("resource_rdx1...xrd")
  Decimal("8");

TAKE_FROM_WORKTOP
  Address("resource_rdx1...xrd")
  Decimal("8")
  Bucket("payment");

CALL_METHOD
  Address("component_rdx1...gacha")
  "mint_gacha_badge"
  Bucket("payment")
  "common"
  1u64
  "account_rdx1...victim";   // <── spoofed recipient

CALL_METHOD
  Address("account_rdx1...attacker")
  "deposit_batch"
  Expression("ENTIRE_WORKTOP");
```

The emitted event will show `recipient: "account_rdx1...victim"`, while the attacker receives the NFT.

#### Remediation

**Option A (Recommended):** Replace the spoofable `recipient` string with the **transaction intent hash**, which is immutable and cryptographically bound to the caller:

```rust
Runtime::emit_event(BadgeMinted {
    tier,
    rarity: config.rarity,
    sp: config.sp,
    nonce,
    badge_id: badge_id.clone(),
    transaction_hash: Runtime::transaction_hash(),  // cannot be spoofed
});
```

Off-chain indexers should correlate mints by matching the transaction hash from the event to the transaction hash from the Gateway API, which reveals the true caller/account.

**Option B:** Remove `recipient` entirely and document that event consumers **must not** trust self-reported addresses. Indexers should look up the actual transaction signer via the Gateway API using the emitted `badge_id` and `nonce`.

**Option C:** If a self-reported address is absolutely required, add a large comment warning that the field is **untrusted** and must be cryptographically verified off-chain.

> **Note:** Scrypto v1.3.1 provides `Runtime::transaction_hash()`. If upgrading to a newer version, `Runtime::intent_hash()` is also available.

---

### H-001 — Overpayment Accepted Without Refund

**Severity:** High  
**Location:** `lib.rs:235-243`  
**Category:** Payment Validation / User Fund Loss

#### Description

The contract accepts `payment.amount() >= config.price` and deposits the **entire** bucket into the vault:

```rust
assert!(
    payment.amount() >= config.price,
    "Payment must be at least {} XRD for tier {}, received {}",
    config.price,
    tier,
    payment.amount()
);
self.xrd_vault.put(payment);
```

There is no refund of the overage. A user who accidentally sends 100 XRD for a common badge (priced at 8 XRD) loses 92 XRD permanently.

#### Impact

- Direct, irreversible financial loss for users who mistype amounts, use incorrect frontend state, or are served stale tier prices.
- The comment in the code frames this as an intentional "tip" feature, but there is no UX guard in the frontend to warn users.

#### Remediation

Require **exact** payment and return any overage to the caller:

```rust
pub fn mint_gacha_badge(
    &mut self,
    mut payment: FungibleBucket,
    tier: String,
    nonce: u64,
    recipient: String,
) -> (NonFungibleBucket, FungibleBucket) {
    assert!(self.enabled, "Minting is currently paused");

    let config = self
        .tier_configs
        .get(&tier)
        .expect("Invalid tier")
        .clone();

    assert!(
        payment.amount() == config.price,
        "Payment must be exactly {} XRD for tier {}, received {}",
        config.price,
        tier,
        payment.amount()
    );

    // Or, if over-tips are truly desired, enforce a reasonable maximum overage:
    // assert!(payment.amount() <= config.price * dec!("2"), "Overpayment exceeds 2x");
    // let change = payment.take(payment.amount() - config.price);
    // self.xrd_vault.put(payment);
    // ... return change alongside badge ...

    self.xrd_vault.put(payment);
    // ... mint logic ...
    // return (badge, change)  // if using the refund approach
}
```

> ⚠️ Changing the return type from `NonFungibleBucket` to `(NonFungibleBucket, FungibleBucket)` is a **breaking ABI change**. The frontend manifest and all callers must be updated to handle the second bucket.

---

### H-002 — Broken Test Suite (Tests Do Not Match Method Signature)

**Severity:** High  
**Location:** `tests/lib.rs:86-97`, `148-154`, `191-197`  
**Category:** Test Coverage / Quality Assurance

#### Description

The `mint_gacha_badge` method signature requires **four** arguments:

```rust
pub fn mint_gacha_badge(
    &mut self,
    payment: FungibleBucket,
    tier: String,
    nonce: u64,
    recipient: String,
) -> NonFungibleBucket
```

However, every test invocation passes only **three** arguments (omitting `recipient`):

```rust
env.call_method_typed::<_, _, Bucket>(
    component,
    "mint_gacha_badge",
    &(
        payment,
        "common".to_string(),
        42u64,          // <── missing 4th argument: recipient
    ),
)
```

This means the tests will **fail to compile** (type mismatch) or, if the framework is loosely typed, will **fail at runtime**.

#### Impact

- The project has **zero working tests** for its core minting logic.
- No regression protection for future changes.
- The absence of working tests strongly suggests the contract has never been executed in a test environment with the current signature.

#### Remediation

Update all test invocations to include the `recipient` parameter:

```rust
env.call_method_typed::<_, _, Bucket>(
    component,
    "mint_gacha_badge",
    &(
        payment,
        "common".to_string(),
        42u64,
        "account_tdx_2_1...".to_string(),
    ),
)
```

Additionally, add comprehensive tests for:
- Admin methods (`withdraw_xrd`, `update_tier`, `add_tier`, `set_enabled`)
- Invalid admin badge rejection
- Pause switch behavior
- Exact-payment enforcement (after H-001 is fixed)
- Event emission correctness
- Negative/zero price rejection (after C-001 is fixed)

---

### H-003 — `update_tier` and `add_tier` Are Semantically Identical and Misleading

**Severity:** High  
**Location:** `lib.rs:307-356`  
**Category:** State Consistency / Logic Error

#### Description

Both methods call `HashMap::insert`, which **overwrites** any existing entry. `update_tier` can silently create a brand-new tier, and `add_tier` can silently overwrite an existing one. The event's `action` field claims `"updated"` or `"added"`, but the actual storage behavior does not match the claim.

```rust
// update_tier called with a non-existent tier → creates it (event lies: says "updated")
// add_tier called with an existing tier → overwrites it (event lies: says "added")
```

#### Impact

- Off-chain indexers and UIs will show incorrect event history.
- An admin could accidentally destroy an existing tier configuration by calling `add_tier` with an existing key.
- An `update_tier` call on a typo'd tier name would create an unexpected new tier.

#### Remediation

Enforce semantic separation:

```rust
pub fn update_tier(
    &mut self,
    tier: String,
    price: Decimal,
    sp: u64,
    rarity: String,
    admin_badge: Proof,
) {
    assert!(
        admin_badge.resource_address() == self.admin_badge_address,
        "Invalid admin badge"
    );
    assert!(price > Decimal::ZERO, "Price must be positive");
    assert!(self.tier_configs.contains_key(&tier), "Tier does not exist; use add_tier to create it");

    self.tier_configs.insert(
        tier.clone(),
        TierConfig { price, sp, rarity: rarity.clone() },
    );
    Runtime::emit_event(TierUpdated {
        tier,
        price,
        sp,
        rarity,
        action: "updated".to_string(),
    });
}

pub fn add_tier(
    &mut self,
    tier: String,
    price: Decimal,
    sp: u64,
    rarity: String,
    admin_badge: Proof,
) {
    assert!(
        admin_badge.resource_address() == self.admin_badge_address,
        "Invalid admin badge"
    );
    assert!(price > Decimal::ZERO, "Price must be positive");
    assert!(!self.tier_configs.contains_key(&tier), "Tier already exists; use update_tier to modify it");

    self.tier_configs.insert(
        tier.clone(),
        TierConfig { price, sp, rarity: rarity.clone() },
    );
    Runtime::emit_event(TierUpdated {
        tier,
        price,
        sp,
        rarity,
        action: "added".to_string(),
    });
}
```

---

### M-001 — Admin Can Unilaterally Drain All Funds Without Safeguards

**Severity:** Medium  
**Location:** `lib.rs:286-297` (`withdraw_xrd`)  
**Category:** Access Control / Centralization

#### Description

A single admin badge holder can withdraw **100%** of the vault balance in a single transaction. There is no timelock, multisig, daily withdrawal limit, or two-step process.

```rust
pub fn withdraw_xrd(&mut self, amount: Decimal, admin_badge: Proof) -> FungibleBucket {
    assert!(
        admin_badge.resource_address() == self.admin_badge_address,
        "Invalid admin badge"
    );
    let bucket = self.xrd_vault.take(amount);  // can drain entire vault
    Runtime::emit_event(XrdWithdrawn { amount, remaining: self.xrd_vault.amount() });
    bucket
}
```

#### Impact

- Key compromise or malicious admin = instant total loss of all contract revenue.
- No recourse for users.

#### Remediation

Introduce a **withdrawal limit** or a **multisig/timelock** pattern. A simple and effective improvement is a per-epoch withdrawal cap:

```rust
struct GachaMinter {
    // ... existing fields ...
    withdrawal_limit: Decimal,        // e.g., 500 XRD per epoch
    withdrawn_this_epoch: Decimal,
    current_epoch: u64,
}

pub fn withdraw_xrd(&mut self, amount: Decimal, admin_badge: Proof) -> FungibleBucket {
    assert!(admin_badge.resource_address() == self.admin_badge_address, "Invalid admin badge");
    assert!(amount > Decimal::ZERO, "Withdrawal amount must be positive");

    let epoch = Runtime::current_epoch().number();
    if epoch != self.current_epoch {
        self.current_epoch = epoch;
        self.withdrawn_this_epoch = Decimal::ZERO;
    }

    assert!(
        self.withdrawn_this_epoch + amount <= self.withdrawal_limit,
        "Withdrawal exceeds epoch limit"
    );

    let bucket = self.xrd_vault.take(amount);
    self.withdrawn_this_epoch += amount;

    Runtime::emit_event(XrdWithdrawn {
        amount,
        remaining: self.xrd_vault.amount(),
    });
    bucket
}
```

For a production contract handling significant value, consider a **separate treasury component** with multisig role requirements.

---

### M-002 — Badge Resource `OwnerRole` is Updatable, Allowing Admin to Alter NFT Properties Post-Mint

**Severity:** Medium  
**Location:** `lib.rs:140-157`  
**Category:** Resource Management / Centralization

#### Description

The badge resource is created with:

```rust
let badge_resource_manager = ResourceBuilder::new_integer_non_fungible::<BadgeData>(
    OwnerRole::Updatable(rule!(require(admin_badge_address))),
)
...
.burn_roles(burn_roles! {
    burner => rule!(deny_all);
    burner_updater => rule!(deny_all);
})
.create_with_no_initial_supply();
```

Because the `OwnerRole` is **Updatable**, the admin can:
1. Update the `burn_roles` to allow burning (despite current `deny_all`).
2. Update `non_fungible_data_update_roles` to allow modifying `#[mutable]` fields (e.g., `name`) on existing NFTs.
3. Update metadata or other resource configuration.

#### Impact

- Admin could burn user badges (after changing roles).
- Admin could rename badges, potentially erasing rarity signaling or scamming secondary markets.
- Users have no guarantee that the "soulbound" nature of badges is permanent.

#### Remediation

Consider making the badge resource ownership immutable if the project intends for badges to be permanently non-burnable and non-modifiable:

```rust
let badge_resource_manager = ResourceBuilder::new_integer_non_fungible::<BadgeData>(
    OwnerRole::Fixed(rule!(require(admin_badge_address))), // or OwnerRole::None
)
...
.burn_roles(burn_roles! {
    burner => rule!(deny_all);
    burner_updater => rule!(deny_all);
})
// Explicitly freeze all other roles if supported by Scrypto version:
// .freeze_roles(...)
.create_with_no_initial_supply();
```

> ⚠️ Changing to `OwnerRole::Fixed` means the owner role can **never** be changed again—not even to recover from a lost admin badge. This is a trade-off between immutability and operability.

---

### M-003 — Withdrawal Amount Not Explicitly Validated

**Severity:** Medium  
**Location:** `lib.rs:286-297`  
**Category:** Input Validation

#### Description

`withdraw_xrd` does not validate:
1. That `amount > 0`
2. That `amount <= self.xrd_vault.amount()`

While `FungibleVault::take()` will panic on over-withdrawal, the resulting error is a low-level vault underflow rather than a descriptive message. A zero withdrawal still emits an event, polluting the event log.

#### Remediation

```rust
pub fn withdraw_xrd(&mut self, amount: Decimal, admin_badge: Proof) -> FungibleBucket {
    assert!(
        admin_badge.resource_address() == self.admin_badge_address,
        "Invalid admin badge"
    );
    assert!(amount > Decimal::ZERO, "Withdrawal amount must be positive");
    assert!(
        amount <= self.xrd_vault.amount(),
        "Insufficient balance: requested {} but vault holds {}",
        amount,
        self.xrd_vault.amount()
    );

    let bucket = self.xrd_vault.take(amount);
    Runtime::emit_event(XrdWithdrawn {
        amount,
        remaining: self.xrd_vault.amount(),
    });
    bucket
}
```

---

### M-004 — Predictable Sequential Badge IDs Enable Front-Running and Gaming

**Severity:** Medium  
**Location:** `lib.rs:249-250`  
**Category:** Design Risk / MEV

#### Description

Badge IDs are assigned via a simple counter:

```rust
let badge_id = NonFungibleLocalId::integer(self.mint_counter);
self.mint_counter += 1;
```

This means the ID of the next badge is fully predictable. In a public ledger, a sophisticated actor can observe pending transactions and front-run specific IDs (e.g., "mythic" round numbers) or use this predictability to coordinate multi-account farming strategies.

#### Impact

- Users can game the system to acquire specific badge IDs.
- If IDs ever carry cultural or market value (e.g., #1, #1000, #6969), MEV bots will compete for them.
- Undermines fairness of the gacha mechanic.

#### Remediation

Use a non-predictable ID source. Options:

1. **Hash-based ID** (deterministic but unpredictable from outside):
   ```rust
   let badge_id = NonFungibleLocalId::integer(
       hash(Runtime::transaction_hash()).lower_64_bits()
   );
   ```

2. **UUID-style random ID** (if Scrypto exposes secure randomness—check network support; currently limited on Radix).

3. **Accept the predictability** but document it clearly so users understand IDs are first-come-first-served.

Option 1 is generally the best compromise for deterministic on-chain behavior without external randomness.

---

### L-001 — Missing Contract Instantiation Event

**Severity:** Low  
**Location:** `lib.rs:123-204`  
**Category:** Observability

#### Description

No event is emitted when the component is instantiated. Off-chain indexers have no on-chain signal for when the contract goes live, what the initial tier prices were, or who received the deployer admin badge.

#### Remediation

Emit an initialization event:

```rust
#[derive(ScryptoSbor)]
pub struct GachaMinterInitialized {
    pub component_address: ComponentAddress,
    pub admin_badge_address: ResourceAddress,
    pub badge_resource_address: ResourceAddress,
    pub initial_tiers: Vec<(String, TierConfig)>,
}

impl ScryptoEvent for GachaMinterInitialized {
    const EVENT_NAME: &'static str = "GachaMinterInitialized";
}
```

Emit it at the end of `instantiate_gacha_minter`.

---

### L-002 — `set_enabled` Emits Event Even When State is Unchanged

**Severity:** Low  
**Location:** `lib.rs:389-396`  
**Category:** Event Quality

#### Description

```rust
pub fn set_enabled(&mut self, enabled: bool, admin_badge: Proof) {
    assert!(admin_badge.resource_address() == self.admin_badge_address, "Invalid admin badge");
    self.enabled = enabled;
    Runtime::emit_event(EnabledChanged { enabled });
}
```

Calling `set_enabled(true)` when `self.enabled` is already `true` still emits an event, creating noise.

#### Remediation

```rust
pub fn set_enabled(&mut self, enabled: bool, admin_badge: Proof) {
    assert!(admin_badge.resource_address() == self.admin_badge_address, "Invalid admin badge");
    if self.enabled == enabled {
        return; // no-op, no event
    }
    self.enabled = enabled;
    Runtime::emit_event(EnabledChanged { enabled });
}
```

---

### L-003 — No String Length Validation on Dynamic Fields

**Severity:** Low  
**Location:** `lib.rs:219-279`, `lib.rs:307-356`  
**Category:** Data Validation / Storage

#### Description

`tier`, `rarity`, `recipient`, and the generated `name` have no maximum length constraints. An admin could set a tier name to a multi-megabyte string, or a user could pass a `recipient` string of unlimited length. This bloats NFT metadata and event payloads.

#### Remediation

Add length guards:

```rust
assert!(tier.len() <= 32, "Tier id too long");
assert!(rarity.len() <= 32, "Rarity label too long");
assert!(recipient.len() <= 128, "Recipient string too long");
```

Apply similar limits in `TierConfig` and `BadgeData` construction.

---

### L-004 — `tier` and `rarity` Can Diverge, Causing Confusion

**Severity:** Low  
**Location:** `lib.rs:307-356`  
**Category:** Data Integrity

#### Description

`tier` is the HashMap key, while `rarity` is a separate free-form string in `TierConfig`. An admin can configure:

```rust
TierConfig {
    price: dec!("8"),
    sp: 100,
    rarity: "epic".to_string(),
}
```

...under the `"common"` tier key. The emitted event would show `tier: "common"`, `rarity: "epic"`, which is confusing for users and indexers.

#### Remediation

Either:
1. Derive `rarity` automatically from the tier key (if they are always 1:1), or
2. Add validation that `rarity` matches `tier` for known tiers, or
3. Document clearly that `rarity` is an independent display label.

---

### L-005 — No Maximum Supply Cap on Badges

**Severity:** Low  
**Location:** `lib.rs:249-250`  
**Category:** Economic Design

#### Description

There is no `max_supply` enforcement. Badges can be minted indefinitely. While `mint_counter` is a `u64` (practically unlimited), and `overflow-checks = true` means a panic rather than wrap on overflow, there is no business-level cap.

#### Remediation

If a limited collection is desired, add a supply cap:

```rust
struct GachaMinter {
    // ...
    max_supply: Option<u64>,
}

// In mint_gacha_badge:
if let Some(max) = self.max_supply {
    assert!(self.mint_counter <= max, "Maximum supply reached");
}
```

---

### I-001 — No Upgrade Path (Component is Immutable)

**Severity:** Informational  
**Location:** `lib.rs:199-201`  
**Category:** Upgradeability / Lifecycle

#### Description

The component is globalized with `OwnerRole::None`:

```rust
.instantiate()
.prepare_to_globalize(OwnerRole::None)
.globalize();
```

This means the component **cannot be upgraded**—ever. Any bug discovered post-deployment (including the Critical and High findings in this audit) cannot be patched in-place. A new package must be deployed, and all users must interact with the new component address.

#### Implications

- Perfect immutability = maximum trustlessness (users know rules can't change).
- But also zero flexibility. If a bug is found, funds could be locked or exploited with no mitigation path.
- The badge resource manager IS updatable (`OwnerRole::Updatable`), so the NFT metadata/rules can change, but the component logic cannot.

#### Remediation

This is an architectural choice. Document the trade-off explicitly in the README and AGENTS.md:

> "The `GachaMinter` component is intentionally non-upgradeable (`OwnerRole::None`). Any critical bug will require a full contract redeployment and user migration. Ensure exhaustive testing and formal verification before mainnet deployment."

If upgradeability is desired, consider `OwnerRole::Updatable(rule!(require(admin_badge_address)))` with a timelocked governance component, or a proxy pattern.

---

### I-002 — `nonce` Is Client-Generated and Not Deduplicated

**Severity:** Informational  
**Location:** `lib.rs:219-279`  
**Category:** Design Consideration

#### Description

The `nonce` is generated client-side and stored in the NFT. There is no on-chain uniqueness check. Two different transactions can use the same nonce without error.

#### Implications

- Off-chain correlation by nonce alone is unreliable.
- This is acceptable if nonce is treated as a hint rather than a unique key.

#### Remediation

Document that `nonce` is a **hint** for correlation, not a unique identifier. Off-chain systems should use `(transaction_hash, badge_id)` as the primary key.

---

### I-003 — Comment Claims "Exactly the Tier Price" but Code Accepts `>=`

**Severity:** Informational  
**Location:** `lib.rs:206-218` (doc comment), `lib.rs:237-243` (code)  
**Category:** Documentation Accuracy

#### Description

The doc comment says:

```rust
/// * `payment` — Fungible bucket containing exactly the tier price in XRD.
```

But the assertion is `>=`.

#### Remediation

Update the comment to match the code, or fix the code to match the comment (see H-001).

---

### I-004 — `authorize_with_amount(dec!(1))` Uses Decimal Literal for Non-Divisible Badge

**Severity:** Informational  
**Location:** `lib.rs:254`  
**Category:** Code Clarity

#### Description

```rust
self.admin_badge_vault.authorize_with_amount(dec!(1), || { ... })
```

The admin badge has `DIVISIBILITY_NONE`, meaning it is indivisible. Using `dec!(1)` works correctly (it equals one whole unit), but `dec!("1")` is semantically clearer for non-divisible resources.

#### Remediation

```rust
self.admin_badge_vault.authorize_with_amount(dec!("1"), || { ... })
```

---

### I-005 — Single Admin Badge with No Recovery Path

**Severity:** Informational  
**Location:** `lib.rs:125-134`, `lib.rs:187-188`  
**Category:** Operational Risk

#### Description

Only 2 admin badges are minted: 1 stays in the component, 1 goes to the deployer. If the deployer loses their badge, there is no mechanism to mint a replacement or transfer admin rights.

#### Remediation

Consider minting a small multi-sig-safe supply (e.g., 3 or 5) and distributing to different secure accounts/hardware wallets. Alternatively, implement a "recovery admin" role with a timelock.

---

### I-006 — Tests Disable Auth Module for Unrestricted Method

**Severity:** Informational  
**Location:** `tests/lib.rs:87`, `148`, `191`  
**Category:** Test Quality

#### Description

All minting tests wrap the call in `with_auth_module_disabled`, but `mint_gacha_badge` has no auth requirements. This is unnecessary and misleading—it implies there is auth when there is none.

#### Remediation

Remove `with_auth_module_disabled` from minting tests. Add it (or proper proof passing) to admin-method tests once those are written.

---

### I-007 — Frontend `amount` is JavaScript `number`, Not `Decimal`

**Severity:** Informational  
**Location:** `src/lib/radix.ts:216`  
**Category:** Frontend / Type Safety

#### Description

```typescript
Decimal("${amount}")
```

`amount` is a JavaScript `number`. For the hardcoded integer prices (8, 15, 25) this is safe. However, if fractional prices are ever introduced, floating-point errors (e.g., `0.1 + 0.2`) could produce invalid manifest values.

#### Remediation

Use string-based amounts throughout the frontend:

```typescript
const amountStr = "8"; // from a config object, never from number arithmetic
Decimal("${amountStr}")
```

Or use a BigDecimal library and `.toString()` before interpolation.

---

## Security Controls Assessment

| Control | Status | Notes |
|---------|--------|-------|
| **Access Control (Admin)** | ⚠️ Partial | Proof address checked, but no amount validation (acceptable for `DIVISIBILITY_NONE`). Single admin = key-compromise risk. |
| **Access Control (Mint)** | ✅ Open | Intentionally permissionless. Correctly scoped. |
| **Payment Validation (Resource)** | ✅ Implicit | `xrd_vault.put(payment)` implicitly rejects non-XRD buckets via native vault type checking. |
| **Payment Validation (Amount)** | ❌ Weak | `>=` allows overpayment without refund (H-001). No positive-price enforcement on tier config (C-001). |
| **Pause Switch** | ✅ Functional | `enabled` flag correctly gates `mint_gacha_badge`. Event emitted on change. |
| **Event Integrity** | ❌ Broken | `recipient` is fully spoofable (C-002). `TierUpdated` action can lie (H-003). |
| **Reentrancy Resistance** | ✅ Strong | Scrypto's asset model prevents traditional reentrancy; no callbacks to untrusted code. |
| **Resource Safety** | ✅ Strong | Buckets and vaults are native types; no manual balance tracking. |
| **Overflow Protection** | ✅ Enabled | `overflow-checks = true` in release profile. `u64` counter is practically unexhaustible. |
| **Upgrade Path** | ❌ None | Component is immutable. Documented as I-001. |
| **Test Coverage** | ❌ Broken | Tests do not compile/run against current method signature (H-002). |
| **Supply Cap** | ❌ Missing | Unlimited minting possible (L-005). |
| **Withdrawal Safeguards** | ❌ Missing | No limit, timelock, or cap on admin withdrawals (M-001). |

---

## Action Items (Prioritized Checklist)

### Before Mainnet Deployment (Blockers)

- [ ] **C-001** — Add `price > 0` and `sp > 0` validation to `update_tier` and `add_tier`.
- [ ] **C-002** — Replace spoofable `recipient: String` in `BadgeMinted` with `Runtime::transaction_hash()` or remove it and document off-chain correlation requirements.
- [ ] **H-001** — Decide on exact-payment vs. capped-overpayment policy; implement exact payment or refund overage.
- [ ] **H-002** — Fix test suite compilation errors (add `recipient` argument); expand tests to cover admin ops, events, pause switch, and invalid inputs.
- [ ] **H-003** — Enforce semantic separation between `update_tier` (must exist) and `add_tier` (must not exist).

### High Priority (Post-Deployment or Pre-Audit Fix)

- [ ] **M-001** — Implement withdrawal limit per epoch or a multisig treasury component.
- [ ] **M-002** — Evaluate whether badge resource `OwnerRole` should be `Fixed` or `None` to guarantee immutability of burn/data-update policies.
- [ ] **M-003** — Add explicit `amount > 0` and `amount <= vault.amount()` checks in `withdraw_xrd`.
- [ ] **M-004** — Evaluate badge ID randomization to mitigate front-running (if IDs carry value).

### Medium Priority (Hardening)

- [ ] **L-001** — Emit `GachaMinterInitialized` event on instantiation.
- [ ] **L-002** — Skip `EnabledChanged` event when state is unchanged.
- [ ] **L-003** — Add max-length assertions on all string inputs.
- [ ] **L-004** — Tie `rarity` to `tier` or validate consistency.
- [ ] **L-005** — Add optional `max_supply` enforcement if collection scarcity is desired.

### Low Priority / Documentation

- [ ] **I-001** — Document the immutable component upgrade policy and its implications.
- [ ] **I-002** — Document that `nonce` is a correlation hint, not a unique key.
- [ ] **I-003** — Fix doc comment to match payment logic.
- [ ] **I-004** — Use `dec!("1")` instead of `dec!(1)` for non-divisible auth amount.
- [ ] **I-005** — Consider distributing multiple admin badges for operational resilience.
- [ ] **I-006** — Remove unnecessary `with_auth_module_disabled` in tests.
- [ ] **I-007** — Use string-typed amounts in the frontend manifest builder.

---

## Appendix A: Corrected `mint_gacha_badge` (Reference Implementation)

Below is a reference implementation addressing C-001, C-002, H-001, and M-003 patterns:

```rust
pub fn mint_gacha_badge(
    &mut self,
    mut payment: FungibleBucket,
    tier: String,
    nonce: u64,
) -> (NonFungibleBucket, FungibleBucket) {
    assert!(self.enabled, "Minting is currently paused");
    assert!(tier.len() <= 32, "Tier id too long");

    let config = self
        .tier_configs
        .get(&tier)
        .expect("Invalid tier")
        .clone();

    // Exact payment required
    assert!(
        payment.amount() == config.price,
        "Payment must be exactly {} XRD for tier {}, received {}",
        config.price,
        tier,
        payment.amount()
    );

    self.xrd_vault.put(payment.take(config.price));

    let badge_id = NonFungibleLocalId::integer(self.mint_counter);
    self.mint_counter += 1;

    let badge_name = format!("{} Badge #{}", config.rarity.to_uppercase(), badge_id);

    let badge = self.admin_badge_vault.authorize_with_amount(dec!("1"), || {
        self.badge_resource_manager.mint_non_fungible(
            &badge_id,
            BadgeData {
                name: badge_name,
                tier: tier.clone(),
                rarity: config.rarity.clone(),
                sp: config.sp,
                nonce,
                minted_at_epoch: Runtime::current_epoch().number(),
            },
        )
    });

    Runtime::emit_event(BadgeMinted {
        tier,
        rarity: config.rarity,
        sp: config.sp,
        nonce,
        badge_id: badge_id.clone(),
        transaction_hash: Runtime::transaction_hash(),
    });

    // Return badge and any change (zero in exact-payment mode)
    (badge, payment)
}
```

> ⚠️ Remember that changing the return type is a **breaking ABI change**. Update the frontend manifest to handle both returned buckets:
> ```
> CALL_METHOD
>   Address("...gacha...")
>   "mint_gacha_badge"
>   Bucket("xrd_bucket")
>   "common"
>   1u64;
> ```
> And use `deposit_batch` to collect both the NFT and any change from the worktop.

---

*End of Audit Report*
