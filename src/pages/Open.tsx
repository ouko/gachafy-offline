import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { useToast } from "@/hooks/use-toast";
import { radixService, shortenTxHash } from "@/lib/radix";

interface Tier {
  id: string;
  name: string;
  price: number;
  rarity: "common" | "rare" | "epic";
}

const tiers: Tier[] = [
  { id: "common", name: "Common", price: 8, rarity: "common" },
  { id: "rare", name: "Rare", price: 15, rarity: "rare" },
  { id: "epic", name: "Epic", price: 25, rarity: "epic" },
];

const rarityColors = {
  common: "from-slate-500 to-slate-600",
  rare: "from-blue-500 to-blue-600", 
  epic: "from-purple-500 to-purple-600",
};

const Open = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isOnline, queuedRequests, queueMintRequest } = useOfflineQueue();
  const [balance, setBalance] = useState(0); // Live XRD balance
  const [selectedTier, setSelectedTier] = useState<Tier>(tiers[2]); // Default to Epic
  const [startY, setStartY] = useState(0);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [pendingTx, setPendingTx] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Radix connection
  useEffect(() => {
    const initRadix = async () => {
      try {
        console.log('Initializing Radix service...');
        await radixService.initialize();
        console.log('Radix service initialized');
        
        // Try to auto-connect if previously connected
        console.log('Attempting auto-connect...');
        const result = await radixService.connectWallet();
        console.log('Auto-connect result:', result);
        
        if (result?.accounts?.length > 0) {
          setWalletAddress(result.accounts[0].address);
          setIsConnected(true);
          console.log('Auto-connected to wallet:', result.accounts[0].address);
        } else {
          console.log('No auto-connection available');
        }
      } catch (error) {
        console.error('Radix initialization error:', error);
      }
    };
    
    initRadix();
  }, []);

  // Poll balance every 5 seconds (live RPC)
  useEffect(() => {
    if (!isConnected || !walletAddress) return;

    const fetchBalance = async () => {
      try {
        const liveBalance = await radixService.getBalance(walletAddress);
        setBalance(liveBalance);
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };

    fetchBalance(); // Initial fetch
    const interval = setInterval(fetchBalance, 5000);

    return () => clearInterval(interval);
  }, [isConnected, walletAddress]);

  // Poll pending transaction status
  useEffect(() => {
    if (!pendingTx) return;

    const checkTxStatus = async () => {
      try {
        const status = await radixService.getTransactionStatus(pendingTx);
        if (status === 'success') {
          navigate("/reveal", { state: { tier: selectedTier, txHash: pendingTx } });
          setPendingTx("");
        } else if (status === 'failed') {
          toast({
            title: "Transaction Failed",
            description: "Not enough XRD or transaction rejected",
            variant: "destructive",
          });
          // Refund the balance
          setBalance(prev => prev + selectedTier.price);
          setPendingTx("");
        }
      } catch (error) {
        console.error('Error checking transaction status:', error);
      }
    };

    const interval = setInterval(checkTxStatus, 3000);
    return () => clearInterval(interval);
  }, [pendingTx, selectedTier, navigate, toast]);

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      console.log('Manual wallet connection attempt...');
      const result = await radixService.connectWallet();
      console.log('Manual connection result:', result);
      
      if (result?.accounts?.length > 0) {
        setWalletAddress(result.accounts[0].address);
        setIsConnected(true);
        console.log('Successfully connected wallet:', result.accounts[0].address);
        toast({
          title: "Wallet Connected",
          description: `Connected to ${result.accounts[0].address.slice(0, 10)}...`,
        });
      } else {
        console.error('No accounts returned from wallet connection');
        toast({
          title: "Connection Failed", 
          description: "No wallet found or user cancelled",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Manual wallet connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openBox = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    if (balance < selectedTier.price) {
      toast({
        title: "Insufficient Funds",
        description: `Not enough XRD. Need ${selectedTier.price} XRD`,
        variant: "destructive",
      });
      return;
    }

    if (!isOnline) {
      // Queue request for offline processing
      await queueMintRequest(selectedTier);
      return;
    }

    try {
      setIsLoading(true);
      // Deduct balance immediately for UX
      setBalance(prev => prev - selectedTier.price);
      
      // Call Radix Stokenet to mint badge NFT
      const txHash = await radixService.mintGachaBadge(
        walletAddress, 
        selectedTier.id, 
        selectedTier.price
      );
      
      setPendingTx(txHash);
      
      toast({
        title: "Transaction Submitted",
        description: `TX: ${shortenTxHash(txHash)}`,
      });
    } catch (error) {
      console.error('Mint failed:', error);
      // Revert balance on failure
      setBalance(prev => prev + selectedTier.price);
      toast({
        title: "Transaction Failed",
        description: "Failed to submit transaction",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endY = e.changedTouches[0].clientY;
    const diff = startY - endY;
    
    // Swipe up threshold
    if (diff > 50) {
      openBox();
    }
  };

  const canAfford = balance >= selectedTier.price;
  const isProcessing = isLoading || !!pendingTx;

  return (
    <main className="min-h-screen bg-background p-4 flex flex-col">
      {/* Top Balance Bar */}
      <div className="flex justify-center mb-8">
        <div className="bg-card rounded-full px-6 py-2 shadow-card border border-border flex items-center gap-3">
          <span className="text-sm font-semibold text-primary">
            {balance.toFixed(3)} XRD
          </span>
          {!isConnected && (
            <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
              NOT CONNECTED
            </span>
          )}
          {!isOnline && (
            <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full">
              OFFLINE
            </span>
          )}
          {pendingTx && (
            <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
              TX: {shortenTxHash(pendingTx)}
            </span>
          )}
          {queuedRequests.length > 0 && (
            <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">
              {queuedRequests.length} queued
            </span>
          )}
        </div>
      </div>

      {/* Tier Cards */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="overflow-x-auto">
          <div className="flex gap-4 px-4 snap-x snap-mandatory">
            {tiers.map((tier) => (
              <Card
                key={tier.id}
                className={cn(
                  "min-w-[110px] h-[140px] flex flex-col items-center justify-center cursor-pointer transition-smooth snap-center",
                  "bg-gradient-to-br gradient-card border",
                  selectedTier.id === tier.id 
                    ? "border-[#8338EC] shadow-[0_0_0_4px_#8338EC40]" 
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => setSelectedTier(tier)}
              >
                <div className={cn(
                  "w-16 h-16 rounded-lg bg-gradient-to-br mb-2",
                  rarityColors[tier.rarity]
                )} />
                <h3 className="text-sm font-semibold text-foreground">{tier.name}</h3>
                <p className="text-xs text-muted-foreground">{tier.price} XRD</p>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-12 flex justify-center">
          <Button
            size="lg"
            className={cn(
              "w-[300px] h-[56px] text-lg font-semibold transition-smooth",
              (!isConnected || isProcessing) 
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-glow"
                : canAfford 
                  ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow" 
                  : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            disabled={isProcessing || (!isConnected ? false : !canAfford)}
            onClick={openBox}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {!isConnected 
              ? 'Connect Wallet' 
              : isProcessing 
                ? 'Processing...' 
                : !isOnline 
                  ? `Queue ${selectedTier.name} ${selectedTier.price} XRD`
                  : `Open ${selectedTier.name} ${selectedTier.price} XRD`
            }
          </Button>
        </div>

        {/* Status Messages */}
        <div className="text-center mt-4 space-y-2">
          <p className="text-muted-foreground text-sm">
            {!isConnected 
              ? 'Connect your Radix wallet to start'
              : `Tap or swipe up to ${!isOnline ? 'queue' : 'open'}`
            }
          </p>
          {!isOnline && (
            <p className="text-orange-400 text-xs">
              Offline mode - requests will be processed when online
            </p>
          )}
          {pendingTx && (
            <p className="text-blue-400 text-xs">
              Transaction pending on Stokenet...
            </p>
          )}
          {isConnected && walletAddress && (
            <p className="text-green-400 text-xs">
              Connected: {walletAddress.slice(0, 20)}...
            </p>
          )}
          {!isConnected && (
            <p className="text-yellow-400 text-xs">
              Make sure you have Radix Wallet installed and connected to Stokenet
            </p>
          )}
        </div>
      </div>
    </main>
  );
};

export default Open;