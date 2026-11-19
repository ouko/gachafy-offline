import { z } from 'zod';
import { NetworkError } from './errorHandling';
import { withRetry, withTimeout } from './errorHandling';
import { RADIX_CONFIG } from './radix-config';
import { txHashSchema, validateInput, walletAddressSchema } from './validation';

const MAX_PAGES = 100;
const NFT_BATCH_SIZE = 100;

interface SborValue {
  kind?: string;
  type_name?: string;
  field_name?: string;
  value?: unknown;
  fields?: SborValue[];
}

const sborValueSchema: z.ZodType<SborValue> = z.lazy(() => z.object({
  kind: z.string().optional(),
  type_name: z.string().optional(),
  field_name: z.string().optional(),
  value: z.unknown().optional(),
  fields: z.array(sborValueSchema).optional(),
}).passthrough());

const nonFungibleItemSchema = z.object({
  non_fungible_id: z.string().min(1),
  is_burned: z.boolean(),
  data: z.object({
    programmatic_json: sborValueSchema,
  }).passthrough().optional(),
}).passthrough();

const nonFungibleDataResponseSchema = z.object({
  non_fungible_ids: z.array(nonFungibleItemSchema),
}).passthrough();

const transactionResponseSchema = z.object({
  transaction: z.object({
    receipt: z.object({
      events: z.array(z.object({
        name: z.string(),
        data: sborValueSchema,
      }).passthrough()).optional(),
    }).passthrough().optional(),
  }).passthrough(),
}).passthrough();

const inventoryPageSchema = z.object({
  next_cursor: z.string().nullable().optional(),
  items: z.array(z.object({
    resource_address: z.string(),
    vaults: z.object({
      items: z.array(z.object({
        vault_address: z.string(),
        items: z.array(z.string()).optional(),
        next_cursor: z.string().nullable().optional(),
      }).passthrough()),
    }).passthrough(),
  }).passthrough()),
}).passthrough();

const vaultIdsPageSchema = z.object({
  next_cursor: z.string().nullable().optional(),
  items: z.array(z.string()),
}).passthrough();

const entityDetailsSchema = z.object({
  items: z.array(z.object({
    details: z.unknown().optional(),
  }).passthrough()),
}).passthrough();

export interface GachaBadge {
  id: string;
  resourceAddress: string;
  name: string;
  tier: string;
  rarity: string;
  sp: number;
  nonce: number;
  mintedAtEpoch: number;
  imageUrl: string;
  description: string;
}

async function gatewayRequest<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
  return withRetry(async () => {
    const response = await withTimeout(fetch(`${RADIX_CONFIG.gatewayUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }), 10000, 'Radix Gateway request timed out');

    if (!response.ok) {
      throw new NetworkError(`Gateway request failed: ${response.statusText}`);
    }

    try {
      return schema.parse(await response.json());
    } catch (error) {
      throw new NetworkError(error instanceof Error
        ? `Invalid Gateway response: ${error.message}`
        : 'Invalid Gateway response');
    }
  }, { maxAttempts: 3, delayMs: 250 });
}

function requiredConfiguration(value: string, name: string): string {
  if (!value) throw new NetworkError(`${name} is not configured`);
  return value;
}

function findField(value: SborValue | undefined, name: string): SborValue | undefined {
  if (!value) return undefined;
  const direct = value.fields?.find((field) => field.field_name === name);
  if (direct) return direct;
  for (const field of value.fields ?? []) {
    const nested = findField(field, name);
    if (nested) return nested;
  }
  return undefined;
}

function readString(root: SborValue, name: string, fallback?: string): string {
  const value = findField(root, name)?.value;
  if (typeof value === 'string' && value.length > 0) return value;
  if (fallback !== undefined) return fallback;
  throw new NetworkError(`Badge data is missing ${name}`);
}

function readSafeInteger(root: SborValue, name: string, fallback = 0): number {
  const raw = findField(root, name)?.value;
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new NetworkError(`Badge data has an invalid ${name}`);
  }
  return value;
}

function parseTier(value: string): string {
  if (value.length > 0 && value.length <= 32) return value;
  throw new NetworkError('Badge tier must contain 1-32 characters');
}

function parseBadge(
  item: z.infer<typeof nonFungibleItemSchema>,
  resourceAddress: string,
): GachaBadge {
  const root = item.data?.programmatic_json;
  if (!root) throw new NetworkError(`Badge ${item.non_fungible_id} has no data`);
  const tier = parseTier(readString(root, 'tier'));
  const rarity = parseTier(readString(root, 'rarity', tier));

  return {
    id: item.non_fungible_id,
    resourceAddress,
    name: readString(root, 'name', `${rarity.toUpperCase()} Badge`),
    tier,
    rarity,
    sp: readSafeInteger(root, 'sp'),
    nonce: readSafeInteger(root, 'nonce'),
    mintedAtEpoch: readSafeInteger(root, 'minted_at_epoch'),
    imageUrl: readString(root, 'image_url', `https://gachafi.app/badges/${tier}.png`),
    description: readString(root, 'description', `A ${rarity} GachaFi badge.`),
  };
}

async function getBadgeData(resourceAddress: string, id: string): Promise<GachaBadge> {
  const response = await gatewayRequest('/state/non-fungible/data', {
    resource_address: resourceAddress,
    non_fungible_ids: [id],
  }, nonFungibleDataResponseSchema);
  const item = response.non_fungible_ids.find((entry) => entry.non_fungible_id === id);
  if (!item || item.is_burned) throw new NetworkError('Minted badge data is unavailable');
  return parseBadge(item, resourceAddress);
}

export async function getBadgeByTransaction(txHash: string): Promise<GachaBadge | null> {
  validateInput(txHashSchema, txHash, 'Invalid transaction hash');
  const resourceAddress = requiredConfiguration(
    RADIX_CONFIG.gachaBadgeResourceAddress,
    'VITE_GACHA_BADGE_RESOURCE',
  );
  const response = await gatewayRequest('/transaction/committed-details', {
    intent_hash: txHash,
    opt_ins: { receipt_events: true },
  }, transactionResponseSchema);
  const mintEvent = response.transaction.receipt?.events?.find((event) => event.name === 'BadgeMinted');
  if (!mintEvent) return null;
  const badgeId = findField(mintEvent.data, 'badge_id')?.value;
  if (typeof badgeId !== 'string' || !badgeId) {
    throw new NetworkError('BadgeMinted event has no badge ID');
  }
  return getBadgeData(resourceAddress, badgeId);
}

async function getAllVaultIds(
  accountAddress: string,
  resourceAddress: string,
  vaultAddress: string,
  initialIds: string[],
  initialCursor?: string | null,
): Promise<string[]> {
  const ids = [...initialIds];
  let cursor = initialCursor ?? undefined;
  let page = 0;
  while (cursor && page < MAX_PAGES) {
    const response = await gatewayRequest('/state/entity/page/non-fungible-vault/ids', {
      address: accountAddress,
      resource_address: resourceAddress,
      vault_address: vaultAddress,
      cursor,
      limit_per_page: NFT_BATCH_SIZE,
    }, vaultIdsPageSchema);
    ids.push(...response.items);
    cursor = response.next_cursor ?? undefined;
    page += 1;
  }
  if (cursor) throw new NetworkError('Badge inventory exceeded the pagination safety limit');
  return ids;
}

export async function getBadgeInventory(accountAddress: string): Promise<GachaBadge[]> {
  validateInput(walletAddressSchema, accountAddress, 'Invalid wallet address');
  const resourceAddress = requiredConfiguration(
    RADIX_CONFIG.gachaBadgeResourceAddress,
    'VITE_GACHA_BADGE_RESOURCE',
  );
  const ids = new Set<string>();
  let cursor: string | undefined;
  let page = 0;

  do {
    const response = await gatewayRequest('/state/entity/page/non-fungibles', {
      address: accountAddress,
      aggregation_level: 'Vault',
      opt_ins: { non_fungible_include_nfids: true },
      cursor,
      limit_per_page: NFT_BATCH_SIZE,
    }, inventoryPageSchema);

    for (const resource of response.items) {
      if (resource.resource_address !== resourceAddress) continue;
      for (const vault of resource.vaults.items) {
        const vaultIds = await getAllVaultIds(
          accountAddress,
          resourceAddress,
          vault.vault_address,
          vault.items ?? [],
          vault.next_cursor,
        );
        vaultIds.forEach((id) => ids.add(id));
      }
    }
    cursor = response.next_cursor ?? undefined;
    page += 1;
  } while (cursor && page < MAX_PAGES);

  if (cursor) throw new NetworkError('Badge inventory exceeded the pagination safety limit');

  const badges: GachaBadge[] = [];
  const idList = [...ids];
  for (let offset = 0; offset < idList.length; offset += NFT_BATCH_SIZE) {
    const batch = idList.slice(offset, offset + NFT_BATCH_SIZE);
    const response = await gatewayRequest('/state/non-fungible/data', {
      resource_address: resourceAddress,
      non_fungible_ids: batch,
    }, nonFungibleDataResponseSchema);
    for (const item of response.non_fungible_ids) {
      if (!item.is_burned) badges.push(parseBadge(item, resourceAddress));
    }
  }

  return badges.sort((a, b) => b.mintedAtEpoch - a.mintedAtEpoch || b.nonce - a.nonce);
}

export async function getTotalMinted(): Promise<number> {
  const componentAddress = requiredConfiguration(
    RADIX_CONFIG.gachaComponentAddress,
    'VITE_GACHA_COMPONENT_ADDRESS',
  );
  const response = await gatewayRequest('/state/entity/details', {
    addresses: [componentAddress],
  }, entityDetailsSchema);
  const details = response.items[0]?.details as { state?: SborValue } | undefined;
  const counter = findField(details?.state, 'mint_counter')?.value;
  const value = Number(counter);
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new NetworkError('Component state has an invalid mint counter');
  }
  return value - 1;
}
