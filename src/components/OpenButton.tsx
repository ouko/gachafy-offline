import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles, ExternalLink, Wallet } from "lucide-react";
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
    // Desktop PWAs cannot use browser extensions, but mobile PWAs can
    // deep-link to the Radix Wallet app. Only block desktop standalone.
    if (isStandalone() && !isMobile) {
      return (
        <div className="flex flex-col items-center gap-4 max-w-xs text-center">
          <div className="rounded-2xl bg-muted/50 border border-border p-6 flex flex-col items-center gap-3">
            <ExternalLink size={32} className="text-muted-foreground" />
            <p className="text-sm font-medium">Open in your browser</p>
            <p className="text-xs text-muted-foreground">
              Browser wallet extensions don't work inside installed apps.
              Please open GachaFi in Safari or Chrome to connect your wallet.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-4">
        {/* Use a native app button instead of <radix-connect-button>.
            The web component renders without a theme (greyed out) and bypasses
            the app's connectWallet() flow. The parent Open page already handles
            !isConnected by calling connectWallet() via onClick. */}
        <Button
          size="lg"
          onClick={onClick}
          className="min-w-[200px] h-14 text-lg font-bold rounded-2xl bg-[#00C389] hover:bg-[#00AB7A] text-white border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          <Wallet size={20} className="mr-2" />
          Connect Wallet
        </Button>
        <p className="text-muted-foreground text-sm">
          Connect your Radix wallet to start opening boxes
        </p>
      </div>
    );
  }

  return (
    <Button
      size="lg"
      className={cn(
        "holographic-button min-w-[280px] h-20 text-xl font-bold rounded-3xl transition-all duration-500 border-2 border-white/30 backdrop-blur-sm tracking-wider",
        !canAfford && "opacity-50 cursor-not-allowed grayscale",
      )}
      disabled={isProcessing || !canAfford || !gachaDeployed || (!isOnline && !offlineQueueEnabled)}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      {isProcessing ? (
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
          <span className="tracking-wider">
            {pendingTx ? "Processing…" : "Connecting…"}
          </span>
        </div>
      ) : !gachaDeployed ? (
        <span className="tracking-wider">Coming Soon</span>
      ) : !canAfford ? (
        <span className="tracking-wider">Need {(totalCost - balance).toFixed(3)} XRD</span>
      ) : !isOnline && !offlineQueueEnabled ? (
        <span className="tracking-wider">Reconnect to Open</span>
      ) : !isOnline ? (
        <div className="flex items-center gap-3">
          <Sparkles size={20} className="animate-pulse" />
          <span className="tracking-wider">
            Queue {selectedTierName} • {totalCost} XRD
          </span>
          <Sparkles size={20} className="animate-pulse" />
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Sparkles size={20} className="animate-pulse" />
          <span className="tracking-wider">
            Open {selectedTierName} • {totalCost} XRD
          </span>
          <Sparkles size={20} className="animate-pulse" />
        </div>
      )}
    </Button>
  );
});
