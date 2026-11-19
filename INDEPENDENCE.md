# Independence and Portability

GachaFi uses standard React, TypeScript, Vite, npm, Rust, and Scrypto. It has no production dependency on Lovable and no Lovable plugin in the build configuration. The repository includes all application and contract source required to build it.

## Runtime dependencies

- Static hosting for the frontend.
- Radix Wallet for user signing.
- A Radix Gateway for chain reads; a public, hosted, or self-hosted Gateway can be selected at build time.
- Optional Sentry and OneSignal, both disabled without configuration and user consent.

There is no GachaFi backend, database, authentication service, or Supabase integration. Do not add sample PostgreSQL/PostgREST services to the deployment: they are not used by the app.

## Verify locally

```bash
npm ci
npm run check
npm test -- --run
npm run build
npm run check:bundle
cargo test --manifest-path scrypto/gacha/Cargo.toml
```

The production build is in `dist/`. Deploy it to any static host with SPA rewrites and the documented security headers, or use the included non-root Docker/nginx setup on host port 3000 (container port 8080).

## Portability limits

Public Radix addresses and Gateway configuration are embedded at build time. Changing networks or contract deployments requires rebuilding. The contract is immutable; source portability does not make an existing component upgradeable.

No license file is currently provided. Independence of the source code is not a grant of redistribution rights or evidence of a completed production launch.
