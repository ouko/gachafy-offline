import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { offlineQueueDB, type MintRequest } from "@/utils/offlineQueue";
import { getRadixService } from "@/lib/radix-lazy";
import { logger } from "@/lib/logger";
import { useToast } from "@/hooks/use-toast";
import { FEATURE_OFFLINE_QUEUE } from "@/lib/featureFlags";

interface OfflineContextType {
  isOnline: boolean;
  queuedRequests: MintRequest[];
  queueMintRequest: (tier: MintRequest["tier"], userId?: string) => Promise<MintRequest | null>;
  processOfflineQueue: () => Promise<void>;
  clearQueue: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [queuedRequests, setQueuedRequests] = useState<MintRequest[]>([]);
  const { toast } = useToast();
  const isProcessingRef = useRef(false);

  const loadQueuedRequests = useCallback(async () => {
    if (!FEATURE_OFFLINE_QUEUE) return;
    try {
      const requests = await offlineQueueDB.getAllMintRequests();
      setQueuedRequests(requests);
    } catch (error) {
      logger.error("Failed to load queued requests", error, "OfflineContext");
    }
  }, []);

  const processOfflineQueue = useCallback(async () => {
    if (!FEATURE_OFFLINE_QUEUE) return;
    if (isProcessingRef.current) return;
    if (!navigator.onLine) return;

    isProcessingRef.current = true;
    try {
      const requests = await offlineQueueDB.getAllMintRequests();
      if (requests.length === 0) return;

      toast({
        title: "Replaying queued requests",
        description: `Processing ${requests.length} request${requests.length === 1 ? "" : "s"}…`,
      });

      for (const request of requests) {
        try {
          if (!request.userId) {
            logger.warn("Skipping queued request without userId", { id: request.id }, "OfflineContext");
            continue;
          }
          const service = await getRadixService();
          const txHash = await service.mintGachaBadge(
            request.userId,
            request.tier.id,
            request.tier.price,
          );
          await offlineQueueDB.removeMintRequest(request.id);
          toast({
            title: "Replayed",
            description: `${request.tier.name} submitted (${txHash.slice(0, 10)}…)`,
          });
        } catch (error) {
          logger.error("Replay failed", { id: request.id, error }, "OfflineContext");
          toast({
            title: "Replay failed",
            description: `${request.tier.name} could not be submitted. It will be retried later.`,
            variant: "destructive",
          });
        }
      }

      await loadQueuedRequests();
    } finally {
      isProcessingRef.current = false;
    }
  }, [loadQueuedRequests, toast]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processOfflineQueue();
    };
    const handleOffline = () => setIsOnline(false);

    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === "PROCESS_OFFLINE_QUEUE") {
        processOfflineQueue();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    navigator.serviceWorker?.addEventListener("message", handleSWMessage);

    if (FEATURE_OFFLINE_QUEUE) {
      loadQueuedRequests();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      navigator.serviceWorker?.removeEventListener("message", handleSWMessage);
    };
  }, [loadQueuedRequests, processOfflineQueue]);

  const queueMintRequest = useCallback(
    async (tier: MintRequest["tier"], userId?: string) => {
      if (!FEATURE_OFFLINE_QUEUE) {
        toast({
          title: "Offline mode unavailable",
          description: "Reconnect to the internet to open boxes.",
          variant: "destructive",
        });
        return null;
      }

      try {
        const nonce = await offlineQueueDB.getNextNonce();
        const request: MintRequest = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          tier,
          timestamp: Date.now(),
          nonce,
          userId,
        };

        await offlineQueueDB.addMintRequest(request);
        await loadQueuedRequests();

        toast({
          title: "Queued",
          description: "Your request will be submitted when you reconnect.",
        });
        return request;
      } catch (error) {
        logger.error("Failed to queue mint request", error, "OfflineContext");
        throw error;
      }
    },
    [loadQueuedRequests, toast],
  );

  const clearQueue = useCallback(async () => {
    if (!FEATURE_OFFLINE_QUEUE) return;
    try {
      await offlineQueueDB.clearAllRequests();
      await loadQueuedRequests();
      toast({ title: "Queue cleared", description: "All queued requests removed." });
    } catch (error) {
      logger.error("Failed to clear queue", error, "OfflineContext");
    }
  }, [loadQueuedRequests, toast]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        queuedRequests,
        queueMintRequest,
        processOfflineQueue,
        clearQueue,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOfflineContext = () => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error("useOfflineContext must be used within an OfflineProvider");
  }
  return context;
};
