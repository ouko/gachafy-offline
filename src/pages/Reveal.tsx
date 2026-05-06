import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import mythicBadge from "@/assets/mythic-badge.png";
import { shortenTxHash } from "@/lib/radix-config";
import { Gem, Star, Crown, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Tier {
  id: 'common' | 'rare' | 'epic';
  name: string;
  price: number;
  rarity: 'common' | 'rare' | 'epic';
}

const TIER_REWARD: Record<Tier['rarity'], { sp: number; gradient: string; icon: LucideIcon; label: string }> = {
  common: { sp: 100, gradient: 'from-slate-300 via-slate-400 to-slate-500', icon: Gem, label: 'Common Badge' },
  rare:   { sp: 350, gradient: 'from-blue-300 via-blue-400 to-purple-500',  icon: Star, label: 'Rare Badge' },
  epic:   { sp: 1000, gradient: 'from-purple-300 via-pink-400 to-red-400',  icon: Crown, label: 'Epic Badge' },
};

const Reveal = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const tier = location.state?.tier as Tier | undefined;
  const txHash = location.state?.txHash as string | undefined;
  const [spCount, setSpCount] = useState(0);
  const [showBadge, setShowBadge] = useState(false);

  const reward = tier ? TIER_REWARD[tier.rarity] : null;
  const target = reward?.sp ?? 0;

  useEffect(() => {
    if (!tier || !reward) {
      navigate('/open');
      return;
    }

    setTimeout(() => setShowBadge(true), 100);

    const startTime = Date.now();
    const duration = 600;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setSpCount(Math.floor(easeOut * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    setTimeout(animate, 400);

    // No auto-redirect — user controls when to leave the reveal screen.
  }, [tier, reward, target, navigate]);

  const shareText = tier
    ? `🔥 I just opened a ${tier.name} GachaFi box and earned ${target.toLocaleString()} SP!`
    : '🔥 GachaFi';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch {
        // User cancelled — fine.
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText);
      } catch {
        // ignore clipboard failures
      }
    }
  };

  if (!tier || !reward) return null;

  const Icon = reward.icon;

  return (
    <main className="min-h-screen gradient-reveal flex flex-col items-center justify-center p-4">
      <div className="mb-8 relative">
        <img
          src={mythicBadge}
          alt={reward.label}
          className={`w-[200px] h-[200px] object-contain transition-all duration-400 ${
            showBadge ? 'animate-zoom-in' : 'scale-0 opacity-0'
          }`}
        />
        <div
          className={cn(
            'absolute inset-0 -z-10 rounded-full blur-2xl opacity-70 bg-gradient-to-br',
            reward.gradient,
          )}
        />
      </div>

      <div className="mb-2 flex items-center gap-2 text-white/80">
        <Icon className="w-5 h-5" />
        <span className="text-lg uppercase tracking-widest">{reward.label}</span>
      </div>

      <div className="mb-8 text-center">
        <div className="text-6xl font-bold text-white mb-2 animate-count-up">
          {spCount.toLocaleString()}
        </div>
        <div className="text-xl text-purple-200">SP Earned</div>
      </div>

      {txHash && (
        <div className="mb-4 bg-white/10 text-white px-4 py-2 rounded-full text-sm font-mono">
          TX: {shortenTxHash(txHash)}
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        <Button onClick={handleShare} className="bg-white text-black hover:bg-gray-100 font-semibold px-8 py-3">
          Share
        </Button>
        <Button
          onClick={() => navigate('/open', { replace: true })}
          variant="outline"
          className="border-white/30 text-white hover:bg-white/10 px-8 py-3"
        >
          Open Another Box
        </Button>
      </div>
    </main>
  );
};

export default Reveal;
