import { useGachaFi } from '@/contexts/GachaFiContext';

export const useBooster = () => {
  const { booster, activateBooster, deactivateBooster } = useGachaFi();

  return {
    isActive: booster.isActive,
    multiplier: booster.multiplier,
    expiresAt: booster.expiresAt,
    type: booster.type,
    activateBooster,
    deactivateBooster,
  };
};