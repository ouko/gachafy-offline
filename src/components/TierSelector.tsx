import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Gem, Star, Crown, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { memo, useRef, useCallback } from "react";

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
    gradient: "from-slate-300 via-slate-400 to-slate-500",
    glowColor: "rgba(148, 163, 184, 0.6)",
    icon: Gem,
    particles: 12,
    animation: "animate-pulse",
    borderGlow: "shadow-[0_0_20px_rgba(148,163,184,0.5)]",
    cardClass: "glass-card-premium",
    textGradient: "bg-gradient-to-r from-slate-300 to-slate-100",
  },
  rare: {
    gradient: "from-blue-300 via-blue-400 to-purple-500",
    glowColor: "rgba(59, 130, 246, 0.8)",
    icon: Star,
    particles: 16,
    animation: "animate-bounce",
    borderGlow: "shadow-[0_0_25px_rgba(59,130,246,0.7)]",
    cardClass: "glass-card-premium",
    textGradient: "bg-gradient-to-r from-blue-300 to-purple-300",
  },
  epic: {
    gradient: "from-purple-300 via-pink-400 to-red-400",
    glowColor: "rgba(168, 85, 247, 1.0)",
    icon: Crown,
    particles: 20,
    animation: "animate-pulse",
    borderGlow: "shadow-[0_0_30px_rgba(168,85,247,0.9)]",
    cardClass: "glass-card-premium",
    textGradient: "bg-gradient-to-r from-purple-300 to-pink-300",
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
  boosterActive,
  boosterCost,
}: {
  tier: Tier;
  isSelected: boolean;
  onSelect: () => void;
  onPlayHover: () => void;
  boosterActive: boolean;
  boosterCost: number;
}) {
  const config = rarityConfig[tier.rarity];
  const IconComponent = config.icon;

  // Generate stable pseudo-random particle positions once per card instance
  const particlesRef = useRef(
    Array.from({ length: config.particles }, (_, i) => ({
      left: `${((i * 37) % 100)}%`,
      top: `${((i * 53) % 100)}%`,
      delay: `${(i * 0.15) % 2}s`,
      duration: `${2 + (i * 0.2) % 2}s`,
    })),
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  }, [onSelect]);

  const totalPrice = boosterActive && isSelected ? tier.price + boosterCost : tier.price;

  return (
    <Card
      className={cn(
        "min-w-[160px] h-[200px] flex flex-col items-center justify-center cursor-pointer transition-all duration-700 snap-center relative overflow-hidden group",
        config.cardClass,
        "hover:scale-115 hover:-translate-y-3",
        isSelected
          ? `border-primary/70 ${config.borderGlow} transform scale-115 -translate-y-3 border-2`
          : "border-white/20 hover:border-primary/60 border",
      )}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${tier.name}, ${totalPrice} XRD`}
      onClick={onSelect}
      onMouseEnter={onPlayHover}
      onKeyDown={handleKeyDown}
    >
      <div className="absolute inset-0 overflow-hidden">
        {particlesRef.current.map((p, i) => (
          <div
            key={i}
            className={cn(
              "absolute w-1 h-1 bg-white rounded-full opacity-20",
              isSelected ? "animate-ping" : "group-hover:animate-ping",
            )}
            style={{
              left: p.left,
              top: p.top,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div
          className={cn(
            "w-28 h-28 rounded-3xl mb-4 relative overflow-hidden flex items-center justify-center border-2 border-white/20",
            `bg-gradient-to-br ${config.gradient}`,
            isSelected ? config.animation : `group-hover:${config.animation}`,
          )}
        >
          <div
            className="absolute inset-0 rounded-3xl opacity-80"
            style={{
              background: `radial-gradient(circle at center, ${config.glowColor} 0%, transparent 60%)`,
            }}
          />
          <div
            className="absolute inset-[-2px] rounded-3xl opacity-40 blur-sm"
            style={{
              background: `linear-gradient(45deg, ${config.glowColor}, transparent, ${config.glowColor})`,
            }}
          />
          <div
            className={cn(
              "absolute inset-0 rounded-3xl",
              isSelected ? "shimmer" : "group-hover:shimmer",
            )}
          />
          <IconComponent
            className={cn(
              "w-10 h-10 text-white relative z-10 drop-shadow-lg",
              isSelected ? "animate-pulse" : "group-hover:animate-pulse",
            )}
          />
          <Sparkles
            className={cn(
              "absolute top-1 right-1 w-4 h-4 text-white/60",
              isSelected ? "animate-spin" : "group-hover:animate-spin",
            )}
          />
        </div>

        <div className="text-center">
          <h3
            className={cn(
              "text-xl font-bold mb-2 uppercase tracking-widest",
              isSelected
                ? `${config.textGradient} bg-clip-text text-transparent scale-110`
                : `text-foreground group-hover:${config.textGradient} group-hover:bg-clip-text group-hover:text-transparent group-hover:scale-105`,
            )}
          >
            {tier.name}
          </h3>
          <p
            className={cn(
              "text-base font-mono font-bold tracking-wider",
              isSelected
                ? "text-primary/90 scale-110"
                : "text-muted-foreground group-hover:text-primary group-hover:scale-105",
            )}
          >
            {tier.price}
            {boosterActive && isSelected ? ` + ${boosterCost}` : ""} XRD
          </p>
        </div>

        <div
          className={cn(
            "absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
            `bg-gradient-to-r ${config.gradient} text-white shadow-lg`,
            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        >
          {tier.rarity}
        </div>

        {isSelected && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        )}
      </div>

      <div
        className={cn(
          "absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300",
          "bg-gradient-to-r from-transparent via-white/10 to-transparent",
          isSelected ? "opacity-100" : "group-hover:opacity-100",
        )}
      />
    </Card>
  );
});

export const TierSelector = memo(function TierSelector({
  selectedTier,
  onSelect,
  onPlaySound,
  onPlayHover,
  boosterActive,
  boosterCost,
  isLoading = false,
}: TierSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 180;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }, []);

  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <div className="flex gap-6 px-4 snap-x snap-mandatory justify-center">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="min-w-[160px] h-[200px] rounded-xl border border-white/10 bg-muted/30 animate-pulse flex flex-col items-center justify-center gap-3"
              aria-hidden="true"
            >
              <div className="w-28 h-28 rounded-3xl bg-muted/50" />
              <div className="h-5 w-20 bg-muted/50 rounded" />
              <div className="h-4 w-16 bg-muted/50 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Scroll affordance: left arrow */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 text-white backdrop-blur-sm opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity hidden md:block"
        aria-label="Scroll tiers left"
        tabIndex={-1}
      >
        <ChevronLeft size={20} />
      </button>

      {/* Scroll affordance: right arrow */}
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 text-white backdrop-blur-sm opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity hidden md:block"
        aria-label="Scroll tiers right"
        tabIndex={-1}
      >
        <ChevronRight size={20} />
      </button>

      <div
        ref={scrollRef}
        className="overflow-x-auto"
        tabIndex={0}
        aria-label="Select a loot box tier"
        role="region"
      >
        <div className="flex gap-6 px-4 snap-x snap-mandatory justify-center">
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
              boosterActive={boosterActive}
              boosterCost={boosterCost}
            />
          ))}
        </div>
      </div>

      {/* Pagination dots */}
      <div className="flex justify-center gap-2 mt-4">
        {tiers.map((tier) => (
          <button
            key={tier.id}
            onClick={() => onSelect(tier)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              selectedTier.id === tier.id
                ? "bg-primary w-4"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50",
            )}
            aria-label={`Select ${tier.name}`}
            aria-pressed={selectedTier.id === tier.id}
          />
        ))}
      </div>
    </div>
  );
});
