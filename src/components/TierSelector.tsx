import { cn } from "@/lib/utils";
import { Check, Crown, Gem, Star } from "lucide-react";
import { memo } from "react";

export interface Tier {
  id: "common" | "rare" | "epic";
  name: string;
  price: number;
  rarity: "common" | "rare" | "epic";
}

export const tiers: Tier[] = [
  { id: "common", name: "Common", price: 8, rarity: "common" },
  { id: "rare", name: "Rare", price: 15, rarity: "rare" },
  { id: "epic", name: "Epic", price: 25, rarity: "epic" },
];

const rarityConfig = {
  common: {
    icon: Gem,
    gradient: "from-slate-300 via-slate-400 to-slate-500",
    selected: "border-slate-300/70 bg-slate-300/10 shadow-[inset_0_0_0_1px_rgba(203,213,225,0.16)]",
  },
  rare: {
    icon: Star,
    gradient: "from-cyan-300 via-blue-400 to-purple-500",
    selected: "border-cyan-300/70 bg-cyan-300/10 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.16)]",
  },
  epic: {
    icon: Crown,
    gradient: "from-purple-300 via-pink-400 to-red-400",
    selected: "border-purple-300/70 bg-purple-300/10 shadow-[inset_0_0_0_1px_rgba(216,180,254,0.18)]",
  },
};

interface TierSelectorProps {
  selectedTier: Tier;
  onSelect: (tier: Tier) => void;
  onPlaySound: () => void;
  onPlayHover: () => void;
  boosterActive: boolean;
  boosterCost: number;
  isLoading?: boolean;
}

const TierCard = memo(function TierCard({
  tier,
  isSelected,
  onSelect,
  onPlayHover,
}: {
  tier: Tier;
  isSelected: boolean;
  onSelect: () => void;
  onPlayHover: () => void;
}) {
  const config = rarityConfig[tier.rarity];
  const Icon = config.icon;

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      aria-label={`${tier.name}, ${tier.price} XRD`}
      onClick={onSelect}
      onMouseEnter={onPlayHover}
      className={cn(
        "group relative flex h-[174px] w-[142px] shrink-0 flex-col items-stretch rounded-2xl border border-border/70 bg-card/70 px-3 py-3 text-left transition-[border-color,background-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-[190px] md:w-full md:px-4",
        isSelected && config.selected,
      )}
    >
      <div className="flex h-5 items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {tier.rarity}
        </span>
        {isSelected && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        )}
      </div>

      <div className={cn("mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-md sm:h-20 sm:w-20", config.gradient)}>
        <Icon className="h-8 w-8 text-white sm:h-10 sm:w-10" strokeWidth={1.8} />
      </div>

      <div className="text-center">
        <div className="text-sm font-bold uppercase tracking-[0.12em] text-foreground sm:text-base">
          {tier.name}
        </div>
        <div className="mt-1 font-mono text-xs font-semibold tabular-nums text-muted-foreground sm:text-sm">
          {tier.price} <span className="text-[0.85em]">XRD</span>
        </div>
      </div>
    </button>
  );
});

export const TierSelector = memo(function TierSelector({
  selectedTier,
  onSelect,
  onPlaySound,
  onPlayHover,
  isLoading = false,
}: TierSelectorProps) {
  if (isLoading) {
    return (
      <div className="flex gap-3 md:grid md:grid-cols-3 md:gap-4" aria-hidden="true">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-[174px] w-[142px] shrink-0 animate-pulse rounded-2xl border border-border/50 bg-muted/30 sm:h-[190px] md:w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="tier-scroll overflow-x-auto pb-2" role="group" aria-label="Select a loot box tier">
      <div className="flex gap-3 md:grid md:grid-cols-3 md:gap-4">
        {tiers.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            isSelected={selectedTier.id === tier.id}
            onSelect={() => {
              onPlaySound();
              onSelect(tier);
            }}
            onPlayHover={onPlayHover}
          />
        ))}
      </div>
    </div>
  );
});
