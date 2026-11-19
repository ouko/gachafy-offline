import { beforeEach, describe, expect, it } from 'vitest';
import { clearLocalData, exportLocalData, getConsent, hasConsentChoice, setConsent } from './privacy';
import { offlineQueueDB } from '@/utils/offlineQueue';

describe('privacy controls', () => {
  beforeEach(async () => {
    localStorage.clear();
    await offlineQueueDB.clearAllRequests();
  });

  it('denies optional processing until explicit consent', () => {
    expect(getConsent('errorReporting')).toBe(false);
    expect(getConsent('notifications')).toBe(false);
    expect(hasConsentChoice()).toBe(false);
  });

  it('persists categories independently with a timestamp', () => {
    setConsent('errorReporting', true);
    expect(getConsent('errorReporting')).toBe(true);
    expect(getConsent('notifications')).toBe(false);
    expect(hasConsentChoice()).toBe(true);

    const stored = JSON.parse(localStorage.getItem('gachafi.consent.v1')!);
    expect(stored.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('fails closed when stored consent is malformed', () => {
    localStorage.setItem('gachafi.consent.v1', '{broken');
    expect(getConsent('errorReporting')).toBe(false);
    expect(hasConsentChoice()).toBe(false);
  });

  it('exports GachaFi local data and queued mint requests', async () => {
    localStorage.setItem('gachafi.completedDates.v2', JSON.stringify(['2026-11-20']));
    localStorage.setItem('unrelated.site.key', 'not exported');
    await offlineQueueDB.addMintRequest({
      id: 'request-1',
      tier: { id: 'common', name: 'Common', price: 8, rarity: 'common' },
      timestamp: 1,
      nonce: 1,
      userId: 'account_tdx_2_1test',
    });

    const exported = JSON.parse(await exportLocalData());
    expect(exported.localStorage['gachafi.completedDates.v2']).toContain('2026-11-20');
    expect(exported.localStorage['unrelated.site.key']).toBeUndefined();
    expect(exported.offlineQueue).toHaveLength(1);
    expect(exported.exportedAt).toMatch(/^\d{4}-/);
  });

  it('clears only GachaFi local keys and the offline queue', async () => {
    localStorage.setItem('gachafi.completedDates.v2', '[]');
    localStorage.setItem('lastOpenDate', '2026-11-20');
    localStorage.setItem('unrelated.site.key', 'preserved');
    await offlineQueueDB.addMintRequest({
      id: 'request-1',
      tier: { id: 'common', name: 'Common', price: 8, rarity: 'common' },
      timestamp: 1,
      nonce: 1,
    });

    await clearLocalData();
    expect(localStorage.getItem('gachafi.completedDates.v2')).toBeNull();
    expect(localStorage.getItem('lastOpenDate')).toBeNull();
    expect(localStorage.getItem('unrelated.site.key')).toBe('preserved');
    expect(await offlineQueueDB.getAllMintRequests()).toEqual([]);
  });
});
