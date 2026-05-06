import { useGameContext } from "@/contexts/GameContext";

export const useBooster = () => {
  const { booster, toggleBooster } = useGameContext();

  return {
    isActive: booster.isActive,
    cost: booster.cost,
    description: booster.description,
    toggleBooster,
  };
};
