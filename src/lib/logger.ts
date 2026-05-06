import { sanitizeForLogging } from './validation';
import * as Sentry from '@sentry/react';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  timestamp: number;
}

/**
 * Initialize Sentry if a DSN is configured.
 * Call this once from main.tsx before rendering the app.
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    console.info('[Logger] Sentry DSN not configured — error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'development',
    release: import.meta.env.VITE_APP_VERSION || '0.0.0',
    // Only send errors/warnings — info/debug stay local
    beforeSend(event) {
      const level = event.level;
      if (level === 'info' || level === 'debug') return null;
      return event;
    },
    // Reduce noise from browser extensions
    denyUrls: [
      /^chrome-extension:/,
      /^moz-extension:/,
      /^safari-extension:/,
    ],
    // Sample rate — adjust based on traffic volume
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  });
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;
  private sentryEnabled = Boolean(import.meta.env.VITE_SENTRY_DSN);

  private log(level: LogLevel, message: string, data?: unknown, context?: string) {
    const entry: LogEntry = {
      level,
      message,
      context,
      data: data ? sanitizeForLogging(data) : undefined,
      timestamp: Date.now(),
    };

    // Add to buffer
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }

    // Console output in development
    if (this.isDevelopment) {
      const prefix = context ? `[${context}]` : '';
      const logMethod = console[level] || console.log;

      if (data) {
        logMethod(`${prefix} ${message}`, data);
      } else {
        logMethod(`${prefix} ${message}`);
      }
    } else if (level === 'error' || level === 'warn') {
      const logMethod = console[level];
      logMethod(`${level.toUpperCase()}: ${message}`, entry);
    }

    // Send to Sentry in production for errors and warnings
    if (this.sentryEnabled && !this.isDevelopment && (level === 'error' || level === 'warn')) {
      const scope = new Sentry.Scope();
      if (context) scope.setTag('context', context);
      if (data) scope.setContext('data', entry.data);

      if (level === 'error') {
        const err = data instanceof Error ? data : new Error(message);
        Sentry.captureException(err, scope);
      } else {
        Sentry.captureMessage(message, level);
      }
    }
  }

  debug(message: string, data?: unknown, context?: string) {
    this.log('debug', message, data, context);
  }

  info(message: string, data?: unknown, context?: string) {
    this.log('info', message, data, context);
  }

  warn(message: string, data?: unknown, context?: string) {
    this.log('warn', message, data, context);
  }

  error(message: string, error?: unknown, context?: string) {
    this.log('error', message, error, context);
  }

  getRecentLogs(count = 50): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  clearLogs() {
    this.logBuffer = [];
  }
}

export const logger = new Logger();
