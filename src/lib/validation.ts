/**
 * Input validation schemas (Zod).
 *
 * ALL user-facing inputs are validated through these schemas before they reach
 * the blockchain layer. This is a defence-in-depth measure — the smart contract
 * also validates, but catching bad input early prevents useless transactions
 * and improves error messages.
 *
 * Security-critical: walletAddressSchema uses a strict Bech32m regex. Do not
 * relax it without reading the security audit (docs/security-audit.md LOW-1).
 */

import { z } from 'zod';

// Wallet address validation — strict Bech32m format for Radix addresses.
// Stokenet: account_tdx_2_1...  |  Mainnet: account_rdx1...
// This regex is intentionally strict to prevent manifest injection.
export const walletAddressSchema = z.string()
  .regex(
    /^account_(tdx_2_1|rdx1)[a-z0-9]{50,65}$/,
    'Must be a valid Radix account address'
  );

// Transaction hash validation
export const txHashSchema = z.string()
  .min(10, 'Invalid transaction hash')
  .max(200, 'Invalid transaction hash');

// Tier validation
export const tierSchema = z.object({
  id: z.enum(['common', 'rare', 'epic']),
  name: z.string(),
  price: z.number().positive().max(1000),
  rarity: z.enum(['common', 'rare', 'epic']),
});

// Balance validation
// Sanity cap at 10 trillion XRD (~10× total supply). This catches obviously
// malformed/poisoned responses without rejecting realistic large balances.
export const balanceSchema = z.number()
  .nonnegative('Balance cannot be negative')
  .finite('Invalid balance value')
  .max(1e13, 'Balance exceeds plausible range');

// Nonce validation
export const nonceSchema = z.number()
  .int('Nonce must be an integer')
  .positive('Nonce must be positive')
  .max(Number.MAX_SAFE_INTEGER, 'Nonce too large');

// Mint request validation
export const mintRequestSchema = z.object({
  id: z.string().min(1),
  tier: tierSchema,
  timestamp: z.number().positive(),
  nonce: nonceSchema,
  userId: z.string().optional(),
});

// Validate and sanitize input
export const validateInput = <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  errorMessage?: string
): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => e.message).join(', ');
      throw new Error(errorMessage || `Validation failed: ${messages}`);
    }
    throw error;
  }
};

// Safe number parsing
export const safeParseNumber = (value: unknown, defaultValue = 0): number => {
  const parsed = Number(value);
  if (isNaN(parsed) || !isFinite(parsed)) {
    return defaultValue;
  }
  return parsed;
};

// Sanitize for logging (remove sensitive data)
export const sanitizeForLogging = (data: unknown): unknown => {
  if (typeof data === 'string') {
    // Truncate long strings, hide potential addresses/hashes
    if (data.startsWith('account_') || data.length > 50) {
      return `${data.slice(0, 10)}...${data.slice(-4)}`;
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeForLogging);
  }

  if (data && typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip sensitive fields
      if (['privateKey', 'secret', 'password', 'token'].includes(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeForLogging(value);
      }
    }
    return sanitized;
  }

  return data;
};
