use scrypto::prelude::*;

// ----------------------------------------------------------------------------
// Data Structures
// ----------------------------------------------------------------------------

/// Metadata stored inside each minted NFT badge.
#[derive(ScryptoSbor, NonFungibleData)]
pub struct BadgeData {
    /// Human-readable name, e.g. "Epic Badge #42"
    #[mutable]
    pub name: String,
    /// Tier id: "common", "rare", or "epic"
    pub tier: String,
    /// Display rarity: "common", "rare", or "epic"
    pub rarity: String,
    /// SP (skill points) awarded for this badge
    pub sp: u64,
    /// Nonce from the transaction manifest (for off-chain correlation)
    pub nonce: u64,
    /// Ledger epoch at mint time
    pub minted_at_epoch: u64,
    /// First-party image displayed by wallets and the GachaFi collection.
    pub image_url: String,
    /// Human-readable description stored with the badge.
    pub description: String,
}

/// On-chain configuration for a single tier.
#[derive(ScryptoSbor, Clone)]
pub struct TierConfig {
    /// Price in XRD
    pub price: Decimal,
    /// SP reward
    pub sp: u64,
    /// Human-readable rarity label
    pub rarity: String,
}

/// Emitted every time a badge is successfully minted.
/// Off-chain indexers can subscribe to this event to update leaderboards,
/// trigger push notifications, etc.
///
/// SECURITY: `transaction_hash` is immutable and cryptographically bound to
/// the caller. It cannot be spoofed, unlike a self-reported address string.
/// Off-chain consumers should correlate via the Gateway API to discover the
/// true transaction signer.
#[derive(ScryptoSbor)]
pub struct BadgeMinted {
    pub tier: String,
    pub rarity: String,
    pub sp: u64,
    pub nonce: u64,
    pub badge_id: NonFungibleLocalId,
    /// Immutable transaction hash for off-chain correlation.
    /// Use the Gateway API to look up the actual caller from this hash.
    pub transaction_hash: Hash,
}

impl ScryptoEvent for BadgeMinted {
    const EVENT_NAME: &'static str = "BadgeMinted";
}

/// Emitted when an admin updates or adds a tier.
#[derive(ScryptoSbor)]
pub struct TierUpdated {
    pub tier: String,
    pub price: Decimal,
    pub sp: u64,
    pub rarity: String,
    pub action: String, // "updated" or "added"
}

impl ScryptoEvent for TierUpdated {
    const EVENT_NAME: &'static str = "TierUpdated";
}

/// Emitted when an admin withdraws XRD from the vault.
#[derive(ScryptoSbor)]
pub struct XrdWithdrawn {
    pub amount: Decimal,
    pub remaining: Decimal,
}

impl ScryptoEvent for XrdWithdrawn {
    const EVENT_NAME: &'static str = "XrdWithdrawn";
}

/// Emitted when an admin toggles the enabled state.
#[derive(ScryptoSbor)]
pub struct EnabledChanged {
    pub enabled: bool,
}

impl ScryptoEvent for EnabledChanged {
    const EVENT_NAME: &'static str = "EnabledChanged";
}

/// Emitted once when the component is instantiated.
#[derive(ScryptoSbor)]
pub struct GachaMinterInitialized {
    pub admin_badge_address: ResourceAddress,
    pub badge_resource_address: ResourceAddress,
    pub initial_tiers: Vec<(String, TierConfig)>,
}

impl ScryptoEvent for GachaMinterInitialized {
    const EVENT_NAME: &'static str = "GachaMinterInitialized";
}

// ----------------------------------------------------------------------------
// Blueprint
// ----------------------------------------------------------------------------

#[blueprint]
#[events(
    BadgeMinted,
    TierUpdated,
    XrdWithdrawn,
    EnabledChanged,
    GachaMinterInitialized
)]
mod gacha_minter {
    struct GachaMinter {
        /// Vault holding collected XRD payments.
        xrd_vault: FungibleVault,
        /// Resource manager for minting non-fungible badge NFTs.
        badge_resource_manager: NonFungibleResourceManager,
        /// Price & reward config per tier.
        tier_configs: HashMap<String, TierConfig>,
        /// Resource address of the admin badge (used for access control).
        admin_badge_address: ResourceAddress,
        /// Vault holding the admin badge(s) for on-chain authorization.
        admin_badge_vault: FungibleVault,
        /// Monotonic counter for badge IDs.
        mint_counter: u64,
        /// Emergency pause switch. When false, minting is disabled.
        enabled: bool,
        /// Maximum number of badges that can ever be minted (None = unlimited).
        max_supply: Option<u64>,
        /// Per-epoch withdrawal limit for admin operations (None = unlimited).
        withdrawal_limit: Option<Decimal>,
        /// Amount withdrawn in the current epoch.
        withdrawn_this_epoch: Decimal,
        /// Epoch number of the last withdrawal (for epoch rollover tracking).
        last_withdrawal_epoch: u64,
    }

    impl GachaMinter {
        /// Instantiate a new GachaMinter component with default tier configs.
        ///
        /// # Arguments
        /// * `xrd_address` — The network's XRD resource address (varies by network).
        ///
        /// # Returns
        /// * `Global<GachaMinter>` — The globalized component.
        /// * `FungibleBucket` — A single admin badge for the deployer.
        pub fn instantiate_gacha_minter(
            xrd_address: ResourceAddress,
        ) -> (Global<GachaMinter>, FungibleBucket) {
            // Create a single admin badge for the deployer.
            let mut admin_badge: FungibleBucket = ResourceBuilder::new_fungible(OwnerRole::None)
                .divisibility(DIVISIBILITY_NONE)
                .metadata(metadata! {
                    init {
                        "name" => "GachaFi Admin Badge", locked;
                        "description" => "Grants admin rights to the GachaMinter component.", locked;
                        "symbol" => "GFADMIN", locked;
                    }
                })
                .mint_initial_supply(2);

            let admin_badge_address = admin_badge.resource_address();

            // Create the non-fungible badge resource with no initial supply.
            // Only the component itself (by proving admin badge ownership) can mint.
            //
            // SECURITY NOTE: OwnerRole is Updatable so the admin can recover from
            // a lost badge scenario or fix metadata. OwnerRole::Fixed would make
            // resource rules immutable, but lost admin badges would be unrecoverable.
            let badge_resource_manager = ResourceBuilder::new_integer_non_fungible::<BadgeData>(
                OwnerRole::Updatable(rule!(require(admin_badge_address))),
            )
            .metadata(metadata! {
                init {
                    "name" => "GachaFi Badge", locked;
                    "description" => "Proof of opening a GachaFi mystery box.", locked;
                    "icon_url" => "https://gachafi.app/icon-512.png", locked;
                }
            })
            .mint_roles(mint_roles! {
                minter => rule!(require(admin_badge_address));
                minter_updater => rule!(deny_all);
            })
            .burn_roles(burn_roles! {
                burner => rule!(deny_all);
                burner_updater => rule!(deny_all);
            })
            .create_with_no_initial_supply();

            // Default tier configs (matching frontend prices).
            let mut tier_configs = HashMap::new();
            tier_configs.insert(
                "common".to_string(),
                TierConfig {
                    price: dec!("8"),
                    sp: 100,
                    rarity: "common".to_string(),
                },
            );
            tier_configs.insert(
                "rare".to_string(),
                TierConfig {
                    price: dec!("15"),
                    sp: 350,
                    rarity: "rare".to_string(),
                },
            );
            tier_configs.insert(
                "epic".to_string(),
                TierConfig {
                    price: dec!("25"),
                    sp: 1000,
                    rarity: "epic".to_string(),
                },
            );

            // Split admin badges: one for component auth, one returned to deployer.
            let component_admin_badge = admin_badge.take(1);
            let deployer_admin_badge = admin_badge;

            let badge_resource_address = badge_resource_manager.address();

            let component = Self {
                xrd_vault: FungibleVault::new(xrd_address),
                badge_resource_manager,
                tier_configs: tier_configs.clone(),
                admin_badge_address,
                admin_badge_vault: FungibleVault::with_bucket(component_admin_badge),
                mint_counter: 1,
                enabled: true,
                max_supply: None,
                withdrawal_limit: None,
                withdrawn_this_epoch: Decimal::ZERO,
                last_withdrawal_epoch: 0,
            }
            .instantiate()
            .prepare_to_globalize(OwnerRole::None)
            .globalize();

            // Emit initialization event for off-chain indexers.
            let initial_tiers: Vec<(String, TierConfig)> = tier_configs.into_iter().collect();
            Runtime::emit_event(GachaMinterInitialized {
                admin_badge_address,
                badge_resource_address,
                initial_tiers,
            });

            (component, deployer_admin_badge)
        }

        /// Mint a gacha badge in exchange for XRD.
        ///
        /// # Arguments
        /// * `payment` — Fungible bucket containing exactly the tier price in XRD.
        /// * `tier` — Tier id: "common", "rare", or "epic".
        /// * `nonce` — Client-generated nonce (stored in badge metadata for correlation).
        ///
        /// # Returns
        /// * `NonFungibleBucket` — The newly minted badge NFT.
        ///
        /// # Panics
        /// Panics if the tier is unknown or the payment amount differs from the tier price.
        pub fn mint_gacha_badge(
            &mut self,
            payment: FungibleBucket,
            tier: String,
            nonce: u64,
        ) -> NonFungibleBucket {
            assert!(self.enabled, "Minting is currently paused");
            assert!(tier.len() <= 32, "Tier id too long");

            // Validate tier exists.
            let config = self
                .tier_configs
                .get(&tier)
                .expect("Invalid tier: must be common, rare, or epic")
                .clone();

            // Enforce supply cap if configured.
            if let Some(max) = self.max_supply {
                assert!(
                    self.mint_counter <= max,
                    "Maximum supply of {} badges has been reached",
                    max
                );
            }

            // Exact payment prevents accidental overpayment from being retained.
            assert!(
                payment.amount() == config.price,
                "Payment must be exactly {} XRD for tier {}, received {}",
                config.price,
                tier,
                payment.amount()
            );

            // Accept payment.
            self.xrd_vault.put(payment);

            // Mint the badge NFT, authorized by the component's admin badge.
            // Use a hash of the transaction hash combined with the counter to make
            // the ID unpredictable and resistant to front-running (M-004).
            let tx_hash = Runtime::transaction_hash();
            let tx_hash_bytes = tx_hash.0; // [u8; 32]
            let hash_component = u64::from_le_bytes([
                tx_hash_bytes[0],
                tx_hash_bytes[1],
                tx_hash_bytes[2],
                tx_hash_bytes[3],
                tx_hash_bytes[4],
                tx_hash_bytes[5],
                tx_hash_bytes[6],
                tx_hash_bytes[7],
            ]);
            let badge_id_value = self.mint_counter.wrapping_add(hash_component);
            let badge_id = NonFungibleLocalId::integer(badge_id_value);
            self.mint_counter += 1;

            let badge_name = format!("{} Badge #{}", config.rarity.to_uppercase(), badge_id);
            let image_url = match tier.as_str() {
                "common" | "rare" | "epic" => format!("https://gachafi.app/badges/{}.png", tier),
                _ => "https://gachafi.app/icon-512.png".to_string(),
            };
            let description = format!(
                "A {} GachaFi badge awarding {} SP.",
                config.rarity, config.sp
            );

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
                        image_url,
                        description,
                    },
                )
            });

            // Emit event for off-chain indexing.
            Runtime::emit_event(BadgeMinted {
                tier,
                rarity: config.rarity,
                sp: config.sp,
                nonce,
                badge_id: badge_id.clone(),
                transaction_hash: Runtime::transaction_hash(),
            });

            badge
        }

        /// Withdraw collected XRD. Admin only.
        ///
        /// # Arguments
        /// * `amount` — Amount of XRD to withdraw.
        /// * `admin_badge` — Proof of admin badge ownership.
        pub fn withdraw_xrd(&mut self, amount: Decimal, admin_badge: Proof) -> FungibleBucket {
            self.assert_admin(admin_badge);
            assert!(amount > Decimal::ZERO, "Withdrawal amount must be positive");
            assert!(
                amount <= self.xrd_vault.amount(),
                "Insufficient balance: requested {} but vault holds {}",
                amount,
                self.xrd_vault.amount()
            );

            // Enforce per-epoch withdrawal limit if configured.
            let current_epoch = Runtime::current_epoch().number();
            if current_epoch != self.last_withdrawal_epoch {
                self.last_withdrawal_epoch = current_epoch;
                self.withdrawn_this_epoch = Decimal::ZERO;
            }
            if let Some(limit) = self.withdrawal_limit {
                assert!(
                    self.withdrawn_this_epoch + amount <= limit,
                    "Withdrawal exceeds epoch limit: already withdrawn {} of {} XRD this epoch",
                    self.withdrawn_this_epoch,
                    limit
                );
            }

            let bucket = self.xrd_vault.take(amount);
            self.withdrawn_this_epoch += amount;
            Runtime::emit_event(XrdWithdrawn {
                amount,
                remaining: self.xrd_vault.amount(),
            });
            bucket
        }

        /// Update tier pricing or SP rewards. Admin only.
        /// The tier must already exist; use `add_tier` to create new tiers.
        ///
        /// # Arguments
        /// * `tier` — Tier id to update.
        /// * `price` — New price in XRD (must be strictly positive).
        /// * `sp` — New SP reward (must be strictly positive).
        /// * `rarity` — New rarity label.
        /// * `admin_badge` — Proof of admin badge ownership.
        pub fn update_tier(
            &mut self,
            tier: String,
            price: Decimal,
            sp: u64,
            rarity: String,
            admin_badge: Proof,
        ) {
            self.assert_admin(admin_badge);
            assert!(price > Decimal::ZERO, "Price must be strictly positive");
            assert!(sp > 0, "SP must be strictly positive");
            assert!(
                !tier.is_empty() && tier.len() <= 32,
                "Tier id must be 1-32 bytes"
            );
            assert!(
                !rarity.is_empty() && rarity.len() <= 32,
                "Rarity label must be 1-32 bytes"
            );
            assert!(
                self.tier_configs.contains_key(&tier),
                "Tier does not exist; use add_tier to create it"
            );
            self.tier_configs.insert(
                tier.clone(),
                TierConfig {
                    price,
                    sp,
                    rarity: rarity.clone(),
                },
            );
            Runtime::emit_event(TierUpdated {
                tier,
                price,
                sp,
                rarity,
                action: "updated".to_string(),
            });
        }

        /// Add a new tier. Admin only.
        /// The tier must not already exist; use `update_tier` to modify existing tiers.
        ///
        /// # Arguments
        /// * `tier` — Tier id to create.
        /// * `price` — Price in XRD (must be strictly positive).
        /// * `sp` — SP reward (must be strictly positive).
        /// * `rarity` — Rarity label.
        /// * `admin_badge` — Proof of admin badge ownership.
        pub fn add_tier(
            &mut self,
            tier: String,
            price: Decimal,
            sp: u64,
            rarity: String,
            admin_badge: Proof,
        ) {
            self.assert_admin(admin_badge);
            assert!(price > Decimal::ZERO, "Price must be strictly positive");
            assert!(sp > 0, "SP must be strictly positive");
            assert!(
                !tier.is_empty() && tier.len() <= 32,
                "Tier id must be 1-32 bytes"
            );
            assert!(
                !rarity.is_empty() && rarity.len() <= 32,
                "Rarity label must be 1-32 bytes"
            );
            assert!(
                !self.tier_configs.contains_key(&tier),
                "Tier already exists; use update_tier to modify it"
            );
            self.tier_configs.insert(
                tier.clone(),
                TierConfig {
                    price,
                    sp,
                    rarity: rarity.clone(),
                },
            );
            Runtime::emit_event(TierUpdated {
                tier,
                price,
                sp,
                rarity,
                action: "added".to_string(),
            });
        }

        /// Read-only: get the price for a tier.
        pub fn get_tier_price(&self, tier: String) -> Decimal {
            self.tier_configs.get(&tier).expect("Tier not found").price
        }

        /// Read-only: get the full tier config.
        pub fn get_tier_config(&self, tier: String) -> TierConfig {
            self.tier_configs
                .get(&tier)
                .expect("Tier not found")
                .clone()
        }

        /// Read-only: total XRD collected by the contract.
        pub fn get_collected_xrd(&self) -> Decimal {
            self.xrd_vault.amount()
        }

        /// Read-only: next badge ID that will be minted.
        pub fn get_mint_counter(&self) -> u64 {
            self.mint_counter
        }

        /// Read-only: resource address for all badges minted by this component.
        pub fn get_badge_resource_address(&self) -> ResourceAddress {
            self.badge_resource_manager.address()
        }

        /// Read-only: number of badges successfully minted.
        pub fn get_total_minted(&self) -> u64 {
            self.mint_counter.saturating_sub(1)
        }

        /// Enable or disable minting. Admin only.
        ///
        /// # Arguments
        /// * `enabled` — `true` to allow minting, `false` to pause.
        /// * `admin_badge` — Proof of admin badge ownership.
        pub fn set_enabled(&mut self, enabled: bool, admin_badge: Proof) {
            self.assert_admin(admin_badge);
            if self.enabled == enabled {
                return; // no-op, no event
            }
            self.enabled = enabled;
            Runtime::emit_event(EnabledChanged { enabled });
        }

        /// Read-only: whether minting is currently enabled.
        pub fn is_enabled(&self) -> bool {
            self.enabled
        }

        /// Set the maximum supply cap. Admin only.
        /// Pass `None` to remove the cap (unlimited minting).
        pub fn set_max_supply(&mut self, max_supply: Option<u64>, admin_badge: Proof) {
            self.assert_admin(admin_badge);
            self.max_supply = max_supply;
        }

        /// Read-only: current max supply cap (None = unlimited).
        pub fn get_max_supply(&self) -> Option<u64> {
            self.max_supply
        }

        /// Set the per-epoch withdrawal limit. Admin only.
        /// Pass `None` to remove the limit.
        pub fn set_withdrawal_limit(&mut self, limit: Option<Decimal>, admin_badge: Proof) {
            self.assert_admin(admin_badge);
            if let Some(value) = limit {
                assert!(value > Decimal::ZERO, "Withdrawal limit must be positive");
                self.withdrawal_limit = Some(value);
            } else {
                self.withdrawal_limit = None;
            }
        }

        /// Read-only: current per-epoch withdrawal limit (None = unlimited).
        pub fn get_withdrawal_limit(&self) -> Option<Decimal> {
            self.withdrawal_limit
        }

        /// Read-only: amount withdrawn in the current epoch.
        pub fn get_withdrawn_this_epoch(&self) -> Decimal {
            self.withdrawn_this_epoch
        }

        fn assert_admin(&self, proof: Proof) {
            proof.check(self.admin_badge_address);
        }
    }
}
