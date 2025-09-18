import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { radixService } from '@/lib/radix';

interface Wallet {
  address: string;
  balance: number;
  isConnected: boolean;
  isDemoMode: boolean;
  isLoading: boolean;
  pendingTx: string;
}

interface Streak {
  current: number;
  bestEver: number;
  lastOpenDate: string | null;
  multiplier: number;
}

interface Booster {
  isActive: boolean;
  multiplier: number;
  expiresAt: string | null;
  type: 'luck' | 'xp' | 'rewards' | null;
}

interface GachaFiContextType {
  // Wallet state
  wallet: Wallet;
  
  // Streak state
  streak: Streak;
  
  // Booster state
  booster: Booster;
  
  // Offline queue state
  offlineQueue: {
    isOnline: boolean;
    queuedRequests: any[];
    queueMintRequest: (tier: any) => Promise<any>;
    processOfflineQueue: () => Promise<void>;
    clearQueue: () => Promise<void>;
  };
  
  // Actions
  connectWallet: () => Promise<void>;
  updateBalance: (amount: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  activateBooster: (type: 'luck' | 'xp' | 'rewards', multiplier: number, duration: number) => void;
  deactivateBooster: () => void;
}

const GachaFiContext = createContext<GachaFiContextType | undefined>(undefined);

interface GachaFiProviderProps {
  children: ReactNode;
}

export const GachaFiProvider: React.FC<GachaFiProviderProps> = ({ children }) => {
  // Wallet state
  const [wallet, setWallet] = useState<Wallet>({
    address: '',
    balance: 0,
    isConnected: false,
    isDemoMode: true, // Default to demo mode
    isLoading: false,
    pendingTx: '',
  });

  // Streak state
  const [streak, setStreak] = useState<Streak>({
    current: 0,
    bestEver: 0,
    lastOpenDate: null,
    multiplier: 1,
  });

  // Booster state
  const [booster, setBooster] = useState<Booster>({
    isActive: false,
    multiplier: 1,
    expiresAt: null,
    type: null,
  });

  // Offline queue
  const offlineQueueHook = useOfflineQueue();

  // Initialize wallet in demo mode
  useEffect(() => {
    const initWallet = async () => {
      try {
        console.log('GachaFi: Initializing in demo mode...');
        await radixService.initialize();
        
        // Try auto-connect, but fallback to demo mode
        try {
          const result = await radixService.connectWallet();
          if (result?.accounts?.length > 0) {
            setWallet(prev => ({
              ...prev,
              address: result.accounts[0].address,
              isConnected: true,
              isDemoMode: false,
            }));
          } else {
            // Stay in demo mode
            console.log('GachaFi: No wallet found, staying in demo mode');
          }
        } catch (error) {
          console.log('GachaFi: Wallet connection failed, staying in demo mode');
        }
      } catch (error) {
        console.error('GachaFi: Initialization error:', error);
      }
    };

    initWallet();
  }, []);

  // Poll balance
  useEffect(() => {
    if (!wallet.isConnected) return;

    const fetchBalance = async () => {
      try {
        if (wallet.isDemoMode) {
          setWallet(prev => ({ ...prev, balance: 35.5 }));
        } else {
          const liveBalance = await radixService.getBalance(wallet.address);
          setWallet(prev => ({ ...prev, balance: liveBalance }));
        }
      } catch (error) {
        console.error('GachaFi: Error fetching balance:', error);
      }
    };

    fetchBalance();
    const interval = wallet.isDemoMode ? null : setInterval(fetchBalance, 5000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [wallet.isConnected, wallet.address, wallet.isDemoMode]);

  // Check booster expiration
  useEffect(() => {
    if (!booster.isActive || !booster.expiresAt) return;

    const checkExpiration = () => {
      if (new Date() > new Date(booster.expiresAt!)) {
        deactivateBooster();
      }
    };

    const interval = setInterval(checkExpiration, 1000);
    return () => clearInterval(interval);
  }, [booster.isActive, booster.expiresAt]);

  // Actions
  const connectWallet = async () => {
    setWallet(prev => ({ ...prev, isLoading: true }));
    
    try {
      if (wallet.isDemoMode) {
        // Demo connection
        setTimeout(() => {
          const demoAddress = "account_tdx_2_demo_simulation_12345678";
          setWallet(prev => ({
            ...prev,
            address: demoAddress,
            isConnected: true,
            balance: 35.5,
            isLoading: false,
          }));
        }, 1000);
        return;
      }

      const result = await radixService.connectWallet();
      if (result?.accounts?.length > 0) {
        setWallet(prev => ({
          ...prev,
          address: result.accounts[0].address,
          isConnected: true,
          isDemoMode: false,
          isLoading: false,
        }));
      } else {
        // Fallback to demo mode
        setWallet(prev => ({
          ...prev,
          isDemoMode: true,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('GachaFi: Wallet connection error:', error);
      setWallet(prev => ({
        ...prev,
        isDemoMode: true,
        isLoading: false,
      }));
    }
  };

  const updateBalance = (amount: number) => {
    setWallet(prev => ({
      ...prev,
      balance: Math.max(0, prev.balance + amount),
    }));
  };

  const incrementStreak = () => {
    const today = new Date().toISOString().split('T')[0];
    setStreak(prev => {
      const newCurrent = prev.current + 1;
      return {
        ...prev,
        current: newCurrent,
        bestEver: Math.max(prev.bestEver, newCurrent),
        lastOpenDate: today,
        multiplier: Math.min(1 + (newCurrent - 1) * 0.1, 3), // Max 3x multiplier
      };
    });
  };

  const resetStreak = () => {
    setStreak(prev => ({
      ...prev,
      current: 0,
      multiplier: 1,
    }));
  };

  const activateBooster = (type: 'luck' | 'xp' | 'rewards', multiplier: number, duration: number) => {
    const expiresAt = new Date(Date.now() + duration * 1000).toISOString();
    setBooster({
      isActive: true,
      multiplier,
      expiresAt,
      type,
    });
  };

  const deactivateBooster = () => {
    setBooster({
      isActive: false,
      multiplier: 1,
      expiresAt: null,
      type: null,
    });
  };

  const contextValue: GachaFiContextType = {
    wallet,
    streak,
    booster,
    offlineQueue: offlineQueueHook,
    connectWallet,
    updateBalance,
    incrementStreak,
    resetStreak,
    activateBooster,
    deactivateBooster,
  };

  return (
    <GachaFiContext.Provider value={contextValue}>
      {children}
    </GachaFiContext.Provider>
  );
};

export const useGachaFi = () => {
  const context = useContext(GachaFiContext);
  if (context === undefined) {
    throw new Error('useGachaFi must be used within a GachaFiProvider');
  }
  return context;
};