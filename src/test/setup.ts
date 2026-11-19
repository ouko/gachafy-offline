import "@testing-library/jest-dom";
import "fake-indexeddb/auto";

const values = new Map<string, string>();
const storage: Storage = {
  get length() { return values.size; },
  clear: () => values.clear(),
  getItem: (key) => values.get(key) ?? null,
  key: (index) => [...values.keys()][index] ?? null,
  removeItem: (key) => { values.delete(key); },
  setItem: (key, value) => { values.set(key, String(value)); },
};
Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
Object.defineProperty(window, "localStorage", { value: storage, configurable: true });

// Mock import.meta.env for Vite environment variables
Object.defineProperty(globalThis, "import", {
  value: {
    meta: {
      env: {
        VITE_RADIX_NETWORK: "stokenet",
        VITE_RADIX_DAPP_DEFINITION: "account_tdx_2_129vr3rwyz7gnwf35kkuxvx0fs4hkz0n5hem9utaejqra3sxf0m5wej",
        VITE_XRD_RESOURCE_ADDRESS: "resource_tdx_2_1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxtfd2jc",
        VITE_GACHA_PACKAGE_ADDRESS: "package_tdx_2_1phrqqfg3245qqq2pqgpaua5qqqjgqqqqqqqqqqqqqqqqqqqqqqqq",
        VITE_GACHA_COMPONENT_ADDRESS: "component_tdx_2_1cxxxxxxxxxxgachaxxxxxxxxxx006838150368xxxxxxxxxcs2j46",
        VITE_GACHA_BADGE_RESOURCE: "resource_tdx_2_1nfxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        DEV: true,
        PROD: false,
      },
    },
  },
  writable: true,
});

// Mock matchMedia for responsive / PWA hooks
Object.defineProperty(globalThis, "matchMedia", {
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock crypto.getRandomValues for tests
Object.defineProperty(globalThis, "crypto", {
  value: {
    getRandomValues: (arr: Uint32Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 0xffffffff);
      }
      return arr;
    },
  },
});
