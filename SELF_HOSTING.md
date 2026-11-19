# Self-Hosting GachaFi

GachaFi is a static dApp. Self-hosting means serving the built frontend and optionally running your own Radix Gateway. There is no GachaFi database or backend to deploy. Wallet keys remain with users; contract administration remains with the operator wallet.

## Option 1: Docker Compose on a VPS

Requirements: Docker with Compose, a domain, and a TLS reverse proxy.

1. Clone the repository and configure public build values:

```bash
git clone https://github.com/ouko/gachafy-offline.git
cd gachafy-offline
cp .env.example .env
# Set network, dApp definition, package, component, and badge resource.
```

2. Build and start:

```bash
docker compose up --build -d
curl --fail http://localhost:3000/health
```

The unprivileged nginx container listens on 8080; Compose maps host port 3000. Do not expose that HTTP port directly as the public production endpoint. Terminate HTTPS with your proxy and forward to port 3000.

3. If using a self-hosted/custom Gateway, set `VITE_RADIX_GATEWAY_URL` and add its HTTPS origin to `connect-src` in `security-headers.conf` before building.

4. Verify `/open`, `/inventory`, `/privacy`, `/.well-known/radix.json`, and `/health` through HTTPS. Test wallet connection and a Stokenet mint before Mainnet.

## Option 2: Build locally and serve with system nginx

```bash
npm ci
npm run check
npm test -- --run
npm run build
```

Copy `dist/` to the web root. Configure nginx to:

- serve `index.html` for unknown SPA routes but not missing assets;
- serve `/.well-known/radix.json` as public JSON;
- apply `security-headers.conf` to every response, including locations with cache overrides;
- cache hashed `/assets/` files for one year and keep service workers uncached;
- redirect HTTP to HTTPS after TLS is configured.

Run `nginx -t` before reload. The repository's `nginx.conf` is a Docker `server` block using port 8080 and container paths; adapt paths and listen directives for system nginx rather than copying it unchanged.

## Updates and rollback

1. Pull the desired commit.
2. Update public addresses if the contract changed.
3. Run tests/build and deploy the new static artifact.
4. Verify service-worker update, deep links, wallet, Reveal, and Collection.
5. Roll back the static artifact together with its matching contract configuration.

Contract changes are not rolled back by a frontend rollback. The component is immutable; pausing/migration requires the admin badge and an operational runbook.

## Optional external services

Sentry and OneSignal can remain unset. If enabled, they load/process data only after user consent. Self-hosting the frontend does not self-host those providers or the public Radix Gateway. Review processor terms, retention, and transfer settings before enabling them.

## Operations

Monitor static-host availability, Gateway errors/rate limits, contract events, and admin wallet security. Keep dependencies and pinned base images updated through reviewed pull requests. Use `/privacy` for local data controls; blockchain records cannot be deleted.
