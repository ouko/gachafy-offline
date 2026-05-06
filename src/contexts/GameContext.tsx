import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { logger } from "@/lib/logger";

interface Streak {
  current: number;
  isTodayDone: boolean;
  streakMultiplier: number;
}

interface Booster {
  isActive: boolean;
  cost: number;
  description: string;
}

interface GameContextType {
  streak: Streak;
  booster: Booster;
  markTodayComplete: () => void;
  toggleBooster: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

// ----- Streak persistence (date-keyed, not weekday-keyed) ------------------
// Stores the set of YYYY-MM-DD dates the user has completed. Streak length
// is the number of consecutive prior dates (including today if done) ending
// at today.
//
// ⚠️ SECURITY WARNING: Streaks are stored in localStorage and are trivially
// manipulable by any user via DevTools. If streaks have economic value
// (multipliers affect real XRD costs), they MUST be validated server-side
// or on-chain. The client-side streak is a UX nicety, not authoritative state.
const STREAK_KEY = "gachafi.completedDates.v2";
const LEGACY_STREAK_KEY = "streakMap";

const isoDate = (d: Date): string => d.toISOString().split("T")[0];

const readCompletedDates = (): Set<string> => {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (raw) return new Set(JSON.parse(raw));
    if (localStorage.getItem(LEGACY_STREAK_KEY)) {
      localStorage.removeItem(LEGACY_STREAK_KEY);
    }
  } catch {
    // ignore
  }
  return new Set();
};

const writeCompletedDates = (dates: Set<string>) => {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify([...dates]));
  } catch (e) {
    logger.warn("Failed to persist streak", e, "GameContext");
  }
};

const computeStreak = (dates: Set<string>, today: Date): { current: number; isTodayDone: boolean } => {
  const todayStr = isoDate(today);
  const isTodayDone = dates.has(todayStr);

  let current = 0;
  const cursor = new Date(today);
  while (dates.has(isoDate(cursor))) {
    current++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return { current, isTodayDone };
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [streak, setStreak] = useState<Streak>({
    current: 0,
    isTodayDone: false,
    streakMultiplier: 1,
  });

  const [booster, setBooster] = useState<Booster>({
    isActive: false,
    cost: 5,
    description: "+5 XRD boost",
  });

  const completedDatesRef = useRef<Set<string>>(readCompletedDates());

  const updateStreakState = useCallback(() => {
    const { current, isTodayDone } = computeStreak(completedDatesRef.current, new Date());
    const streakMultiplier = current >= 7 ? 3 : 1;
    setStreak({ current, isTodayDone, streakMultiplier });
  }, []);

  useEffect(() => {
    updateStreakState();
  }, [updateStreakState]);

  // Reset booster to inactive on every mount. This is intentional: the
  // booster is a per-session power-up that must be explicitly toggled on
  // each time the user opens the app. It does not persist across sessions.
  useEffect(() => {
    setBooster((prev) => ({ ...prev, isActive: false }));
  }, []);

  const markTodayComplete = useCallback(() => {
    const today = isoDate(new Date());
    completedDatesRef.current.add(today);
    writeCompletedDates(completedDatesRef.current);
    localStorage.setItem("lastOpenDate", today);
    updateStreakState();
  }, [updateStreakState]);

  const toggleBooster = useCallback(() => {
    setBooster((prev) => ({ ...prev, isActive: !prev.isActive }));
  }, []);

  return (
    <GameContext.Provider
      value={{
        streak,
        booster,
        markTodayComplete,
        toggleBooster,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGameContext must be used within a GameProvider");
  }
  return context;
};
