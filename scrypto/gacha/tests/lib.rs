use gacha::gacha_minter::*;
use scrypto::prelude::*;
use scrypto_test::prelude::{
    BucketFactory, CompileProfile, CreationStrategy, NativeBucket, NativeNonFungibleBucket,
    PackageFactory, ProofFactory, TestEnvironment,
};
use scrypto_test::this_package;

/// Tests that the package compiles and the blueprint can be instantiated.
#[test]
fn test_instantiate() {
    // Arrange
    let mut env = TestEnvironment::new();
    let package =
        PackageFactory::compile_and_publish(this_package!(), &mut env, CompileProfile::Fast)
            .unwrap();

    let xrd = XRD;

    // Act
    let result = env.call_function_typed::<_, (Global<GachaMinter>, FungibleBucket)>(
        package,
        "GachaMinter",
        "instantiate_gacha_minter",
        &(xrd,),
    );

    // Assert
    assert!(result.is_ok(), "Instantiation failed: {:?}", result.err());
    let (component, admin_badge) = result.unwrap();

    // Capture the native admin resource before subsequent environment calls.
    let admin_badge_address = NativeBucket::resource_address(&admin_badge, &mut env).unwrap();
    assert_ne!(admin_badge_address, XRD);

    // Verify initial tier prices
    let common_price: Decimal = env
        .call_method_typed(
            component.address(),
            "get_tier_price",
            &("common".to_string(),),
        )
        .unwrap();
    assert_eq!(common_price, dec!("8"));

    let rare_price: Decimal = env
        .call_method_typed(
            component.address(),
            "get_tier_price",
            &("rare".to_string(),),
        )
        .unwrap();
    assert_eq!(rare_price, dec!("15"));

    let epic_price: Decimal = env
        .call_method_typed(
            component.address(),
            "get_tier_price",
            &("epic".to_string(),),
        )
        .unwrap();
    assert_eq!(epic_price, dec!("25"));
}

/// Tests minting with correct payment and verifies the badge NFT.
#[test]
fn test_mint_happy_path() {
    // Arrange
    let mut env = TestEnvironment::new();
    let package =
        PackageFactory::compile_and_publish(this_package!(), &mut env, CompileProfile::Fast)
            .unwrap();

    let xrd = XRD;

    let (component, _admin_badge) = env
        .call_function_typed::<_, (Global<GachaMinter>, FungibleBucket)>(
            package,
            "GachaMinter",
            "instantiate_gacha_minter",
            &(xrd,),
        )
        .unwrap();

    // Create a mock XRD payment bucket
    let payment =
        BucketFactory::create_fungible_bucket(xrd, dec!("8"), CreationStrategy::Mock, &mut env)
            .unwrap();

    // Act — mint a common badge
    let badge = env.call_method_typed::<_, _, Bucket>(
        component.address(),
        "mint_gacha_badge",
        &(payment, "common".to_string(), 42u64),
    );

    // Assert
    assert!(badge.is_ok(), "Mint failed: {:?}", badge.err());
    let badge = badge.unwrap();

    // Verify collected XRD
    let collected: Decimal = env
        .call_method_typed(component.address(), "get_collected_xrd", &())
        .unwrap();
    assert_eq!(collected, dec!("8"));

    let badge_resource = NativeBucket::resource_address(&badge, &mut env).unwrap();
    let badge_ids = badge.non_fungible_local_ids(&mut env).unwrap();
    let badge_id = badge_ids.first().unwrap().clone();
    let data: ScryptoValue = env
        .call_method_typed(badge_resource, "get_non_fungible", &(badge_id,))
        .unwrap();
    let data = format!("{data:?}");
    assert!(data.contains("https://gachafi.app/badges/common.png"));
    assert!(data.contains("A common GachaFi badge awarding 100 SP."));
}

/// Tests that minting with wrong payment amount fails.
#[test]
fn test_mint_wrong_payment_fails() {
    // Arrange
    let mut env = TestEnvironment::new();
    let package =
        PackageFactory::compile_and_publish(this_package!(), &mut env, CompileProfile::Fast)
            .unwrap();

    let xrd = XRD;

    let (component, _admin_badge) = env
        .call_function_typed::<_, (Global<GachaMinter>, FungibleBucket)>(
            package,
            "GachaMinter",
            "instantiate_gacha_minter",
            &(xrd,),
        )
        .unwrap();

    // Wrong payment: 5 XRD instead of 8
    let payment =
        BucketFactory::create_fungible_bucket(xrd, dec!("5"), CreationStrategy::Mock, &mut env)
            .unwrap();

    // Act & Assert
    let result = env.call_method_typed::<_, _, Bucket>(
        component.address(),
        "mint_gacha_badge",
        &(payment, "common".to_string(), 1u64),
    );

    assert!(result.is_err(), "Expected mint with wrong payment to fail");
}

/// Tests that minting an invalid tier fails.
#[test]
fn test_mint_invalid_tier_fails() {
    // Arrange
    let mut env = TestEnvironment::new();
    let package =
        PackageFactory::compile_and_publish(this_package!(), &mut env, CompileProfile::Fast)
            .unwrap();

    let xrd = XRD;

    let (component, _admin_badge) = env
        .call_function_typed::<_, (Global<GachaMinter>, FungibleBucket)>(
            package,
            "GachaMinter",
            "instantiate_gacha_minter",
            &(xrd,),
        )
        .unwrap();

    let payment =
        BucketFactory::create_fungible_bucket(xrd, dec!("8"), CreationStrategy::Mock, &mut env)
            .unwrap();

    // Act & Assert
    let result = env.call_method_typed::<_, _, Bucket>(
        component.address(),
        "mint_gacha_badge",
        &(payment, "legendary".to_string(), 1u64),
    );

    assert!(result.is_err(), "Expected mint with invalid tier to fail");
}

#[test]
fn test_badge_read_methods() {
    let mut env = TestEnvironment::new();
    let package =
        PackageFactory::compile_and_publish(this_package!(), &mut env, CompileProfile::Fast)
            .unwrap();
    let (component, _admin_badge) = env
        .call_function_typed::<_, (Global<GachaMinter>, FungibleBucket)>(
            package,
            "GachaMinter",
            "instantiate_gacha_minter",
            &(XRD,),
        )
        .unwrap();

    let total: u64 = env
        .call_method_typed(component.address(), "get_total_minted", &())
        .unwrap();
    let resource: ResourceAddress = env
        .call_method_typed(component.address(), "get_badge_resource_address", &())
        .unwrap();

    assert_eq!(total, 0);
    assert_ne!(resource, XRD);
}

#[test]
fn test_mint_overpayment_fails() {
    let mut env = TestEnvironment::new();
    let package =
        PackageFactory::compile_and_publish(this_package!(), &mut env, CompileProfile::Fast)
            .unwrap();
    let (component, _admin_badge) = env
        .call_function_typed::<_, (Global<GachaMinter>, FungibleBucket)>(
            package,
            "GachaMinter",
            "instantiate_gacha_minter",
            &(XRD,),
        )
        .unwrap();
    let payment =
        BucketFactory::create_fungible_bucket(XRD, dec!("9"), CreationStrategy::Mock, &mut env)
            .unwrap();

    let result = env.call_method_typed::<_, _, Bucket>(
        component.address(),
        "mint_gacha_badge",
        &(payment, "common".to_string(), 1u64),
    );

    assert!(result.is_err(), "Expected overpayment to fail");
}

#[test]
fn test_pause_and_zero_supply_cap_block_minting() {
    let mut env = TestEnvironment::new();
    let package =
        PackageFactory::compile_and_publish(this_package!(), &mut env, CompileProfile::Fast)
            .unwrap();
    let (component, admin_badge) = env
        .call_function_typed::<_, (Global<GachaMinter>, FungibleBucket)>(
            package,
            "GachaMinter",
            "instantiate_gacha_minter",
            &(XRD,),
        )
        .unwrap();

    let admin_badge_address = NativeBucket::resource_address(&admin_badge, &mut env).unwrap();
    let pause_proof = ProofFactory::create_fungible_proof(
        admin_badge_address,
        dec!("1"),
        CreationStrategy::Mock,
        &mut env,
    )
    .unwrap();
    env.call_method_typed::<_, _, ()>(component.address(), "set_enabled", &(false, pause_proof))
        .unwrap();
    let enabled: bool = env
        .call_method_typed(component.address(), "is_enabled", &())
        .unwrap();
    assert!(!enabled);

    let resume_proof = ProofFactory::create_fungible_proof(
        admin_badge_address,
        dec!("1"),
        CreationStrategy::Mock,
        &mut env,
    )
    .unwrap();
    env.call_method_typed::<_, _, ()>(component.address(), "set_enabled", &(true, resume_proof))
        .unwrap();
    let cap_proof = ProofFactory::create_fungible_proof(
        admin_badge_address,
        dec!("1"),
        CreationStrategy::Mock,
        &mut env,
    )
    .unwrap();
    env.call_method_typed::<_, _, ()>(
        component.address(),
        "set_max_supply",
        &(Some(0u64), cap_proof),
    )
    .unwrap();

    let payment =
        BucketFactory::create_fungible_bucket(XRD, dec!("8"), CreationStrategy::Mock, &mut env)
            .unwrap();
    let result = env.call_method_typed::<_, _, Bucket>(
        component.address(),
        "mint_gacha_badge",
        &(payment, "common".to_string(), 1u64),
    );
    assert!(result.is_err(), "Expected zero supply cap to block minting");
}

#[test]
fn test_invalid_admin_proof_and_withdrawal_limit_fail() {
    let mut env = TestEnvironment::new();
    let package =
        PackageFactory::compile_and_publish(this_package!(), &mut env, CompileProfile::Fast)
            .unwrap();
    let (component, admin_badge) = env
        .call_function_typed::<_, (Global<GachaMinter>, FungibleBucket)>(
            package,
            "GachaMinter",
            "instantiate_gacha_minter",
            &(XRD,),
        )
        .unwrap();

    let admin_badge_address = NativeBucket::resource_address(&admin_badge, &mut env).unwrap();
    let wrong_proof =
        ProofFactory::create_fungible_proof(XRD, dec!("1"), CreationStrategy::Mock, &mut env)
            .unwrap();
    let result = env.call_method_typed::<_, _, ()>(
        component.address(),
        "set_enabled",
        &(false, wrong_proof),
    );
    assert!(result.is_err(), "Expected invalid admin proof to fail");

    let proof = ProofFactory::create_fungible_proof(
        admin_badge_address,
        dec!("1"),
        CreationStrategy::Mock,
        &mut env,
    )
    .unwrap();
    let result = env.call_method_typed::<_, _, ()>(
        component.address(),
        "set_withdrawal_limit",
        &(Some(dec!("-1")), proof),
    );
    assert!(
        result.is_err(),
        "Expected negative withdrawal limit to fail"
    );
}
