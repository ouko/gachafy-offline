/**
 * Centralised feature flags. Source of truth: VITE_FEATURE_* env vars.
 *
 * Flags are evaluated once at module load. To toggle, set the env var and
 * rebuild — these aren't runtime-reloadable.
 */

const truthy = (v: unknown): boolean => {
  if (typeof v !== 'string') return false;
  const norm = v.trim().toLowerCase();
  return norm === 'true' || norm === '1' || norm === 'yes' || norm === 'on';
};

/**
 * Offline mint queue. Turning this on stores mint intents in IndexedDB while
 * offline; they're replayed against the wallet when connectivity returns.
 * Replay still requires the wallet to be reachable to sign — there is no
 * trustless way to mint without that, so this is a UX nicety only.
 */
export const FEATURE_OFFLINE_QUEUE = truthy(import.meta.env.VITE_FEATURE_OFFLINE_QUEUE);

/** True once the gacha Scrypto component is deployed and addresses are wired up. */
export const GACHA_DEPLOYED = Boolean(
  import.meta.env.VITE_GACHA_PACKAGE_ADDRESS &&
  import.meta.env.VITE_GACHA_COMPONENT_ADDRESS &&
  import.meta.env.VITE_GACHA_BADGE_RESOURCE,
);
