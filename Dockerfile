# syntax=docker/dockerfile:1.7
# ----------------------------------------------------------------------------
# Multi-stage build for the GachaFi PWA.
#   Stage 1 (builder) — install ALL deps (devDeps include Vite, TS, Tailwind),
#                       run the production build.
#   Stage 2 (runtime) — nginx alpine serving the static dist.
# ----------------------------------------------------------------------------
# Security: base images are pinned by digest to prevent supply-chain drift.
# Update digests with: docker pull nginx:alpine && docker inspect --format='{{index .RepoDigests 0}}' nginx:alpine

# ----- Stage 1: Build -------------------------------------------------------
FROM node:22-alpine@sha256:1314fb30ec37592d5845e5a160d522c0e680972aa534549940b8d73bde88481a AS builder

WORKDIR /app

# Install dependencies first so Docker can cache the layer.
COPY package*.json ./
RUN npm ci --fetch-retries=5 --fetch-retry-maxtimeout=120000

# Build-time env (anything Vite-substituted must be present here).
ARG VITE_ONESIGNAL_APP_ID
ARG VITE_ONESIGNAL_SAFARI_WEB_ID
ARG VITE_RADIX_NETWORK=stokenet
ARG VITE_RADIX_DAPP_DEFINITION
ARG VITE_RADIX_GATEWAY_URL
ARG VITE_GACHA_PACKAGE_ADDRESS
ARG VITE_GACHA_COMPONENT_ADDRESS
ARG VITE_GACHA_BADGE_RESOURCE
ARG VITE_XRD_RESOURCE_ADDRESS
ARG VITE_FEATURE_OFFLINE_QUEUE=false
ARG VITE_SENTRY_DSN
ARG VITE_APP_NAME=GachaFi
ARG VITE_APP_VERSION=1.0.0

ENV VITE_ONESIGNAL_APP_ID=$VITE_ONESIGNAL_APP_ID \
    VITE_ONESIGNAL_SAFARI_WEB_ID=$VITE_ONESIGNAL_SAFARI_WEB_ID \
    VITE_RADIX_NETWORK=$VITE_RADIX_NETWORK \
    VITE_RADIX_DAPP_DEFINITION=$VITE_RADIX_DAPP_DEFINITION \
    VITE_RADIX_GATEWAY_URL=$VITE_RADIX_GATEWAY_URL \
    VITE_GACHA_PACKAGE_ADDRESS=$VITE_GACHA_PACKAGE_ADDRESS \
    VITE_GACHA_COMPONENT_ADDRESS=$VITE_GACHA_COMPONENT_ADDRESS \
    VITE_GACHA_BADGE_RESOURCE=$VITE_GACHA_BADGE_RESOURCE \
    VITE_XRD_RESOURCE_ADDRESS=$VITE_XRD_RESOURCE_ADDRESS \
    VITE_FEATURE_OFFLINE_QUEUE=$VITE_FEATURE_OFFLINE_QUEUE \
    VITE_SENTRY_DSN=$VITE_SENTRY_DSN \
    VITE_APP_NAME=$VITE_APP_NAME \
    VITE_APP_VERSION=$VITE_APP_VERSION

COPY . .

# Type-check before build so a broken commit fails fast.
RUN npm run check
RUN npm run build

# ----- Stage 2: Runtime -----------------------------------------------------
FROM nginx:alpine@sha256:0563c36f94a6d3ec3584161b77859f740f7e20b4853f52c796a864ce6908e8ea AS runtime

COPY nginx.conf security-headers.conf /etc/nginx/conf.d/

RUN addgroup -S app && adduser -S app -G app \
    && mkdir -p /var/cache/nginx /var/run/nginx \
    && sed -i 's|^pid .*|pid /var/run/nginx/nginx.pid;|' /etc/nginx/nginx.conf \
    && chown -R app:app /var/cache/nginx /var/run/nginx

# Copy static assets.
COPY --from=builder /app/dist /usr/share/nginx/html
RUN chown -R app:app /usr/share/nginx/html

# Run as non-root user.
USER app

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
