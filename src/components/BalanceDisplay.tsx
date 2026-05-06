import { Flame, Sparkles, WifiOff, Loader2 } from "lucide-react";
import { shortenTxHash, getTxExplorerUrl } from "@/lib/radix-config";
import { memo } from "react";

interface BalanceDisplayProps {
  balance: number;
  pendingDelta: number;
  pendingTx: string;
  streakMultiplier: number;
  isOnline: boolean;
  queuedRequestsCount: number;
  isLoading?: boolean;
}

export const BalanceDisplay = memo(function BalanceDisplay({
  balance,
  pendingDelta,
  pendingTx,
  streakMultiplier,
  isOnline,
  queuedRequestsCount,
  isLoading = false,
}: BalanceDisplayProps) {
  // Note: `balance` from WalletContext already includes pendingDelta.
  // Do NOT add it again — that would double-count the optimistic adjustment.
  const displayedBalance = Math.max(0, balance);

  return (
    <div className="flex flex-col items-center gap-2 mb-8 relative z-10 mt-16">
      {/* Primary pill: balance + streak */}
      <div
        className="glass-card-premium rounded-full px-8 py-4 flex items-center gap-4 hover:scale-105 transition-all duration-500 select-none"
        style={{ animation: "glow-pulse 3s ease-in-out infinite" }}
      >
        {isLoading ? (
          <div className="h-6 w-32 bg-muted/50 rounded animate-pulse" aria-hidden="true" />
        ) : (
          <span className="text-xl font-bold gradient-text-holographic font-mono tracking-wider">
            {displayedBalance.toFixed(3)} XRD
          </span>
        )}

        {streakMultiplier > 1 && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 text-white px-4 py-2 rounded-full shadow-lg border border-orange-300/30">
            <Flame size={16} className="animate-pulse text-yellow-200" />
            <span className="text-sm font-bold tracking-wide">{streakMultiplier}× streak</span>
            <Sparkles size={14} className="animate-pulse text-yellow-200" />
          </div>
        )}

        {!isOnline && (
          <span className="text-xs bg-slate-500/80 text-white px-3 py-1 rounded-full backdrop-blur-sm flex items-center gap-1">
            <WifiOff size={12} />
            Offline
          </span>
        )}
      </div>

      {/* Secondary sub-line: transactional metadata */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {pendingTx && (
          <a
            href={getTxExplorerUrl(pendingTx)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full backdrop-blur-sm font-mono border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
          >
            TX: {shortenTxHash(pendingTx)}
          </a>
        )}
        {pendingDelta !== 0 && (
          <span className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full backdrop-blur-sm font-mono border border-purple-500/30">
            {pendingDelta > 0 ? "+" : ""}
            {pendingDelta.toFixed(3)}
          </span>
        )}
        {queuedRequestsCount > 0 && (
          <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full backdrop-blur-sm border border-indigo-500/30 flex items-center gap-1">
            <Loader2 size={12} className="animate-spin" />
            {queuedRequestsCount} queued
          </span>
        )}
      </div>
    </div>
  );
});
