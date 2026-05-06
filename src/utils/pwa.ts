import { logger } from '@/lib/logger';

// PWA Service Worker Registration
export const registerSW = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          logger.info('Service worker registered', { scope: registration.scope }, 'PWA');
        })
        .catch((registrationError) => {
          logger.error('Service worker registration failed', registrationError, 'PWA');
        });
    });
  }
};

// ---------------------------------------------------------------------------
// Install prompt — module-level singleton so multiple components can share
// the same deferred prompt without registering duplicate listeners.
// ---------------------------------------------------------------------------

let deferredPrompt: Event | undefined;
let listenerInstalled = false;

export const setupPWAInstall = () => {
  if (!listenerInstalled && 'BeforeInstallPromptEvent' in window) {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      logger.info('PWA install prompt available', null, 'PWA');
    });
    listenerInstalled = true;
  }

  return {
    showInstallPrompt: async () => {
      if (deferredPrompt) {
        (deferredPrompt as Event & { prompt: () => void }).prompt();
        const { outcome } = await (deferredPrompt as Event & { userChoice: Promise<{ outcome: string }> }).userChoice;
        logger.info(`User response to the install prompt: ${outcome}`, null, 'PWA');
        deferredPrompt = undefined;
      }
    },
    isPromptAvailable: () => !!deferredPrompt,
  };
};

// Detect if running as an installed PWA (standalone/app window).
// iOS Safari exposes `navigator.standalone`; everywhere else we use the
// display-mode media query.
export const isStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
};
