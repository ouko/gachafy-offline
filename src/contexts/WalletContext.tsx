/**
 * Wallet Context — single source of truth for wallet state.
 *
 * Holds:
 *   - Connected address
 *   - XRD balance (polled every 5s when visible, 30s when hidden)
 *   - Pending transaction hash
 *   - Optimistic balance delta (applied immediately on mint, removed when poll confirms)
 *
 * Connection flow:
 *   1. Component calls connectWallet() (exposed by this context)
 *   2. RadixService asks RDT to send a wallet data request
 *   3. User approves in their wallet extension / mobile app
 *   4. RDT fires onWalletData callback with the account address
 *   5. WalletContext updates state → components re-render
 *
 * This context also subscribes to RDT wallet data updates on mount so that
 * if the user disconnects in the wallet UI, the app reflects it immediately.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getRadixService } from "@/lib/radix-lazy";
import { logger } from "@/lib/logger";

interface Wallet {
  address: string;
  balance: number;
  /** Optimistic delta applied on top of the polled on-chain balance. */
  pendingDelta: number;
  isConnected: boolean;
  isLoading: boolean;
  isBalanceLoading: boolean;
  pendingTx: string;
}

interface WalletContextType {
  wallet: Wallet;
  connectWallet: () => Promise<void>;
  setPendingDelta: (delta: number) => void;
  clearPendingDelta: () => void;
  setPendingTx: (tx: string) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<Wallet>({
    address: "",
    balance: 0,
    pendingDelta: 0,
    isConnected: false,
    isLoading: false,
    isBalanceLoading: false,
    pendingTx: "",
  });

  // -------- Subscribe to wallet data ---------------------------------------
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    getRadixService().then((service) => {
      if (cancelled) return;
      // Eagerly initialize RDT in the background. On mobile this is
      // critical: sendRequest() must call the deep-link transport
      // immediately while the user-gesture from the click is still
      // active. Any async delay (module import, state setup) can cause
      // Safari / Chrome to block the navigation.
      service.initialize().catch(() => {
        // Initialization errors are already logged by RadixService.
      });
      unsubscribe = service.onWalletData((walletData: unknown) => {
        try {
          const address = walletData?.accounts?.[0]?.address ?? "";
          setWallet((prev) => ({
            ...prev,
            address,
            isConnected: !!address,
            pendingDelta: address === prev.address ? prev.pendingDelta : 0,
          }));
        } catch (e) {
          logger.warn("Failed parsing wallet data", e, "WalletContext");
        }
      });
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  // -------- Poll balance ---------------------------------------------------
  // Polling frequency adapts to page visibility to reduce battery drain
  // and unnecessary network requests when the user is not actively using
  // the app. Visible: 5s. Hidden: 30s.
  useEffect(() => {
    if (!wallet.isConnected || !wallet.address) return;

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval>;

    const fetchBalance = async () => {
      try {
        setWallet((prev) => ({ ...prev, isBalanceLoading: true }));
        const service = await getRadixService();
        const live = await service.getBalance(wallet.address);
        // Guard against state updates after unmount or address change
        if (cancelled) return;
        setWallet((prev) => ({ ...prev, balance: live, isBalanceLoading: false }));
      } catch (error) {
        if (cancelled) return;
        setWallet((prev) => ({ ...prev, isBalanceLoading: false }));
        logger.error("Error fetching balance", error, "WalletContext");
      }
    };

    const startPolling = () => {
      const delay = document.hidden ? 30000 : 5000;
      fetchBalance();
      intervalId = setInterval(fetchBalance, delay);
    };

    const handleVisibilityChange = () => {
      clearInterval(intervalId);
      startPolling();
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [wallet.isConnected, wallet.address]);

  // -------- Actions --------------------------------------------------------
  const connectWallet = useCallback(async () => {
    setWallet((prev) => ({ ...prev, isLoading: true }));
    try {
      const service = await getRadixService();
      const result = await service.connectWallet();
      if (result?.accounts?.length > 0) {
        const address = result.accounts[0].address;
        setWallet((prev) => ({
          ...prev,
          address,
          isConnected: true,
          isLoading: false,
        }));
      } else {
        setWallet((prev) => ({ ...prev, isLoading: false }));
        throw new Error("Please install Radix Wallet");
      }
    } catch (error) {
      logger.error("connectWallet failed", error, "WalletContext");
      setWallet((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const setPendingDelta = useCallback((delta: number) => {
    setWallet((prev) => ({ ...prev, pendingDelta: delta }));
  }, []);

  const clearPendingDelta = useCallback(() => {
    setWallet((prev) => ({ ...prev, pendingDelta: 0 }));
  }, []);

  const setPendingTx = useCallback((tx: string) => {
    setWallet((prev) => ({ ...prev, pendingTx: tx }));
  }, []);

  const displayedWallet: Wallet = {
    ...wallet,
    balance: Math.max(0, wallet.balance + wallet.pendingDelta),
  };

  return (
    <WalletContext.Provider
      value={{
        wallet: displayedWallet,
        connectWallet,
        setPendingDelta,
        clearPendingDelta,
        setPendingTx,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWalletContext must be used within a WalletProvider");
  }
  return context;
};
