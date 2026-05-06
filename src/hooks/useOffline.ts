import { useOfflineContext } from "@/contexts/OfflineContext";

export const useOffline = () => {
  const { isOnline, queuedRequests, queueMintRequest, processOfflineQueue, clearQueue } = useOfflineContext();

  return {
    isOnline,
    queuedRequests,
    queueMintRequest,
    processOfflineQueue,
    clearQueue,
  };
};
