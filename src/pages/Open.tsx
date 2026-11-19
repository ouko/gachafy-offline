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
import { GameInfo } from "@/components/GameInfo";
import { X, Clock, Info } from "lucide-react";


const Open = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isOnline, queuedRequests, queueMintRequest } = useOffline();
  const { streak, isTodayDone, markTodayComplete } = useStreak();
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
  const [pendingStatusError, setPendingStatusError] = useState(false);
  const [isBridgeModalOpen, setIsBridgeModalOpen] = useState(false);

  // Poll status without resubmitting. Read failures retain the transaction hash.
  useEffect(() => {
    if (!pendingTx) return;
    let cancelled = false;

    const checkTxStatus = async () => {
      try {
        const service = await getRadixService();
        const status = await service.getTransactionStatus(pendingTx);
        if (cancelled) return;
        setPendingStatusError(false);
        if (status === "success") {
          clearPendingDelta();
          if (!isTodayDone) markTodayComplete();
          navigate("/reveal", { state: { tier: selectedTier, txHash: pendingTx } });
          setPendingTx("");
        } else if (status === "failed") {
          toast({
            title: "Transaction Failed",
            description: "The ledger rejected the transaction. No badge was minted; check the explorer for details.",
            variant: "destructive",
          });
          clearPendingDelta();
          setPendingTx("");
        }
      } catch (error) {
        if (!cancelled) {
          setPendingStatusError(true);
          logger.error("Error checking transaction status", error, "Open");
        }
      }
    };

    void checkTxStatus();
    const interval = setInterval(checkTxStatus, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pendingTx, selectedTier, isTodayDone, navigate, toast, clearPendingDelta, setPendingTx, markTodayComplete]);

  const totalCost = selectedTier.price;
  const canAfford = balance >= totalCost;
  const isProcessing = isLoading || !!pendingTx;

  const openBox = useCallback(async () => {
    if (isProcessing) return;
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
        totalCost,
      );

      setPendingTx(txHash);
      setPendingStatusError(false);

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
    isProcessing,
    playButtonClick,
    playError,
    playOpenCapsule,
    connectWallet,
    toast,
    queueMintRequest,
    setPendingDelta,
    setPendingTx,
    clearPendingDelta,
  ]);

  // Bridge swipe gesture removed — it was completely undiscoverable.
  // When FEATURE_BRIDGE is enabled, a visible button should be used instead.

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
    <main className="min-h-screen bg-background p-4 pb-24 flex flex-col relative">
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
        streak={streak}
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

        {boosterCost > 0 && (
          <BoosterControl
            isActive={boosterActive}
            cost={boosterCost}
            description={boosterDescription}
            onToggle={toggleBooster}
          />
        )}

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
          {!isConnected ? (
            <p className="text-muted-foreground text-base">
              Connect your Radix wallet to start opening mystery boxes
            </p>
          ) : (
            <p className="text-muted-foreground text-base">
              {isOnline
                ? "Tap the button to open a box and earn SP"
                : "Tap the button to queue — we'll submit when you're back online"}
            </p>
          )}
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
              {pendingStatusError && (
                <p className="text-sm text-yellow-400" role="status">
                  Status check temporarily unavailable. Retrying without resubmitting your transaction.
                </p>
              )}
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
            <p className="text-green-400 text-sm font-mono break-all" title={address}>
              Connected: {address}
            </p>
          )}

          <div className="pt-4">
            <GameInfo />
          </div>
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
