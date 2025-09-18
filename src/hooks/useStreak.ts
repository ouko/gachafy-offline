import { useGachaFi } from '@/contexts/GachaFiContext';

export const useStreak = () => {
  const { streak, incrementStreak, resetStreak } = useGachaFi();

  return {
    current: streak.current,
    bestEver: streak.bestEver,
    lastOpenDate: streak.lastOpenDate,
    multiplier: streak.multiplier,
    incrementStreak,
    resetStreak,
  };
};