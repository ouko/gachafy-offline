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

/** Cross-chain bridge UI. The current implementation is a placeholder. */
export const FEATURE_BRIDGE = truthy(import.meta.env.VITE_FEATURE_BRIDGE);

/**
 * LIVE bridge execution. Even when FEATURE_BRIDGE is on (showing the UI),
 * this flag must ALSO be enabled before the "Start Bridge" button works.
 * This prevents accidental demo-to-production activation.
 */
export const FEATURE_BRIDGE_LIVE = truthy(import.meta.env.VITE_FEATURE_BRIDGE_LIVE);

/**
 * Offline mint queue. Turning this on stores mint intents in IndexedDB while
 * offline; they're replayed against the wallet when connectivity returns.
 * Replay still requires the wallet to be reachable to sign — there is no
 * trustless way to mint without that, so this is a UX nicety only.
 */
export const FEATURE_OFFLINE_QUEUE = truthy(import.meta.env.VITE_FEATURE_OFFLINE_QUEUE);

/** Creator dashboard. Honest zeros until on-chain reads land. */
export const FEATURE_CREATOR_DASHBOARD =
  import.meta.env.VITE_FEATURE_CREATOR_DASHBOARD === undefined
    ? true
    : truthy(import.meta.env.VITE_FEATURE_CREATOR_DASHBOARD);

/** True once the gacha Scrypto component is deployed and addresses are wired up. */
export const GACHA_DEPLOYED = Boolean(
  import.meta.env.VITE_GACHA_PACKAGE_ADDRESS &&
  import.meta.env.VITE_GACHA_COMPONENT_ADDRESS &&
  import.meta.env.VITE_GACHA_BADGE_RESOURCE,
);
