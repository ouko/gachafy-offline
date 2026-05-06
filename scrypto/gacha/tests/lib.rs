use gacha::gacha_minter::*;
use scrypto::prelude::*;
use scrypto_test::prelude::*;

/// Tests that the package compiles and the blueprint can be instantiated.
#[test]
fn test_instantiate() {
    // Arrange
    let mut env = TestEnvironment::new();
    let package = PackageFactory::compile_and_publish(
        this_package!(),
        &mut env,
        CompileProfile::Fast,
    )
    .unwrap();

    let xrd = XRD;

    // Act
    let result = env.call_function_typed::<_, _, (Global<GachaMinter>, Bucket)>(
        package,
        "GachaMinter",
        "instantiate_gacha_minter",
        &(xrd,),
    );

    // Assert
    assert!(result.is_ok(), "Instantiation failed: {:?}", result.err());
    let (component, admin_badge) = result.unwrap();

    // Verify admin badge is non-divisible fungible
    let resource_type = admin_badge.resource_address();
    assert!(env
        .call_method_typed::<_, _, bool>(resource_type, "is_fungible", &())
        .unwrap());

    // Verify initial tier prices
    let common_price: Decimal = env
        .call_method_typed(component, "get_tier_price", &("common".to_string(),))
        .unwrap();
    assert_eq!(common_price, dec!("8"));

    let rare_price: Decimal = env
        .call_method_typed(component, "get_tier_price", &("rare".to_string(),))
        .unwrap();
    assert_eq!(rare_price, dec!("15"));

    let epic_price: Decimal = env
        .call_method_typed(component, "get_tier_price", &("epic".to_string(),))
        .unwrap();
    assert_eq!(epic_price, dec!("25"));
}

/// Tests minting with correct payment and verifies the badge NFT.
#[test]
fn test_mint_happy_path() {
    // Arrange
    let mut env = TestEnvironment::new();
    let package = PackageFactory::compile_and_publish(
        this_package!(),
        &mut env,
        CompileProfile::Fast,
    )
    .unwrap();

    let xrd = XRD;

    let (component, _admin_badge) = env
        .call_function_typed::<_, _, (Global<GachaMinter>, Bucket)>(
            package,
            "GachaMinter",
            "instantiate_gacha_minter",
            &(xrd,),
        )
        .unwrap();

    // Create a mock XRD payment bucket
    let payment = BucketFactory::create_fungible_bucket(
        xrd,
        dec!("8"),
        CreationStrategy::Mock,
        &mut env,
    )
    .unwrap();

    // Act — mint a common badge (auth module disabled so component proof works)
    let badge = env.with_auth_module_disabled(|env| {
        env.call_method_typed::<_, _, Bucket>(
            component,
            "mint_gacha_badge",
            &(
                payment,
                "common".to_string(),
                42u64,
            ),
        )
    });

    // Assert
    assert!(badge.is_ok(), "Mint failed: {:?}", badge.err());
    let badge = badge.unwrap();

    // Verify collected XRD
    let collected: Decimal = env
        .call_method_typed(component, "get_collected_xrd", &())
        .unwrap();
    assert_eq!(collected, dec!("8"));

    // Verify badge is non-fungible
    assert!(!env
        .call_method_typed::<_, _, bool>(badge.resource_address(), "is_fungible", &())
        .unwrap());
}

/// Tests that minting with wrong payment amount fails.
#[test]
fn test_mint_wrong_payment_fails() {
    // Arrange
    let mut env = TestEnvironment::new();
    let package = PackageFactory::compile_and_publish(
        this_package!(),
        &mut env,
        CompileProfile::Fast,
    )
    .unwrap();

    let xrd = XRD;

    let (component, _admin_badge) = env
        .call_function_typed::<_, _, (Global<GachaMinter>, Bucket)>(
            package,
            "GachaMinter",
            "instantiate_gacha_minter",
            &(xrd,),
        )
        .unwrap();

    // Wrong payment: 5 XRD instead of 8
    let payment = BucketFactory::create_fungible_bucket(
        xrd,
        dec!("5"),
        CreationStrategy::Mock,
        &mut env,
    )
    .unwrap();

    // Act & Assert
    let result = env.with_auth_module_disabled(|env| {
        env.call_method_typed::<_, _, Bucket>(
            component,
            "mint_gacha_badge",
            &(payment, "common".to_string(), 1u64),
        )
    });

    assert!(result.is_err(), "Expected mint with wrong payment to fail");
}

/// Tests that minting an invalid tier fails.
#[test]
fn test_mint_invalid_tier_fails() {
    // Arrange
    let mut env = TestEnvironment::new();
    let package = PackageFactory::compile_and_publish(
        this_package!(),
        &mut env,
        CompileProfile::Fast,
    )
    .unwrap();

    let xrd = XRD;

    let (component, _admin_badge) = env
        .call_function_typed::<_, _, (Global<GachaMinter>, Bucket)>(
            package,
            "GachaMinter",
            "instantiate_gacha_minter",
            &(xrd,),
        )
        .unwrap();

    let payment = BucketFactory::create_fungible_bucket(
        xrd,
        dec!("8"),
        CreationStrategy::Mock,
        &mut env,
    )
    .unwrap();

    // Act & Assert
    let result = env.with_auth_module_disabled(|env| {
        env.call_method_typed::<_, _, Bucket>(
            component,
            "mint_gacha_badge",
            &(payment, "legendary".to_string(), 1u64),
        )
    });

    assert!(result.is_err(), "Expected mint with invalid tier to fail");
}
