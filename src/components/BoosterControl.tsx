import { Switch } from "@/components/ui/switch";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { memo } from "react";

interface BoosterControlProps {
  isActive: boolean;
  cost: number;
  description: string;
  onToggle: () => void;
}

export const BoosterControl = memo(function BoosterControl({
  isActive,
  cost,
  description,
  onToggle,
}: BoosterControlProps) {
  return (
    <div className="mt-10 flex justify-center">
      <div className="glass-card-premium rounded-3xl px-8 py-6 flex items-center gap-6 border border-yellow-400/20 hover:scale-105 transition-all duration-500">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border border-yellow-400/30">
            <Zap
              className={cn(
                "w-6 h-6 transition-colors animate-pulse",
                isActive ? "text-yellow-400" : "text-muted-foreground",
              )}
            />
          </div>
          <div>
            <span className="text-lg font-bold gradient-text-gold block">Booster</span>
            <span className="text-sm text-muted-foreground font-medium">{description}</span>
          </div>
        </div>
        <Switch
          checked={isActive}
          onCheckedChange={onToggle}
          className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-yellow-400 data-[state=checked]:to-orange-500 scale-125"
        />
      </div>
    </div>
  );
});
