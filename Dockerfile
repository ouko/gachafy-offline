# syntax=docker/dockerfile:1.7
# ----------------------------------------------------------------------------
# Multi-stage build for the GachaFi PWA.
#   Stage 1 (builder) — install ALL deps (devDeps include Vite, TS, Tailwind),
#                       run the production build.
#   Stage 2 (runtime) — nginx alpine serving the static dist.
# ----------------------------------------------------------------------------

# ----- Stage 1: Build -------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first so Docker can cache the layer.
COPY package*.json ./
RUN npm ci

# Build-time env (anything Vite-substituted must be present here).
ARG VITE_ONESIGNAL_APP_ID
ARG VITE_ONESIGNAL_SAFARI_WEB_ID
ARG VITE_RADIX_NETWORK=stokenet
ARG VITE_RADIX_DAPP_DEFINITION
ARG VITE_RADIX_GATEWAY_URL
ARG VITE_GACHA_PACKAGE_ADDRESS
ARG VITE_GACHA_COMPONENT_ADDRESS
ARG VITE_XRD_RESOURCE_ADDRESS
ARG VITE_FEATURE_BRIDGE=false
ARG VITE_FEATURE_OFFLINE_QUEUE=false
ARG VITE_FEATURE_CREATOR_DASHBOARD=true
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
    VITE_XRD_RESOURCE_ADDRESS=$VITE_XRD_RESOURCE_ADDRESS \
    VITE_FEATURE_BRIDGE=$VITE_FEATURE_BRIDGE \
    VITE_FEATURE_OFFLINE_QUEUE=$VITE_FEATURE_OFFLINE_QUEUE \
    VITE_FEATURE_CREATOR_DASHBOARD=$VITE_FEATURE_CREATOR_DASHBOARD \
    VITE_SENTRY_DSN=$VITE_SENTRY_DSN \
    VITE_APP_NAME=$VITE_APP_NAME \
    VITE_APP_VERSION=$VITE_APP_VERSION

COPY . .

# Type-check before build so a broken commit fails fast.
RUN npm run check
RUN npm run build

# ----- Stage 2: Runtime -----------------------------------------------------
FROM nginx:alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# Drop privileges where possible.
RUN addgroup -S app && adduser -S app -G app \
    && chown -R app:app /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
