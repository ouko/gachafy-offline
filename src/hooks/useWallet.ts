import { useWalletContext } from "@/contexts/WalletContext";

export const useWallet = () => {
  const { wallet, connectWallet, setPendingDelta, clearPendingDelta, setPendingTx } = useWalletContext();

  return {
    address: wallet.address,
    balance: wallet.balance,
    pendingDelta: wallet.pendingDelta,
    isConnected: wallet.isConnected,
    isLoading: wallet.isLoading,
    isBalanceLoading: wallet.isBalanceLoading,
    pendingTx: wallet.pendingTx,
    connectWallet,
    setPendingDelta,
    clearPendingDelta,
    setPendingTx,
  };
};
