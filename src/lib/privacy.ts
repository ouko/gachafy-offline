import { offlineQueueDB } from '@/utils/offlineQueue';

export type ConsentCategory = 'errorReporting' | 'notifications';

interface ConsentRecord {
  errorReporting: boolean;
  notifications: boolean;
  updatedAt: string;
}

const CONSENT_KEY = 'gachafi.consent.v1';
const LOCAL_KEYS = new Set(['lastOpenDate', 'streakMap']);

function readConsent(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentRecord>;
    if (typeof parsed.errorReporting !== 'boolean' || typeof parsed.notifications !== 'boolean') {
      return null;
    }
    return {
      errorReporting: parsed.errorReporting,
      notifications: parsed.notifications,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    };
  } catch {
    return null;
  }
}

export function getConsent(category: ConsentCategory): boolean {
  return readConsent()?.[category] ?? false;
}

export function hasConsentChoice(): boolean {
  return readConsent() !== null;
}

export function setConsent(category: ConsentCategory, value: boolean): void {
  const current = readConsent() ?? {
    errorReporting: false,
    notifications: false,
    updatedAt: '',
  };
  const next: ConsentRecord = {
    ...current,
    [category]: value,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(next));
}

function isGachaFiKey(key: string): boolean {
  return key.startsWith('gachafi.') || LOCAL_KEYS.has(key);
}

export async function exportLocalData(): Promise<string> {
  const values: Record<string, string> = {};
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && isGachaFiKey(key)) values[key] = localStorage.getItem(key) ?? '';
  }

  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    localStorage: values,
    offlineQueue: await offlineQueueDB.getAllMintRequests(),
  }, null, 2);
}

export async function clearLocalData(): Promise<void> {
  const keysToRemove: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && isGachaFiKey(key)) keysToRemove.push(key);
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
  await offlineQueueDB.clearAllRequests();
}
