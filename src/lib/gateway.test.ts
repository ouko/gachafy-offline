import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getBadgeByTransaction, getBadgeInventory, getTotalMinted } from './gateway';

vi.mock('./radix-config', () => ({
  RADIX_CONFIG: {
    gatewayUrl: 'https://gateway.test',
    gachaBadgeResourceAddress: 'resource_tdx_2_1nfxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    gachaComponentAddress: 'component_tdx_2_1test',
  },
}));

const ACCOUNT = 'account_tdx_2_129vr3rwyz7gnwf35kkuxvx0fs4hkz0n5hem9utaejqra3sxf0m5wej';
const RESOURCE = 'resource_tdx_2_1nfxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

const jsonResponse = (body: unknown, ok = true) => ({
  ok,
  statusText: ok ? 'OK' : 'Unavailable',
  json: vi.fn().mockResolvedValue(body),
}) as unknown as Response;

const badgeData = (id = '#42#') => ({
  non_fungible_ids: [{
    non_fungible_id: id,
    is_burned: false,
    data: {
      programmatic_json: {
        kind: 'Tuple',
        fields: [
          { field_name: 'name', kind: 'String', value: 'RARE Badge #42' },
          { field_name: 'tier', kind: 'String', value: 'rare' },
          { field_name: 'rarity', kind: 'String', value: 'rare' },
          { field_name: 'sp', kind: 'U64', value: '350' },
          { field_name: 'nonce', kind: 'U64', value: '123' },
          { field_name: 'minted_at_epoch', kind: 'U64', value: '99' },
          { field_name: 'image_url', kind: 'String', value: 'https://gachafi.app/badges/rare.png' },
          { field_name: 'description', kind: 'String', value: 'A rare GachaFi badge awarding 350 SP.' },
        ],
      },
    },
  }],
});

describe('Radix Gateway badge reads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves the BadgeMinted event and loads the minted NFT', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        transaction: {
          receipt: {
            events: [{
              name: 'BadgeMinted',
              data: { kind: 'Tuple', fields: [{ field_name: 'badge_id', value: '#42#' }] },
            }],
          },
        },
      }))
      .mockResolvedValueOnce(jsonResponse(badgeData()));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getBadgeByTransaction('txid_test_123')).resolves.toMatchObject({
      id: '#42#',
      resourceAddress: RESOURCE,
      name: 'RARE Badge #42',
      sp: 350,
      rarity: 'rare',
      imageUrl: 'https://gachafi.app/badges/rare.png',
    });
    expect(fetchMock.mock.calls[0][0]).toContain('/transaction/committed-details');
    expect(fetchMock.mock.calls[1][0]).toContain('/state/non-fungible/data');
  });

  it('returns null while the mint event is not indexed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ transaction: { receipt: { events: [] } } })));
    await expect(getBadgeByTransaction('txid_test_123')).resolves.toBeNull();
  });

  it('loads paginated vault IDs and batches NFT data', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        items: [{
          resource_address: RESOURCE,
          vaults: {
            items: [{ vault_address: 'internal_vault_1', items: ['#1#'], next_cursor: 'vault-page-2' }],
          },
        }],
      }))
      .mockResolvedValueOnce(jsonResponse({ items: ['#2#'] }))
      .mockResolvedValueOnce(jsonResponse({
        non_fungible_ids: [
          { ...badgeData('#1#').non_fungible_ids[0] },
          { ...badgeData('#2#').non_fungible_ids[0] },
        ],
      }));
    vi.stubGlobal('fetch', fetchMock);

    const badges = await getBadgeInventory(ACCOUNT);
    expect(badges.map((badge) => badge.id).sort()).toEqual(['#1#', '#2#']);
    expect(fetchMock.mock.calls[1][0]).toContain('/state/entity/page/non-fungible-vault/ids');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('returns an empty collection only after a successful empty response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ items: [] })));
    await expect(getBadgeInventory(ACCOUNT)).resolves.toEqual([]);
  });

  it('does not convert gateway failures into an empty collection', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, false)));
    await expect(getBadgeInventory(ACCOUNT)).rejects.toThrow('Gateway request failed');
  }, 15000);

  it('reads total minted supply from component state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      items: [{
        details: {
          type: 'Component',
          state: { kind: 'Tuple', fields: [{ field_name: 'mint_counter', kind: 'U64', value: '43' }] },
        },
      }],
    })));
    await expect(getTotalMinted()).resolves.toBe(42);
  });
});
