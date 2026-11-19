# Branch Protection Recommendations

**Current GitHub check (2026-11-20):** the API reports that `main` is not protected. The rules below are recommendations, not current controls. Verify repository settings before relying on them.

## Recommended `main` rules

- Require a pull request and at least one approval.
- Dismiss stale approvals and require conversation resolution.
- Require branches to be current before merging.
- Require the CI jobs `build`, `contract`, `audit`, and `secrets` to pass.
- Include administrators and prevent bypass, force-push, and deletion.
- Restrict files over 100 MiB.
- Require signed commits only after the team's signing workflow is configured.

CI defines:

1. `build`: install, typecheck, lint, tests, build, and bundle budget.
2. `contract`: Scrypto tests and release Wasm build.
3. `audit`: `npm audit --audit-level=high`.
4. `secrets`: TruffleHog verified-secret scan.

All CI actions are pinned to commit SHAs. Apply equivalent rules to a long-lived `develop` branch if one is used.

Never force-push shared branches. Revert erroneous commits with a new commit. Use read-only deploy keys where possible and scoped, expiring credentials where write access is unavoidable. Review actual branch rules and security logs periodically.
