import { RateLimitError } from './errorHandling';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

/**
 * ⚠️ SECURITY WARNING: This is a CLIENT-SIDE rate limiter.
 *
 * It provides UX friction (prevents accidental rapid clicks) but ZERO
 * real security. A determined attacker can:
 * - Open unlimited incognito tabs
 * - Clear localStorage / sessionStorage
 * - Modify the bundled JavaScript
 * - Bypass entirely with curl/scripts
 *
 * For actual abuse prevention, implement server-side rate limiting
 * (e.g., Supabase Edge Functions, Cloudflare Workers, API Gateway).
 * This class should be treated as "UX debouncing," not security.
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  check(key: string, config: RateLimitConfig): boolean {
    const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get existing requests for this key
    let timestamps = this.requests.get(fullKey) || [];

    // Filter out old requests outside the window
    timestamps = timestamps.filter(ts => ts > windowStart);

    // Check if limit exceeded
    if (timestamps.length >= config.maxRequests) {
      return false;
    }

    // Add current request
    timestamps.push(now);
    this.requests.set(fullKey, timestamps);

    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }

    return true;
  }

  async limit<T>(
    key: string,
    fn: () => Promise<T>,
    config: RateLimitConfig
  ): Promise<T> {
    if (!this.check(key, config)) {
      throw new RateLimitError('Too many requests. Please try again later.');
    }

    return await fn();
  }

  private cleanup() {
    const now = Date.now();
    const maxAge = 60000; // 1 minute

    for (const [key, timestamps] of this.requests.entries()) {
      const filtered = timestamps.filter(ts => now - ts < maxAge);
      if (filtered.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, filtered);
      }
    }
  }

  reset(key?: string) {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }
}

export const rateLimiter = new RateLimiter();

// Debounce utility
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, waitMs);
  };
}

// Throttle utility
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let lastRan = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return function throttled(...args: Parameters<T>) {
    const now = Date.now();

    if (now - lastRan >= limitMs) {
      func(...args);
      lastRan = now;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        func(...args);
        lastRan = Date.now();
        timeoutId = null;
      }, limitMs - (now - lastRan));
    }
  };
}
