/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ONESIGNAL_APP_ID?: string;
  readonly VITE_ONESIGNAL_SAFARI_WEB_ID?: string;

  readonly VITE_RADIX_NETWORK?: 'stokenet' | 'mainnet';
  readonly VITE_RADIX_DAPP_DEFINITION?: string;
  readonly VITE_RADIX_GATEWAY_URL?: string;
  readonly VITE_GACHA_PACKAGE_ADDRESS?: string;
  readonly VITE_GACHA_COMPONENT_ADDRESS?: string;
  readonly VITE_XRD_RESOURCE_ADDRESS?: string;

  readonly VITE_FEATURE_BRIDGE?: string;
  readonly VITE_FEATURE_OFFLINE_QUEUE?: string;
  readonly VITE_FEATURE_CREATOR_DASHBOARD?: string;

  readonly VITE_SENTRY_DSN?: string;

  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace JSX {
  interface IntrinsicElements {
    'radix-connect-button': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  }
}
