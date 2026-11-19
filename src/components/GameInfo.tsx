import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Info, X, Gem, Star, Crown, Flame, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export const GameInfo = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative z-10">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 mx-auto text-muted-foreground hover:text-foreground transition-colors text-sm"
          aria-label="How to play"
        >
          <Info size={16} />
          <span>How does this work?</span>
        </button>
      ) : (
        <div className="bg-card/80 backdrop-blur-md border border-border rounded-2xl p-5 max-w-sm mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">How GachaFi Works</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="p-1 h-auto"
              aria-label="Close"
            >
              <X size={16} />
            </Button>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Open mystery boxes</strong> to earn
              collectible badge NFTs and <strong className="text-foreground">SP (Skill Points)</strong>.
            </p>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50">
                <Gem size={18} className="text-slate-400" />
                <span className="text-xs font-medium text-foreground">Common</span>
                <span className="text-xs">100 SP</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50">
                <Star size={18} className="text-blue-400" />
                <span className="text-xs font-medium text-foreground">Rare</span>
                <span className="text-xs">350 SP</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50">
                <Crown size={18} className="text-purple-400" />
                <span className="text-xs font-medium text-foreground">Epic</span>
                <span className="text-xs">1,000 SP</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Flame size={16} className="text-orange-400 mt-0.5 shrink-0" />
              <p>
                <strong className="text-foreground">Streaks:</strong> Track your daily opening habit on this device. Streaks do not change prices or on-chain rewards.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <Zap size={16} className="text-yellow-400 mt-0.5 shrink-0" />
              <p>
                <strong className="text-foreground">Boosters:</strong> Not currently available. Each tier has the fixed badge and SP reward shown above.
              </p>
            </div>

            <p className="text-xs pt-2 border-t border-border">
              All transactions happen on the Radix blockchain. You need a Radix wallet and XRD tokens to play.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
