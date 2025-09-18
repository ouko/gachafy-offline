import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Tier {
  id: string;
  name: string;
  price: number;
  rarity: "common" | "rare" | "epic";
}

const tiers: Tier[] = [
  { id: "common", name: "Common", price: 8, rarity: "common" },
  { id: "rare", name: "Rare", price: 15, rarity: "rare" },
  { id: "epic", name: "Epic", price: 25, rarity: "epic" },
];

const rarityColors = {
  common: "from-slate-500 to-slate-600",
  rare: "from-blue-500 to-blue-600", 
  epic: "from-purple-500 to-purple-600",
};

const Open = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(247.5); // Mock XRD balance
  const [selectedTier, setSelectedTier] = useState<Tier>(tiers[2]); // Default to Epic
  const [startY, setStartY] = useState(0);

  // Poll balance every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Mock balance fluctuation
      setBalance(prev => prev + (Math.random() - 0.5) * 2);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const openBox = () => {
    if (balance >= selectedTier.price) {
      setBalance(prev => prev - selectedTier.price);
      navigate("/reveal", { state: { tier: selectedTier } });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endY = e.changedTouches[0].clientY;
    const diff = startY - endY;
    
    // Swipe up threshold
    if (diff > 50) {
      openBox();
    }
  };

  const canAfford = balance >= selectedTier.price;

  return (
    <main className="min-h-screen bg-background p-4 flex flex-col">
      {/* Top Balance Bar */}
      <div className="flex justify-center mb-8">
        <div className="bg-card rounded-full px-6 py-2 shadow-card border border-border">
          <span className="text-sm font-semibold text-primary">
            {balance.toFixed(1)} XRD
          </span>
        </div>
      </div>

      {/* Tier Cards */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="overflow-x-auto">
          <div className="flex gap-4 px-4 snap-x snap-mandatory">
            {tiers.map((tier) => (
              <Card
                key={tier.id}
                className={cn(
                  "min-w-[110px] h-[140px] flex flex-col items-center justify-center cursor-pointer transition-smooth snap-center",
                  "bg-gradient-to-br gradient-card border",
                  selectedTier.id === tier.id 
                    ? "border-[#8338EC] shadow-[0_0_0_4px_#8338EC40]" 
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => setSelectedTier(tier)}
              >
                <div className={cn(
                  "w-16 h-16 rounded-lg bg-gradient-to-br mb-2",
                  rarityColors[tier.rarity]
                )} />
                <h3 className="text-sm font-semibold text-foreground">{tier.name}</h3>
                <p className="text-xs text-muted-foreground">{tier.price} XRD</p>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-12 flex justify-center">
          <Button
            size="lg"
            className={cn(
              "w-[300px] h-[56px] text-lg font-semibold transition-smooth",
              canAfford 
                ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow" 
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            disabled={!canAfford}
            onClick={openBox}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            Open {selectedTier.name} {selectedTier.price} XRD
          </Button>
        </div>

        {/* Swipe Hint */}
        <p className="text-center text-muted-foreground text-sm mt-4">
          Tap or swipe up to open
        </p>
      </div>
    </main>
  );
};

export default Open;