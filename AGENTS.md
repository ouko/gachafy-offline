# Agent Guidelines for GachaFi

This document provides context and instructions for AI agents working on the GachaFi codebase.

## UI & UX Principles

- **Game-First Aesthetic:** Avoid generic web app patterns. Use rich gradients, 3D buttons, and cinematic transitions.
- **Visual Feedback:** Every interaction should have a clear visual response (glows, pulses, or scales).
- **One-Handed Operation:** Keep primary actions in the lower half of the screen ("Thumb Zone").
- **Rarity Language:** Always respect the rarity color system:
  - Common: Gray/Silver
  - Rare: Cyan
  - Epic: Purple
  - Legendary: Pink/Gold

## Technical Constraints

- **React 17 & Vite:** Note the React version when adding new dependencies or using newer React 18 features (like `createRoot`).
- **PWA First:** Ensure any new routes or assets are properly handled by the Service Worker (configured in `vite.config.js`).
- **Testing:** Use **Vitest** for all tests. Mock the Zustand store and Radix Dapp Toolkit as shown in `src/components/__tests__`.

## Maintenance Tasks

- **Verify Background:** If you change the `AnimatedBackground`, ensure it doesn't impact performance on mobile devices.
- **RDT Compatibility:** Be careful with Radix Dapp Toolkit updates, as they often introduce breaking changes in the wallet state subscription.
- **Audit UI:** Regularly check `references/ui_analysis.md` to ensure the app doesn't slide back into "generic web app" territory.
