# GachaFi - Offline-First Web3 Gacha Gaming

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
# Vercel (recommended)
npm i -g vercel
vercel

# Or Netlify
npm i -g netlify-cli
netlify deploy --prod

# Or Docker
docker-compose up -d
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
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: React Context + TanStack Query
- **PWA**: Service Workers + IndexedDB

## 📋 Prerequisites

- Node.js 18+ (or Bun)
- Supabase account (free tier works)
- Radix wallet for testing
- (Optional) OneSignal for push notifications

## 🔧 Environment Variables

Create `.env` from `.env.example`:

```bash
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id

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
├── supabase/           # Supabase config & functions
├── .env.example        # Environment template
├── Dockerfile          # Docker configuration
├── docker-compose.yml  # Docker Compose setup
├── vercel.json        # Vercel deployment config
├── netlify.toml       # Netlify deployment config
├── DEPLOYMENT.md      # Quick deployment guide
├── README.production.md  # Detailed production guide
└── DATABASE_ALTERNATIVES.md  # Database migration guide
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
- ✅ Supabase RLS ready

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

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Quick deployment guide
- **[README.production.md](./README.production.md)** - Comprehensive production guide
- **[DATABASE_ALTERNATIVES.md](./DATABASE_ALTERNATIVES.md)** - Database migration options

## 🎯 Independent of Lovable

This codebase is **fully portable** and runs independently:

✅ **No Lovable Dependencies** - Pure React/Vite application  
✅ **Standard Tooling** - npm, Vite, TypeScript  
✅ **Deploy Anywhere** - Vercel, Netlify, AWS, Docker, etc.  
✅ **Own Your Data** - Supabase project you control  
✅ **GitHub Integration** - Two-way sync available  

### Using with Lovable (Optional)
- Continue developing in Lovable if desired
- Changes sync bidirectionally with GitHub
- Can switch between Lovable and local IDE anytime

### Fully Independent Usage
1. Clone from GitHub
2. Configure environment variables
3. Deploy to any hosting platform
4. Never touch Lovable again if you prefer

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
