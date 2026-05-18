# GachaFi

A TikTok-to-DeFi gacha game where every swipe opens loot and every interaction fits on a thumb. Reimagined for Gen Z with a professional game UI and high-stakes visual feedback.

## Features

- 🎮 **One-Handed Gameplay:** Optimized for swipe/tap gestures with a thumb-friendly layout.
- 📱 **Progressive Web App:** Offline-first architecture, installable on home screens.
- ⚡ **High-Impact UI:** Custom game-style HUD, 3D buttons, and cinematic reveal animations.
- 🌌 **Visual Depth:** Dynamic nebula backgrounds, particle systems, and rarity-based visual effects.
- 💰 **Radix Integration:** Securely connected to the Radix Babylon network with real-time balance tracking.
- 📊 **PostHog Analytics:** Event tracking and user journey optimization.
- 🎯 **WCAG 2.1 AA Compliant:** Accessible design with keyboard navigation support.

## Tech Stack

- **React 17:** Frontend framework.
- **Vite:** Next-generation frontend tooling.
- **TailwindCSS:** Utility-first styling with custom game-themed presets.
- **Framer Motion:** Fluid, high-performance animations.
- **Zustand:** Lightweight state management.
- **Radix Dapp Toolkit:** Seamless wallet integration.
- **Vitest:** Blazing fast unit testing.
- **Workbox:** PWA and service worker management.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run unit tests
npm run test

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create `.env.local` file:

```env
VITE_RADIX_NETWORK_ID=1  # 1 for Mainnet, 2 for Stokenet
VITE_RADIX_DAPP_ADDRESS=your_dapp_definition_address
VITE_POSTHOG_KEY=your_posthog_key
VITE_POSTHOG_HOST=https://app.posthog.com
```

## Testing

GachaFi uses **Vitest** for testing. All component tests are located in `src/components/__tests__`.

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test -- --coverage
```

## License

MIT
