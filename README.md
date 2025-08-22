# GachaFi

A TikTok-to-DeFi gacha game where every swipe opens loot and every interaction fits on a thumb.

## Features

- 🎮 One-hand operation with swipe/tap gestures
- 📱 PWA with offline-first architecture
- ⚡ Built with React + Vite
- 🎨 Smooth animations with Framer Motion
- 🌐 TikTok sharing integration
- 📊 PostHog analytics
- 🎯 WCAG 2.1 AA compliant

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- React 18
- Vite
- TailwindCSS
- Framer Motion
- Zustand
- PostHog Analytics
- Workbox (PWA)

## Development Requirements

- Node.js 14+
- npm 6+

## Environment Variables

Create `.env.local` file:

```env
VITE_POSTHOG_KEY=your_key_here
VITE_POSTHOG_HOST=https://app.posthog.com
VITE_NETWORK=mainnet-sim
VITE_CONTRACT_ADDRESS=package_tbd
```

## Testing

```bash
npm run test
```

## License

MIT
