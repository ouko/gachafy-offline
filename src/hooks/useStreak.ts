import { useGameContext } from "@/contexts/GameContext";

export const useStreak = () => {
  const { streak, markTodayComplete } = useGameContext();

  return {
    streak: streak.current,
    isTodayDone: streak.isTodayDone,
    streakMultiplier: streak.streakMultiplier,
    markTodayComplete,
  };
};
