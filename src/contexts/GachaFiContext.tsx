import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { radixService } from '@/lib/radix';
import { oneSignalService } from '@/lib/oneSignal';

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
  isTodayDone: boolean;
  streakMultiplier: number;
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
  markTodayComplete: () => void;
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
    isTodayDone: false,
    streakMultiplier: 1,
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

  // Streak bitmap utilities
  const getStreakMap = (): number[] => {
    try {
      const stored = localStorage.getItem('streakMap');
      return stored ? JSON.parse(stored) : [0, 0, 0, 0, 0, 0, 0]; // 7 days
    } catch {
      return [0, 0, 0, 0, 0, 0, 0];
    }
  };

  const setStreakMap = (bitmap: number[]) => {
    localStorage.setItem('streakMap', JSON.stringify(bitmap));
  };

  const getTodayIndex = (): number => {
    const today = new Date();
    return today.getUTCDay(); // 0 = Sunday, 6 = Saturday
  };

  const calculateStreak = (bitmap: number[], todayIndex: number): number => {
    let streakCount = 0;
    
    // Check backwards from today
    for (let i = 0; i < 7; i++) {
      const dayIndex = (todayIndex - i + 7) % 7;
      if (bitmap[dayIndex] === 1) {
        streakCount++;
      } else {
        break; // Streak broken
      }
    }
    
    return Math.min(streakCount, 7); // Max streak is 7 days
  };

  const updateStreakState = () => {
    const bitmap = getStreakMap();
    const todayIndex = getTodayIndex();
    const yesterdayIndex = (todayIndex - 1 + 7) % 7;
    
    const isTodayDone = bitmap[todayIndex] === 1;
    const current = calculateStreak(bitmap, todayIndex);
    
    // Streak multiplier: 1x for days 1-6, 3x for day 7
    const streakMultiplier = current === 7 ? 3 : 1;
    
    setStreak({
      current,
      isTodayDone,
      streakMultiplier,
    });
  };

  // Initialize wallet and streak
  useEffect(() => {
    const initWallet = async () => {
      try {
        console.log('GachaFi: Initializing in demo mode...');
        await radixService.initialize();
        await oneSignalService.initialize();
        
        // Update streak state on init
        updateStreakState();
        
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
        setTimeout(async () => {
          const demoAddress = "account_tdx_2_demo_simulation_12345678";
          setWallet(prev => ({
            ...prev,
            address: demoAddress,
            isConnected: true,
            balance: 35.5,
            isLoading: false,
          }));
          
          // Request push notification permission on first connect
          try {
            const hasPermission = await oneSignalService.isSubscribed();
            if (!hasPermission) {
              console.log('Requesting push notification permission...');
              await oneSignalService.requestPermission();
            }
          } catch (error) {
            console.error('Failed to request push permission:', error);
          }
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
        
        // Request push notification permission on first connect
        try {
          const hasPermission = await oneSignalService.isSubscribed();
          if (!hasPermission) {
            console.log('Requesting push notification permission...');
            await oneSignalService.requestPermission();
          }
        } catch (error) {
          console.error('Failed to request push permission:', error);
        }
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

  const markTodayComplete = () => {
    const bitmap = getStreakMap();
    const todayIndex = getTodayIndex();
    
    // Mark today as complete
    bitmap[todayIndex] = 1;
    setStreakMap(bitmap);
    
    // Store last open date for push notification logic
    const todayKey = new Date().toISOString().split('T')[0];
    localStorage.setItem('lastOpenDate', todayKey);
    
    // Update streak state
    updateStreakState();
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
    markTodayComplete,
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