# GachaFi - Offline-First Web3 Gacha Gaming

> **🎯 100% Independent & Portable** - Zero Lovable dependencies. Deploy anywhere. Own everything.

A production-ready, offline-first gacha gaming application built with React, Radix DLT, and modern web technologies. Features Web3 wallet integration, PWA capabilities, and a beautiful UI.

## 🚀 Quick Start

### Local Development
```bash
# Clone and install
git clone <your-repo-url>
cd gachafi
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run development server
npm run dev
```

### Deploy to Production
```bash
# Docker + nginx (recommended)
docker-compose up -d

# Or Netlify
npm i -g netlify-cli
netlify deploy --prod

# Or any static host
npm run build
# Upload 'dist/' to S3, Cloudflare Pages, GitHub Pages, etc.
```

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for detailed deployment instructions.

See **[README.production.md](./README.production.md)** for comprehensive production guide.

## ✨ Features

- ✅ **Web3 Integration** - Radix DLT wallet connection
- ✅ **Offline-First** - PWA with Service Workers & IndexedDB
- ✅ **Production-Ready** - Error boundaries, validation, rate limiting
- ✅ **Responsive Design** - Mobile-first with beautiful UI
- ✅ **Audio Effects** - Unique sounds for each interaction
- ✅ **Streak System** - Daily login rewards with multipliers
- ✅ **Push Notifications** - OneSignal integration (optional)
- ✅ **Security** - Input validation, sanitized logging, RLS ready
- ✅ **Performance** - Code splitting, caching, optimizations

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Blockchain**: Radix DLT (Stokenet/Mainnet)
- **Backend**: None (client-side DApp — all state on Radix DLT or local device)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: React Context + TanStack Query
- **PWA**: Service Workers + IndexedDB

## 📋 Prerequisites

- Node.js 18+ (or Bun)
- Radix wallet for testing
- (Optional) OneSignal for push notifications

## 🔧 Environment Variables

Create `.env` from `.env.example`:

```bash
# Required
VITE_GACHA_PACKAGE_ADDRESS=your-package-address
VITE_GACHA_COMPONENT_ADDRESS=your-component-address

# Optional
VITE_ONESIGNAL_APP_ID=your-onesignal-id
VITE_RADIX_NETWORK=stokenet
VITE_RADIX_DAPP_DEFINITION=your-dapp-address
```

## 📦 Project Structure

```
gachafi/
├── src/
│   ├── components/       # React components
│   ├── contexts/         # React context providers
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities & services
│   │   ├── errorHandling.ts  # Error handling & retries
│   │   ├── validation.ts     # Input validation (Zod)
│   │   ├── rateLimiter.ts    # Rate limiting
│   │   ├── logger.ts         # Production-safe logging
│   │   ├── radix.ts          # Radix DLT integration
│   │   └── oneSignal.ts      # Push notifications
│   ├── pages/           # Page components
│   ├── utils/           # Utility functions
│   └── integrations/    # Third-party integrations
├── public/              # Static assets
├── .env.example        # Environment template
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose setup
├── netlify.toml       # Netlify deployment config
├── DEPLOYMENT.md      # Quick deployment guide
├── README.production.md  # Detailed production guide
├── docs/GETTING_STARTED.md # New developer guide
├── docs/SCRYPTO_GUIDE.md   # Smart contract guide
├── docs/ARCHITECTURE.md    # System architecture
└── docs/security-audit.md  # Security audit results
```

## 🚢 Deployment Options

### Vercel (Recommended)
```bash
vercel
```

### Netlify
```bash
netlify deploy --prod
```

### Docker
```bash
docker-compose up -d
```

### Static Hosting
```bash
npm run build
# Upload 'dist' folder to S3, CloudFlare Pages, etc.
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for platform-specific instructions.

## 🔒 Security Features

- ✅ Input validation with Zod schemas
- ✅ Rate limiting (3 wallet connects/min, 5 mints/min)
- ✅ Error boundaries for graceful failures
- ✅ Sanitized logging (no sensitive data in logs)
- ✅ Security headers (CSP, XSS protection)
- ✅ HTTPS-only in production
- ✅ Smart contract access control

## 📊 Performance

- ✅ Lighthouse score: 90+ (all metrics)
- ✅ Code splitting with React.lazy
- ✅ Service Worker caching
- ✅ TanStack Query with retry logic
- ✅ Debounced API calls
- ✅ Optimized bundle size

## 🧪 Testing & Quality

```bash
# Type checking
npm run check

# Linting
npm run lint

# Build test
npm run build
```

## 📱 PWA Features

- ✅ Installable on mobile & desktop
- ✅ Offline functionality
- ✅ Push notifications (optional)
- ✅ Background sync (planned)
- ✅ Add to home screen

## 🔄 CI/CD

GitHub Actions workflow included for:
- ✅ Type checking
- ✅ Linting
- ✅ Build verification
- ✅ Automated deployments

See `.github/workflows/ci.yml`

## 📚 Documentation

### For New Developers
- **[docs/GETTING_STARTED.md](./docs/GETTING_STARTED.md)** — Clone, install, run, and understand the codebase
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — How the pieces fit together (diagrams, data flow, trust boundaries)
- **[docs/SCRYPTO_GUIDE.md](./docs/SCRYPTO_GUIDE.md)** — Build, deploy, and administer the smart contract

### For Operators
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** — Platform-specific deployment instructions
- **[README.production.md](./README.production.md)** — Comprehensive production checklist
- **[SELF_HOSTING.md](./SELF_HOSTING.md)** — Complete self-hosting guide ($5/month)
- **[docs/BRANCH_PROTECTION.md](./docs/BRANCH_PROTECTION.md)** — GitHub branch protection setup

### For Auditors
- **[docs/security-audit.md](./docs/security-audit.md)** — Full security audit (STRIDE, OWASP, findings)
- **[docs/backend-architecture-audit.md](./docs/backend-architecture-audit.md)** — Backend architecture review
- **[docs/ux-audit.md](./docs/ux-audit.md)** — UX research and fixes

### Migration & Independence
- **[INDEPENDENCE.md](./INDEPENDENCE.md)** — Complete independence proof & alternatives
- **[LOVABLE_INDEPENDENCE_CHECKLIST.md](./LOVABLE_INDEPENDENCE_CHECKLIST.md)** — Verify zero Lovable dependencies ⭐

## 🎯 Complete Independence Verification

**Run the checklist to verify zero Lovable dependencies:**
```bash
# Verify no Lovable packages
grep -i "lovable" package.json vite.config.ts
# Expected: No results ✓

# Verify no Lovable in code
grep -r "lovable\|Lovable" src/
# Expected: No results ✓

# Build without Lovable
npm install && npm run build
# Expected: Builds successfully ✓
```

See **[LOVABLE_INDEPENDENCE_CHECKLIST.md](./LOVABLE_INDEPENDENCE_CHECKLIST.md)** for complete verification.

### What You Own
✅ All source code (in your GitHub)  
✅ All data (your device / the Radix blockchain)  
✅ All deployments (your hosting)  
✅ All functionality (no lock-in)  

### What Lovable Has
❌ No access to your code  
❌ No access to your data  
❌ No control over your app  

**Lovable was the development tool. The output is 100% yours, forever.**

## 🎯 Complete Independence

This codebase has **ZERO production dependencies on Lovable**:

✅ **Pure Open Source** - Standard React + Vite + TypeScript  
✅ **Standard Dependencies** - All from public npm registry  
✅ **Deploy Anywhere** - Vercel, Netlify, AWS, Docker, VPS, GitHub Pages  
✅ **Own Your Services** - OneSignal (optional), Radix DLT (decentralized)  
✅ **Replace Anything** - Every service has documented alternatives  
✅ **No Runtime Lock-in** - Production builds have zero Lovable code  

### Development vs Production
- **Development**: Optional Lovable editor integration (componentTagger) for enhanced dev experience
- **Production**: 100% Lovable-free - pure React app with standard dependencies
- **Works identically** whether developed in Lovable, VS Code, or any IDE

### Lovable-Free Production Guarantee
- ✅ No Lovable packages in production bundle
- ✅ No Lovable APIs in application code
- ✅ No Lovable services required at runtime
- ✅ componentTagger is dev-only (never bundled)
- ✅ Can build and deploy from any environment

See **[INDEPENDENCE.md](./INDEPENDENCE.md)** for complete proof and alternatives.

### Using with Lovable (Optional)
- Continue developing in Lovable if desired
- Changes sync bidirectionally with GitHub
- Can switch between Lovable and local IDE anytime
- **Or ignore Lovable completely - your choice!**

## 🤝 Contributing

This is a production-ready application. For contributions:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

[Your License Here]

## 🆘 Support

For issues or questions:
- Check [README.production.md](./README.production.md) troubleshooting section
- Review [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help
- Open an issue on GitHub

## 🎯 Roadmap

- [x] Web3 wallet integration
- [x] Offline-first architecture
- [x] Production error handling
- [x] Rate limiting & security
- [x] PWA capabilities
- [ ] User authentication
- [ ] Leaderboards
- [ ] NFT marketplace
- [ ] Social features

---

**Built with ❤️ using React + Radix DLT**
