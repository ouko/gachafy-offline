import { Flame, Loader2, Wallet, WifiOff } from "lucide-react";
import { getTxExplorerUrl, shortenTxHash } from "@/lib/radix-config";
import { memo } from "react";

interface BalanceDisplayProps {
  balance: number;
  pendingDelta: number;
  pendingTx: string;
  streak: number;
  isOnline: boolean;
  queuedRequestsCount: number;
  isLoading?: boolean;
  hasError?: boolean;
}

export const BalanceDisplay = memo(function BalanceDisplay({
  balance,
  pendingDelta,
  pendingTx,
  streak,
  isOnline,
  queuedRequestsCount,
  isLoading = false,
  hasError = false,
}: BalanceDisplayProps) {
  const displayedBalance = Math.max(0, balance);

  return (
    <section className="game-panel mx-auto w-full max-w-md rounded-2xl px-5 py-4" aria-label="Wallet balance">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <Wallet className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Available balance</p>
            {isLoading ? (
              <div className="mt-1.5 h-6 w-32 animate-pulse rounded bg-muted/60" aria-hidden="true" />
            ) : hasError ? (
              <p className="mt-1 text-sm font-medium text-yellow-400" role="status">Balance unavailable — retrying</p>
            ) : (
              <p className="mt-0.5 truncate font-mono text-xl font-bold tabular-nums text-foreground">
                {displayedBalance.toFixed(3)} <span className="text-sm text-muted-foreground">XRD</span>
              </p>
            )}
          </div>
        </div>
        {streak > 0 && (
          <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-orange-300/20 bg-orange-400/10 px-2.5 py-1 text-orange-300">
            <Flame className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold">{streak} day{streak === 1 ? "" : "s"}</span>
          </div>
        )}
      </div>

      {(pendingTx || pendingDelta !== 0 || queuedRequestsCount > 0 || !isOnline) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/50 pt-3 text-xs">
          {!isOnline && (
            <span className="flex items-center gap-1.5 rounded-full bg-orange-400/10 px-2.5 py-1 text-orange-300">
              <WifiOff className="h-3 w-3" />Offline
            </span>
          )}
          {pendingTx && (
            <a
              href={getTxExplorerUrl(pendingTx)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2.5 py-1 font-mono text-blue-300 hover:bg-blue-400/20"
            >
              TX: {shortenTxHash(pendingTx)}
            </a>
          )}
          {pendingDelta !== 0 && (
            <span className="rounded-full bg-purple-400/10 px-2.5 py-1 font-mono text-purple-300">
              {pendingDelta > 0 ? "+" : ""}{pendingDelta.toFixed(3)}
            </span>
          )}
          {queuedRequestsCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-indigo-400/10 px-2.5 py-1 text-indigo-300">
              <Loader2 className="h-3 w-3 animate-spin" />{queuedRequestsCount} queued
            </span>
          )}
        </div>
      )}
    </section>
  );
});
