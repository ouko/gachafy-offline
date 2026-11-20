import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExternalLink, Sparkles, Wallet } from "lucide-react";
import { memo } from "react";
import { isStandalone } from "@/utils/pwa";
import { useIsMobile } from "@/hooks/use-mobile";

interface OpenButtonProps {
  isConnected: boolean;
  canAfford: boolean;
  isProcessing: boolean;
  isOnline: boolean;
  offlineQueueEnabled: boolean;
  gachaDeployed: boolean;
  selectedTierName: string;
  totalCost: number;
  balance: number;
  pendingTx: string;
  onClick: () => void;
  onMouseEnter?: () => void;
}

export const OpenButton = memo(function OpenButton({
  isConnected,
  canAfford,
  isProcessing,
  isOnline,
  offlineQueueEnabled,
  gachaDeployed,
  selectedTierName,
  totalCost,
  balance,
  pendingTx,
  onClick,
  onMouseEnter,
}: OpenButtonProps) {
  const isMobile = useIsMobile();

  if (!isConnected) {
    if (isStandalone() && !isMobile) {
      return (
        <div className="game-panel flex max-w-sm flex-col items-center gap-3 rounded-2xl p-6 text-center">
          <ExternalLink size={28} className="text-muted-foreground" />
          <p className="text-sm font-medium">Open in your browser</p>
          <p className="text-xs leading-5 text-muted-foreground">
            Browser wallet extensions do not work inside installed apps. Open GachaFi in Safari or Chrome to connect.
          </p>
        </div>
      );
    }

    return (
      <Button
        size="lg"
        onClick={onClick}
        className="primary-game-button h-16 w-full max-w-sm rounded-2xl text-base font-bold"
      >
        <Wallet size={20} />
        Connect Wallet
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      className={cn(
        "primary-game-button h-16 w-full max-w-sm rounded-2xl text-base font-bold sm:text-lg",
        !canAfford && "cursor-not-allowed",
      )}
      disabled={isProcessing || !canAfford || !gachaDeployed || (!isOnline && !offlineQueueEnabled)}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      {isProcessing ? (
        <span className="flex items-center gap-3">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          {pendingTx ? "Processing…" : "Opening…"}
        </span>
      ) : !gachaDeployed ? (
        "Coming Soon"
      ) : !canAfford ? (
        `Need ${(totalCost - balance).toFixed(3)} XRD`
      ) : !isOnline && !offlineQueueEnabled ? (
        "Reconnect to Open"
      ) : !isOnline ? (
        <span className="flex items-center gap-2.5">
          <Sparkles size={19} />
          Queue {selectedTierName} · {totalCost} XRD
        </span>
      ) : (
        <span className="flex items-center gap-2.5">
          <Sparkles size={19} />
          Open {selectedTierName} · {totalCost} XRD
        </span>
      )}
    </Button>
  );
});
