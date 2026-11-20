import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useOffline } from "@/hooks/useOffline";
import { useStreak } from "@/hooks/useStreak";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { getRadixService } from "@/lib/radix-lazy";
import { getTxExplorerUrl, shortenTxHash } from "@/lib/radix-config";
import { useBooster } from "@/hooks/useBooster";
import { useAudio } from "@/hooks/useAudio";
import { logger } from "@/lib/logger";
import { FEATURE_OFFLINE_QUEUE, GACHA_DEPLOYED } from "@/lib/featureFlags";
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
    hasBalanceError,
    setPendingDelta,
    clearPendingDelta,
    setPendingTx,
    connectWallet,
  } = useWallet();

  const [selectedTier, setSelectedTier] = useState<Tier>(tiers[2]); // Default Epic
  const [isLoading, setIsLoading] = useState(false);
  const [pendingStatusError, setPendingStatusError] = useState(false);

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
  const canAfford = !hasBalanceError && balance >= totalCost;
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
      if (!FEATURE_OFFLINE_QUEUE) {
        playError();
        toast({
          title: "You are offline",
          description: "Reconnect to the internet to open a box. No transaction was submitted.",
          variant: "destructive",
        });
        return;
      }
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

  const handleDismissPending = useCallback(() => {
    clearPendingDelta();
    setPendingTx("");
    toast({
      title: "Dismissed",
      description: "Transaction status cleared. The on-chain transaction may still complete.",
    });
  }, [clearPendingDelta, setPendingTx, toast]);

  return (
    <main className="game-background relative flex min-h-screen flex-col px-4 pb-28 pt-20">
      <BalanceDisplay
        balance={balance}
        pendingDelta={pendingDelta}
        pendingTx={pendingTx}
        streak={streak}
        isOnline={isOnline}
        queuedRequestsCount={queuedRequests.length}
        isLoading={isBalanceLoading}
        hasError={hasBalanceError}
      />

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center py-6">
        <div className="w-full">
          <TierSelector
            selectedTier={selectedTier}
            onSelect={setSelectedTier}
            onPlaySound={playButtonClick}
            onPlayHover={playButtonHover}
            boosterActive={boosterActive}
            boosterCost={boosterCost}
            isLoading={false}
          />
        </div>

        {boosterCost > 0 && (
          <BoosterControl
            isActive={boosterActive}
            cost={boosterCost}
            description={boosterDescription}
            onToggle={toggleBooster}
          />
        )}

        <div className="mt-8 flex w-full justify-center">
          <OpenButton
            isConnected={isConnected}
            canAfford={canAfford}
            isProcessing={isProcessing}
            isOnline={isOnline}
            offlineQueueEnabled={FEATURE_OFFLINE_QUEUE}
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
                : FEATURE_OFFLINE_QUEUE
                  ? "Tap the button to queue an unsigned request for when you're back online"
                  : "Reconnect to open a box. No transaction can be submitted offline."}
            </p>
          )}
          {!GACHA_DEPLOYED && isConnected && (
            <p className="text-yellow-400 text-sm">
              Gacha component not yet deployed for this network.
            </p>
          )}
          {!isOnline && (
            <p className="text-orange-400 text-sm font-medium">
              {FEATURE_OFFLINE_QUEUE
                ? "Offline queue enabled — requests still require wallet approval when replayed."
                : "Offline mode — wallet and blockchain actions are unavailable."}
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
            <p className="font-mono text-xs text-emerald-400" title={address}>
              Connected: {address.slice(0, 12)}…{address.slice(-6)}
            </p>
          )}

          <div className="pt-4">
            <GameInfo />
          </div>
        </div>
      </div>

    </main>
  );
};

export default Open;
