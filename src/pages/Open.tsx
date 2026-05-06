import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useOffline } from "@/hooks/useOffline";
import { useStreak } from "@/hooks/useStreak";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { getRadixService } from "@/lib/radix-lazy";
import { getTxExplorerUrl, shortenTxHash } from "@/lib/radix-config";
import { BridgeModal } from "@/components/BridgeModal";
import { useBooster } from "@/hooks/useBooster";
import { useAudio } from "@/hooks/useAudio";
import AudioControls from "@/components/AudioControls";
import { logger } from "@/lib/logger";
import { FEATURE_BRIDGE, GACHA_DEPLOYED } from "@/lib/featureFlags";
import { TierSelector, tiers, type Tier } from "@/components/TierSelector";
import { BalanceDisplay } from "@/components/BalanceDisplay";
import { BoosterControl } from "@/components/BoosterControl";
import { OpenButton } from "@/components/OpenButton";
import { X, Clock } from "lucide-react";

const SWIPE_TRIGGER_DISTANCE_PX = 30;
const SWIPE_TRIGGER_VELOCITY_PX_MS = 0.4;

const Open = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isOnline, queuedRequests, queueMintRequest } = useOffline();
  const { streakMultiplier, isTodayDone, markTodayComplete } = useStreak();
  const {
    isActive: boosterActive,
    cost: boosterCost,
    description: boosterDescription,
    toggleBooster,
  } = useBooster();
  const {
    playOpenCapsule,
    playButtonClick,
    playButtonHover,
    playError,
  } = useAudio();
  const {
    address,
    balance,
    isConnected,
    pendingTx,
    pendingDelta,
    isBalanceLoading,
    setPendingDelta,
    clearPendingDelta,
    setPendingTx,
    connectWallet,
  } = useWallet();

  const [selectedTier, setSelectedTier] = useState<Tier>(tiers[2]); // Default Epic
  const [isLoading, setIsLoading] = useState(false);
  const [isBridgeModalOpen, setIsBridgeModalOpen] = useState(false);
  const [swipeStartY, setSwipeStartY] = useState(0);
  const [swipeStartTime, setSwipeStartTime] = useState(0);

  // Poll pending transaction status. Clears optimistic delta on either resolution.
  useEffect(() => {
    if (!pendingTx) return;

    const checkTxStatus = async () => {
      try {
        const service = await getRadixService();
        const status = await service.getTransactionStatus(pendingTx);
        if (status === "success") {
          clearPendingDelta();
          navigate("/reveal", { state: { tier: selectedTier, txHash: pendingTx } });
          setPendingTx("");
        } else if (status === "failed") {
          toast({
            title: "Transaction Failed",
            description: "Not enough XRD or the transaction was rejected.",
            variant: "destructive",
          });
          clearPendingDelta();
          setPendingTx("");
        }
      } catch (error) {
        logger.error("Error checking transaction status", error, "Open");
      }
    };

    const interval = setInterval(checkTxStatus, 3000);
    return () => clearInterval(interval);
  }, [pendingTx, selectedTier, navigate, toast, clearPendingDelta, setPendingTx]);

  const totalCost = selectedTier.price + (boosterActive ? boosterCost : 0);
  const canAfford = balance >= totalCost;
  const isProcessing = isLoading || !!pendingTx;

  const openBox = useCallback(async () => {
    playButtonClick();

    if (!isConnected) {
      try {
        await connectWallet();
      } catch {
        // connectWallet already toasts on failure via the prompt component.
      }
      return;
    }

    if (!GACHA_DEPLOYED) {
      playError();
      toast({
        title: "Coming soon",
        description: "Gacha component is not yet deployed on this network.",
        variant: "destructive",
      });
      return;
    }

    if (balance < totalCost) {
      playError();
      toast({
        title: "Insufficient Funds",
        description: `Not enough XRD. Need ${totalCost} XRD.`,
        variant: "destructive",
      });
      return;
    }

    if (!isOnline) {
      if (!address) {
        toast({
          title: "Cannot queue",
          description: "Wallet address is required to queue an offline request.",
          variant: "destructive",
        });
        return;
      }
      try {
        await queueMintRequest(selectedTier, address);
      } catch (e) {
        logger.error("Failed to queue mint request", e, "Open");
      }
      return;
    }

    try {
      setIsLoading(true);
      playOpenCapsule(selectedTier.rarity);

      setPendingDelta(-totalCost);

      const service = await getRadixService();
      const txHash = await service.mintGachaBadge(
        address,
        selectedTier.id,
        totalCost * streakMultiplier,
      );

      setPendingTx(txHash);

      if (!isTodayDone) markTodayComplete();

      toast({
        title: "Transaction Submitted",
        description: `TX: ${txHash.slice(0, 10)}…`,
      });
    } catch (error: unknown) {
      logger.error("Mint failed", error, "Open");
      clearPendingDelta();
      toast({
        title: "Transaction Failed",
        description: error instanceof Error ? error.message : "Failed to submit transaction",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    isConnected,
    balance,
    totalCost,
    isOnline,
    selectedTier,
    address,
    streakMultiplier,
    isTodayDone,
    playButtonClick,
    playError,
    playOpenCapsule,
    connectWallet,
    toast,
    queueMintRequest,
    setPendingDelta,
    setPendingTx,
    markTodayComplete,
    clearPendingDelta,
  ]);

  const handleBalanceSwipeStart = useCallback((e: React.TouchEvent) => {
    setSwipeStartY(e.touches[0].clientY);
    setSwipeStartTime(Date.now());
  }, []);

  const handleBalanceSwipeEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!FEATURE_BRIDGE) return;
      const endY = e.changedTouches[0].clientY;
      const duration = Date.now() - swipeStartTime;
      if (duration <= 0) return;
      const distance = swipeStartY - endY;
      const velocity = Math.abs(distance) / duration;
      if (
        distance > SWIPE_TRIGGER_DISTANCE_PX &&
        velocity > SWIPE_TRIGGER_VELOCITY_PX_MS
      ) {
        setIsBridgeModalOpen(true);
      }
    },
    [swipeStartY, swipeStartTime],
  );

  const handleBridgeSuccess = useCallback(
    (_amount: number, txHash: string) => {
      setIsBridgeModalOpen(false);
      toast({
        title: "Bridge submitted",
        description: `TX: ${txHash.slice(0, 10)}…`,
      });
    },
    [toast],
  );

  const handleDismissPending = useCallback(() => {
    clearPendingDelta();
    setPendingTx("");
    toast({
      title: "Dismissed",
      description: "Transaction status cleared. The on-chain transaction may still complete.",
    });
  }, [clearPendingDelta, setPendingTx, toast]);

  return (
    <main className="min-h-screen bg-background p-4 flex flex-col relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 left-10 w-40 h-40 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-2xl"
          style={{ animation: "magical-float 6s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-r from-blue-400/25 to-purple-400/25 rounded-full blur-xl"
          style={{
            animation: "magical-float 8s ease-in-out infinite",
            animationDelay: "2s",
          }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-r from-pink-400/15 to-red-400/15 rounded-full blur-lg"
          style={{
            animation: "magical-float 10s ease-in-out infinite",
            animationDelay: "4s",
          }}
        />
        <div
          className="absolute top-1/3 right-1/3 w-28 h-28 bg-gradient-to-r from-emerald-400/20 to-blue-400/20 rounded-full blur-xl"
          style={{
            animation: "magical-float 7s ease-in-out infinite",
            animationDelay: "1s",
          }}
        />
      </div>

      <BalanceDisplay
        balance={balance}
        pendingDelta={pendingDelta}
        pendingTx={pendingTx}
        streakMultiplier={streakMultiplier}
        isOnline={isOnline}
        queuedRequestsCount={queuedRequests.length}
        isLoading={isBalanceLoading}
      />

      <div className="flex-1 flex flex-col justify-center relative z-10">
        <TierSelector
          selectedTier={selectedTier}
          onSelect={setSelectedTier}
          onPlaySound={playButtonClick}
          onPlayHover={playButtonHover}
          boosterActive={boosterActive}
          boosterCost={boosterCost}
          isLoading={false}
        />

        <BoosterControl
          isActive={boosterActive}
          cost={boosterCost}
          description={boosterDescription}
          onToggle={toggleBooster}
        />

        <div className="mt-12 flex justify-center">
          <OpenButton
            isConnected={isConnected}
            canAfford={canAfford}
            isProcessing={isProcessing}
            isOnline={isOnline}
            gachaDeployed={GACHA_DEPLOYED}
            selectedTierName={selectedTier.name}
            totalCost={totalCost}
            balance={balance}
            pendingTx={pendingTx}
            onClick={openBox}
            onMouseEnter={playButtonHover}
          />
        </div>

        <div className="text-center mt-6 space-y-3 relative z-10">
          <p className="text-muted-foreground text-base">
            {!isConnected
              ? "Connect your Radix wallet to start"
              : `Tap to ${!isOnline ? "queue" : "open"}`}
          </p>
          {!GACHA_DEPLOYED && isConnected && (
            <p className="text-yellow-400 text-sm">
              Gacha component not yet deployed for this network.
            </p>
          )}
          {!isOnline && (
            <p className="text-orange-400 text-sm font-medium">
              Offline mode — request will be replayed when you&apos;re back online.
            </p>
          )}
          {pendingTx && (
            <div className="inline-flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                <Clock size={16} className="animate-pulse" />
                <span>Transaction pending — usually takes ~10s</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={getTxExplorerUrl(pendingTx)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
                >
                  View {shortenTxHash(pendingTx)} on Explorer
                </a>
                <button
                  onClick={handleDismissPending}
                  className="text-xs bg-muted/50 text-muted-foreground px-3 py-1 rounded-full border border-border hover:bg-muted transition-colors flex items-center gap-1"
                >
                  <X size={12} />
                  Dismiss
                </button>
              </div>
            </div>
          )}
          {isConnected && address && (
            <p className="text-green-400 text-sm font-mono">
              Connected: {address.slice(0, 20)}…
            </p>
          )}
        </div>
      </div>

      {FEATURE_BRIDGE && (
        <BridgeModal
          isOpen={isBridgeModalOpen}
          onClose={() => setIsBridgeModalOpen(false)}
          onSuccess={handleBridgeSuccess}
        />
      )}

      <AudioControls />
    </main>
  );
};

export default Open;
