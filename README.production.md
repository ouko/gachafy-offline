# GachaFi - Production Deployment Guide

## Overview
GachaFi is a production-ready Web3 gacha gaming application with offline-first capabilities, built with React, Vite, and Radix DLT.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Blockchain**: Radix DLT (Stokenet/Mainnet)
- **Backend**: None (client-side DApp — all state on Radix DLT or local device)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Context + TanStack Query
- **PWA**: Service Workers + IndexedDB

## Prerequisites
- Node.js 18+ or Bun
- Radix wallet (for testing)
- (Optional) OneSignal account for push notifications

## Local Development Setup

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd gachafi
npm install  # or: bun install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` with your actual credentials:
- **OneSignal** (optional): Get from https://onesignal.com/

### 3. Run Development Server
```bash
npm run dev  # or: bun run dev
```

Access at `http://localhost:5173`

## Production Deployment

### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

**Vercel Configuration** (automatic with `vite.config.ts`)
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### Option 2: Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

**Netlify Configuration**: Create `netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3: Docker
```bash
# Build image
docker build -t gachafi:latest .

# Run container
docker run -p 3000:80 \
  -e VITE_GACHA_PACKAGE_ADDRESS=your-package \
  -e VITE_GACHA_COMPONENT_ADDRESS=your-component \
  gachafi:latest
```

### Option 4: Static Hosting (AWS S3, CloudFlare Pages, etc.)
```bash
# Build
npm run build

# Upload 'dist' folder to your hosting provider
```

## Environment Variables

### Required
- `VITE_GACHA_PACKAGE_ADDRESS`: Your deployed Scrypto package address
- `VITE_GACHA_COMPONENT_ADDRESS`: Your deployed component address

### Optional
- `VITE_ONESIGNAL_APP_ID`: OneSignal app ID for push notifications
- `VITE_RADIX_NETWORK`: `stokenet` (testnet) or `mainnet`
- `VITE_RADIX_DAPP_DEFINITION`: Your dApp definition address

## Security Checklist

- [ ] Configure CSP headers
- [ ] Review and rotate API keys regularly
- [ ] Set up monitoring and error tracking (Sentry recommended)
- [ ] Enable HTTPS only
- [ ] Configure proper authentication flows
- [ ] Review sensitive data logging (already sanitized in code)

## Performance Optimizations

### Already Implemented
- ✅ Code splitting with React lazy loading
- ✅ Image optimization
- ✅ Service worker caching (PWA)
- ✅ IndexedDB for offline storage
- ✅ TanStack Query caching
- ✅ Debounced API calls
- ✅ Rate limiting

### Additional Recommendations
- Enable CDN for static assets
- Configure gzip/brotli compression
- Set up proper cache headers
- Use image CDN (Cloudflare Images, Imgix, etc.)
- Monitor Core Web Vitals

## Monitoring & Logging

### Recommended Services
- **Error Tracking**: Sentry, LogRocket
- **Analytics**: Plausible, Google Analytics
- **Performance**: Lighthouse CI, WebPageTest
- **Uptime**: UptimeRobot, Pingdom

### Built-in Logging
The app includes a production-safe logging system (`src/lib/logger.ts`) that:
- Sanitizes sensitive data
- Only logs errors/warnings in production
- Buffers recent logs for debugging

## Troubleshooting

### Build Issues
```bash
# Clear cache and rebuild
rm -rf node_modules dist .vite
npm install
npm run build
```

### Wallet Connection Issues
- Ensure Radix Connector browser extension is installed
- Verify dApp definition address is correct
- Check network (Stokenet vs Mainnet) matches

### Service Worker Issues
```bash
# Unregister all service workers in browser DevTools:
# Application tab > Service Workers > Unregister
```

## CI/CD Pipeline

### GitHub Actions Example
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## Scaling Considerations

### Current Capacity
- Frontend: Scales infinitely (static hosting)
- Radix Gateway: Public endpoint (consider self-hosted gateway for high traffic)

### When to Scale
- **Gateway**: Self-host a Radix Gateway or use a provider with SLAs if public gateway rate limits become an issue

### Rate Limits (Built-in)
- Wallet connections: 3/minute
- Mints: 5/minute per wallet
- Balance checks: Debounced to 5s intervals

## Support & Maintenance

### Regular Tasks
- [ ] Monitor error logs weekly
- [ ] Review gateway usage and error rates monthly
- [ ] Update dependencies monthly (`npm outdated`)
- [ ] Security audit quarterly
- [ ] Performance audit quarterly
- [ ] Verify contract addresses are correct after any redeployment

### Updating Dependencies
```bash
# Check for updates
npm outdated

# Update non-breaking
npm update

# Update major versions (test thoroughly)
npm install package@latest
```

## License
[Your License Here]

## Contact
[Your Contact Information]
