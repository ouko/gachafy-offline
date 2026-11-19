# Lovable Independence Checklist

The current repository does not include `lovable-tagger`, Lovable runtime imports, or Lovable preview URLs in operational configuration. Development no longer requires a Lovable account.

## Verification

```bash
npm ci
npm run check
npm test -- --run
npm run build
```

Inspect dependency and build configuration:

```bash
npm ls lovable-tagger
# Expected: empty/not installed

grep -R -i "lovable" src public vite.config.ts package.json
# Expected: no runtime references
```

The repository may contain this checklist and historical references to the development tool; those do not execute in the app.

## Deploy independently

- Netlify: use included `netlify.toml`.
- Docker: `docker compose up --build -d`, then verify host port 3000 and container health on 8080.
- Static host: publish `dist/` with SPA rewrites and documented security headers.
- VPS: follow `SELF_HOSTING.md`.

Set Radix network, dApp definition, package, component, and badge resource addresses in the host's public build configuration. Optional Sentry and OneSignal are consent-gated and can remain disabled.

This checklist establishes build/tooling independence only. Production launch still requires contract deployment, end-to-end wallet testing, security review, privacy/legal review, and target-device testing.
