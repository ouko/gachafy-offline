import type OneSignal from 'react-onesignal';
import { logger } from './logger';
import { getConsent, setConsent } from './privacy';

let sdkPromise: Promise<typeof OneSignal> | null = null;

async function loadOneSignalSdk(): Promise<typeof OneSignal> {
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-gachafi-onesignal]');
      const script = existing ?? document.createElement('script');
      script.src = '/onesignal/OneSignalSDK.page.js';
      script.integrity = 'sha384-9WymDdowrrUwJuXZ2joqlQYNQSPWfKsyBecZsqaJgsTur2qmjjrc3YQVGiaFdFdA';
      script.crossOrigin = 'anonymous';
      script.dataset.gachafiOnesignal = 'true';
      script.onerror = () => reject(new Error('OneSignal SDK failed to load'));
      script.onload = () => {
        import('react-onesignal').then((module) => resolve(module.default)).catch(reject);
      };
      if (!existing) document.head.appendChild(script);
    });
  }
  return sdkPromise;
}

export class OneSignalService {
  private isInitialized = false;
  private appId = import.meta.env.VITE_ONESIGNAL_APP_ID || '';
  private safariWebId = import.meta.env.VITE_ONESIGNAL_SAFARI_WEB_ID || '';

  get isConfigured(): boolean {
    return Boolean(this.appId);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized || !this.isConfigured || !getConsent('notifications')) return;

    try {
      const sdk = await loadOneSignalSdk();
      await sdk.init({
        appId: this.appId,
        ...(this.safariWebId ? { safari_web_id: this.safariWebId } : {}),
        allowLocalhostAsSecureOrigin: import.meta.env.DEV,
      });

      sdk.Notifications.addEventListener('click', (event) => {
        const url = event.result?.url;
        if (typeof window === 'undefined' || !url) return;
        try {
          const parsed = new URL(url, window.location.origin);
          if (parsed.origin !== window.location.origin) {
            logger.warn('Rejecting external notification URL', null, 'OneSignal');
            return;
          }
          window.location.href = parsed.pathname + parsed.search;
        } catch {
          logger.warn('Malformed notification URL', null, 'OneSignal');
        }
      });

      this.isInitialized = true;
    } catch (error) {
      sdkPromise = null;
      logger.error('OneSignal initialization failed', error, 'OneSignal');
      throw error;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isConfigured) return false;
    setConsent('notifications', true);
    try {
      await this.initialize();
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') setConsent('notifications', false);
      return permission === 'granted';
    } catch (error) {
      setConsent('notifications', false);
      logger.error('Notification permission request failed', error, 'OneSignal');
      return false;
    }
  }

  async optOut(): Promise<void> {
    if (!this.isConfigured || !getConsent('notifications')) return;
    try {
      await this.initialize();
      const sdk = await loadOneSignalSdk();
      await sdk.Notifications.optOut();
    } catch (error) {
      logger.error('Notification opt-out failed', error, 'OneSignal');
      throw error;
    }
  }

  async getPlayerId(): Promise<string | null> {
    if (!this.isConfigured || !getConsent('notifications')) return null;
    await this.initialize();
    const sdk = await loadOneSignalSdk();
    return sdk.User.PushSubscription.id ?? null;
  }

  async isSubscribed(): Promise<boolean> {
    if (!this.isConfigured || !getConsent('notifications')) return false;
    await this.initialize();
    return Notification.permission === 'granted';
  }
}

export const oneSignalService = new OneSignalService();
