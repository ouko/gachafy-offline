import OneSignal from 'react-onesignal';
import { logger } from './logger';

/**
 * OneSignal wrapper.
 *
 * If VITE_ONESIGNAL_APP_ID is not set, every method becomes a no-op so the
 * rest of the app can still run (notifications just don't appear). The
 * "demo mode" of the previous implementation has been removed — it
 * masqueraded as working push, which is worse than no push.
 *
 * NOTE: scheduled daily reminders cannot be implemented client-side via
 * setTimeout — the page is closed by then. Real scheduled push must be
 * driven from a backend (OneSignal REST API or scheduled job). The
 * client-side helper below requests permission and registers the device;
 * actual reminders need server work.
 */
export class OneSignalService {
  private isInitialized = false;
  private appId = import.meta.env.VITE_ONESIGNAL_APP_ID || '';
  private safariWebId = import.meta.env.VITE_ONESIGNAL_SAFARI_WEB_ID || '';

  get isConfigured(): boolean {
    return Boolean(this.appId);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (!this.isConfigured) {
      logger.info('OneSignal disabled (VITE_ONESIGNAL_APP_ID not set)', null, 'OneSignal');
      this.isInitialized = true;
      return;
    }

    try {
      await OneSignal.init({
        appId: this.appId,
        ...(this.safariWebId ? { safari_web_id: this.safariWebId } : {}),
        allowLocalhostAsSecureOrigin: import.meta.env.DEV,
      });

      OneSignal.Notifications.addEventListener('click', (event) => {
        logger.info('OneSignal notification clicked', { event }, 'OneSignal');
        if (typeof window === 'undefined') return;

        // Validate the notification URL before navigation to prevent
        // open redirects if the OneSignal account is compromised.
        const url = event.result?.url;
        if (url) {
          try {
            const parsed = new URL(url, window.location.origin);
            if (parsed.origin !== window.location.origin) {
              logger.warn('Rejecting external notification URL', { url }, 'OneSignal');
              return;
            }
            window.location.href = parsed.pathname + parsed.search;
            return;
          } catch {
            logger.warn('Malformed notification URL', { url }, 'OneSignal');
            return;
          }
        }

        window.location.href = '/open';
      });

      this.isInitialized = true;
      logger.info('OneSignal initialized', null, 'OneSignal');
    } catch (error) {
      logger.error('OneSignal initialization failed', error, 'OneSignal');
      // Mark initialized to avoid retry loops on every wallet connect.
      this.isInitialized = true;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isInitialized) await this.initialize();
    if (!this.isConfigured) return false;

    try {
      // Use the browser API for the prompt — OneSignal will pick up the
      // resulting subscription state.
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      logger.error('Notification permission request failed', error, 'OneSignal');
      return false;
    }
  }

  async getPlayerId(): Promise<string | null> {
    if (!this.isInitialized) await this.initialize();
    if (!this.isConfigured) return null;
    try {
      const id = await OneSignal.User.PushSubscription.id;
      return id ?? null;
    } catch (error) {
      logger.error('Failed to get OneSignal player ID', error, 'OneSignal');
      return null;
    }
  }

  async isSubscribed(): Promise<boolean> {
    if (!this.isInitialized) await this.initialize();
    if (!this.isConfigured) return false;
    try {
      return Notification.permission === 'granted';
    } catch (error) {
      logger.error('Failed to check subscription status', error, 'OneSignal');
      return false;
    }
  }
}

export const oneSignalService = new OneSignalService();
