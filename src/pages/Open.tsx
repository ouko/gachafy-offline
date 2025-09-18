import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { useStreak } from "@/hooks/useStreak";
import { useToast } from "@/hooks/use-toast";
import { radixService, shortenTxHash } from "@/lib/radix";
import { Flame, Zap, Gem, Star, Crown, Sparkles } from "lucide-react";
import { NotificationDemo } from "@/components/NotificationDemo";
import { BridgeModal } from "@/components/BridgeModal";
import { Switch } from "@/components/ui/switch";
import { useBooster } from "@/hooks/useBooster";

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

const rarityConfig = {
  common: {
    gradient: "from-slate-400 via-slate-500 to-slate-600",
    glowColor: "rgba(148, 163, 184, 0.4)",
    icon: Gem,
    particles: 8,
    animation: "animate-pulse",
    borderGlow: "shadow-[0_0_15px_rgba(148,163,184,0.3)]",
  },
  rare: {
    gradient: "from-blue-400 via-blue-500 to-purple-600",
    glowColor: "rgba(59, 130, 246, 0.6)",
    icon: Star,
    particles: 12,
    animation: "animate-bounce",
    borderGlow: "shadow-[0_0_20px_rgba(59,130,246,0.5)]",
  },
  epic: {
    gradient: "from-purple-400 via-pink-500 to-red-500",
    glowColor: "rgba(168, 85, 247, 0.8)",
    icon: Crown,
    particles: 16,
    animation: "animate-pulse",
    borderGlow: "shadow-[0_0_25px_rgba(168,85,247,0.7)]",
  },
};

const Open = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isOnline, queuedRequests, queueMintRequest } = useOfflineQueue();
  const { streak, isTodayDone, streakMultiplier, markTodayComplete } = useStreak();
  const { isActive: boosterActive, cost: boosterCost, description: boosterDescription, toggleBooster } = useBooster();
  const [balance, setBalance] = useState(0); // Live XRD balance
  const [selectedTier, setSelectedTier] = useState<Tier>(tiers[2]); // Default to Epic
  const [startY, setStartY] = useState(0);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [pendingTx, setPendingTx] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isBridgeModalOpen, setIsBridgeModalOpen] = useState(false);
  const [swipeStartY, setSwipeStartY] = useState(0);
  const [swipeStartTime, setSwipeStartTime] = useState(0);

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
          console.log('No auto-connection available - enabling demo mode');
          setIsDemoMode(true);
        }
      } catch (error) {
        console.error('Radix initialization error:', error);
        console.log('Enabling demo mode due to connection error');
        setIsDemoMode(true);
      }
    };
    
    initRadix();
  }, []);

  // Poll balance every 5 seconds (live RPC or demo)
  useEffect(() => {
    if (!isConnected || !walletAddress) return;

    const fetchBalance = async () => {
      try {
        if (isDemoMode) {
          // Demo mode: simulate a realistic balance
          setBalance(35.5);
        } else {
          const liveBalance = await radixService.getBalance(walletAddress);
          setBalance(liveBalance);
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
    };

    fetchBalance(); // Initial fetch
    const interval = isDemoMode ? null : setInterval(fetchBalance, 5000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected, walletAddress, isDemoMode]);

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
      
      if (isDemoMode) {
        // Demo mode: simulate wallet connection
        console.log('Demo mode: simulating wallet connection...');
        setTimeout(() => {
          const demoAddress = "account_tdx_2_demo_simulation_12345678";
          setWalletAddress(demoAddress);
          setIsConnected(true);
          setBalance(35.5);
          setIsLoading(false);
          toast({
            title: "Demo Wallet Connected",
            description: "Connected to demo wallet (simulation mode)",
          });
        }, 1000);
        return;
      }
      
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
          description: "No wallet found or user cancelled - trying demo mode",
          variant: "destructive",
        });
        setIsDemoMode(true);
      }
    } catch (error) {
      console.error('Manual wallet connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet - trying demo mode",
        variant: "destructive",
      });
      setIsDemoMode(true);
    } finally {
      if (!isDemoMode) {
        setIsLoading(false);
      }
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
        description: `Not enough XRD. Need ${selectedTier.price + (boosterActive ? boosterCost : 0)} XRD`,
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
      // Calculate total cost including booster
      const totalCost = selectedTier.price + (boosterActive ? boosterCost : 0);
      // Deduct balance immediately for UX
      setBalance(prev => prev - totalCost);
      
      if (isDemoMode) {
        // Demo mode: simulate transaction with booster
        const demoTxHash = `demo_tx_${Date.now()}_${selectedTier.id}${boosterActive ? '_boosted' : ''}`;
        setPendingTx(demoTxHash);
        
        toast({
          title: "Demo Transaction Submitted",
          description: `TX: ${shortenTxHash(demoTxHash)} (simulation)`,
        });
        
        // Mark today as complete for streak
        if (!isTodayDone) {
          markTodayComplete();
        }
        
        // Simulate processing time and auto-complete
        setTimeout(() => {
          navigate("/reveal", { state: { tier: selectedTier, txHash: demoTxHash } });
          setPendingTx("");
        }, 3000);
      } else {
        // Call Radix Stokenet to mint badge NFT with streak multiplier
        const txHash = await radixService.mintGachaBadge(
          walletAddress, 
          selectedTier.id, 
          totalCost * streakMultiplier // Apply streak multiplier to total cost
        );
        
        // Log booster state for future use
        console.log('Mint with booster:', { booster: boosterActive, totalCost });
        
        setPendingTx(txHash);
        
        // Mark today as complete for streak
        if (!isTodayDone) {
          markTodayComplete();
        }
        
        toast({
          title: "Transaction Submitted",
          description: `TX: ${shortenTxHash(txHash)}`,
        });
      }
    } catch (error) {
      console.error('Mint failed:', error);
      // Revert balance on failure
      const totalCost = selectedTier.price + (boosterActive ? boosterCost : 0);
      setBalance(prev => prev + totalCost);
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

  // Balance pill swipe handlers
  const handleBalanceSwipeStart = (e: React.TouchEvent) => {
    setSwipeStartY(e.touches[0].clientY);
    setSwipeStartTime(Date.now());
  };

  const handleBalanceSwipeEnd = (e: React.TouchEvent) => {
    const endY = e.changedTouches[0].clientY;
    const endTime = Date.now();
    
    const distance = swipeStartY - endY; // Positive = swipe up
    const duration = endTime - swipeStartTime; // milliseconds
    const velocity = Math.abs(distance) / duration; // pixels per ms
    
    // Convert to m/s (rough approximation: 1 pixel ≈ 0.26mm on typical mobile)
    const velocityMeterPerSecond = velocity * 0.00026 * 1000;
    
    console.log(`Swipe velocity: ${velocityMeterPerSecond.toFixed(2)} m/s`);
    
    // Trigger bridge modal if swipe up velocity > 0.3 m/s
    if (distance > 30 && velocityMeterPerSecond > 0.3) {
      setIsBridgeModalOpen(true);
    }
  };

  const handleBridgeSuccess = (amount: number, txHash: string) => {
    // Update balance with bridged amount
    setBalance(prev => prev + amount);
    setIsBridgeModalOpen(false);
    
    toast({
      title: "Bridge Complete!",
      description: `+${amount.toFixed(3)} XRD added to wallet`,
    });
    
    console.log('Bridge successful - TX Hash:', txHash);
  };

  const totalPrice = selectedTier.price + (boosterActive ? boosterCost : 0);
  const canAfford = balance >= totalPrice;
  const isProcessing = isLoading || !!pendingTx;

  return (
    <main className="min-h-screen bg-background p-4 flex flex-col relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-purple rounded-full opacity-20 blur-xl float-element"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-gradient-neon rounded-full opacity-30 blur-lg float-element" style={{animationDelay: '1s'}}></div>
      </div>

      {/* Top Balance Bar */}
      <div className="flex justify-center mb-8 relative z-10">
        <div 
          className="glass-card rounded-full px-6 py-3 flex items-center gap-3 cursor-pointer hover:scale-105 transition-all duration-300 glow-pulse select-none"
          onTouchStart={handleBalanceSwipeStart}
          onTouchEnd={handleBalanceSwipeEnd}
          title="Swipe up to bridge USDC → XRD"
        >
          <span className="text-lg font-bold gradient-text font-mono">
            {balance.toFixed(3)} XRD
          </span>
          
          {/* Streak Pill */}
          {streak > 0 && (
            <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full shadow-neon">
              <Flame size={14} className="animate-pulse" />
              <span className="text-sm font-bold">Day-{streak}</span>
            </div>
          )}
          
          {!isConnected && (
            <span className="text-xs bg-red-500/80 text-white px-3 py-1 rounded-full backdrop-blur-sm">
              NOT CONNECTED
            </span>
          )}
          {isDemoMode && (
            <span className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full shadow-glow">
              DEMO MODE
            </span>
          )}
          {!isOnline && (
            <span className="text-xs bg-orange-500/80 text-white px-3 py-1 rounded-full backdrop-blur-sm">
              OFFLINE
            </span>
          )}
          {pendingTx && (
            <span className="text-xs bg-blue-500/80 text-white px-3 py-1 rounded-full backdrop-blur-sm font-mono">
              TX: {shortenTxHash(pendingTx)}
            </span>
          )}
          {queuedRequests.length > 0 && (
            <span className="text-xs bg-purple-500/80 text-white px-3 py-1 rounded-full backdrop-blur-sm">
              {queuedRequests.length} queued
            </span>
          )}
        </div>
      </div>

      {/* Tier Cards */}
      <div className="flex-1 flex flex-col justify-center relative z-10">
        <div className="overflow-x-auto">
          <div className="flex gap-6 px-4 snap-x snap-mandatory justify-center">
            {tiers.map((tier) => {
              const config = rarityConfig[tier.rarity];
              const IconComponent = config.icon;
              const isSelected = selectedTier.id === tier.id;
              
              return (
                <Card
                  key={tier.id}
                  className={cn(
                    "min-w-[140px] h-[180px] flex flex-col items-center justify-center cursor-pointer transition-all duration-500 snap-center relative overflow-hidden group",
                    "glass-card hover:scale-110 hover:-translate-y-2",
                    isSelected 
                      ? `border-primary ${config.borderGlow} transform scale-110 -translate-y-2` 
                      : "border-white/10 hover:border-primary/50"
                  )}
                  onClick={() => setSelectedTier(tier)}
                >
                  {/* Animated background particles */}
                  <div className="absolute inset-0 overflow-hidden">
                    {[...Array(config.particles)].map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "absolute w-1 h-1 bg-white rounded-full opacity-20",
                          isSelected ? "animate-ping" : "group-hover:animate-ping"
                        )}
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                          animationDelay: `${Math.random() * 2}s`,
                          animationDuration: `${2 + Math.random() * 2}s`,
                        }}
                      />
                    ))}
                  </div>

                  {/* Premium card content */}
                  <div className="relative z-10 flex flex-col items-center">
                    {/* Rarity icon with glow */}
                    <div className={cn(
                      "w-24 h-24 rounded-2xl mb-4 relative overflow-hidden flex items-center justify-center",
                      `bg-gradient-to-br ${config.gradient}`,
                      isSelected ? config.animation : `group-hover:${config.animation}`
                    )}>
                      {/* Inner glow effect */}
                      <div 
                        className="absolute inset-0 rounded-2xl opacity-60"
                        style={{
                          background: `radial-gradient(circle at center, ${config.glowColor} 0%, transparent 70%)`,
                        }}
                      />
                      
                      {/* Shimmer overlay */}
                      <div className={cn(
                        "absolute inset-0 rounded-2xl",
                        isSelected ? "shimmer" : "group-hover:shimmer"
                      )} />
                      
                      {/* Icon */}
                      <IconComponent 
                        className={cn(
                          "w-10 h-10 text-white relative z-10 drop-shadow-lg",
                          isSelected ? "animate-pulse" : "group-hover:animate-pulse"
                        )} 
                      />
                      
                      {/* Corner sparkles */}
                      <Sparkles 
                        className={cn(
                          "absolute top-1 right-1 w-4 h-4 text-white/60",
                          isSelected ? "animate-spin" : "group-hover:animate-spin"
                        )}
                      />
                    </div>

                    {/* Card details */}
                    <div className="text-center">
                      <h3 className={cn(
                        "text-lg font-bold mb-1 uppercase tracking-wider",
                        isSelected ? "gradient-text" : "text-foreground group-hover:gradient-text"
                      )}>
                        {tier.name}
                      </h3>
                      <p className={cn(
                        "text-sm font-mono font-semibold",
                        isSelected ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                      )}>
                        {tier.price}{boosterActive && selectedTier.id === tier.id ? ` + ${boosterCost}` : ''} XRD
                      </p>
                    </div>

                    {/* Rarity indicator */}
                    <div className={cn(
                      "absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                      `bg-gradient-to-r ${config.gradient} text-white shadow-lg`,
                      isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}>
                      {tier.rarity}
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-pulse">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>

                  {/* Holographic border effect */}
                  <div className={cn(
                    "absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300",
                    "bg-gradient-to-r from-transparent via-white/10 to-transparent",
                    isSelected ? "opacity-100" : "group-hover:opacity-100"
                  )} />
                </Card>
              );
            })}
          </div>
        </div>

        {/* Booster Toggle */}
        <div className="mt-8 flex justify-center">
          <div className="glass-card rounded-full px-6 py-3 flex items-center space-x-4 hover:scale-105 transition-all duration-300">
            <Zap className={cn("w-5 h-5 transition-colors", boosterActive ? "text-yellow-400" : "text-muted-foreground")} />
            <span className="text-base font-medium">{boosterDescription}</span>
            <Switch 
              checked={boosterActive}
              onCheckedChange={toggleBooster}
              className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-yellow-400 data-[state=checked]:to-orange-500"
            />
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-10 flex justify-center">
          <Button
            size="lg"
            className={cn(
              "w-[320px] h-[64px] text-xl font-bold transition-all duration-300 relative overflow-hidden",
              (!isConnected || isProcessing) 
                ? "neon-button" 
                : canAfford 
                  ? "neon-button hover:scale-105" 
                  : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
            )}
            disabled={isProcessing || (!isConnected ? false : !canAfford)}
            onClick={openBox}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <span className="relative z-10">
              {!isConnected 
                ? 'Connect Wallet' 
                : isProcessing 
                  ? 'Processing...' 
                  : !isOnline 
                    ? `Queue ${selectedTier.name} ${totalPrice} XRD${boosterActive ? ' (Boosted)' : ''}`
                    : `Open ${selectedTier.name} ${totalPrice} XRD${boosterActive ? ' (Boosted)' : ''}`
              }
            </span>
          </Button>
        </div>

        {/* Status Messages */}
        <div className="text-center mt-6 space-y-3 relative z-10">
          <p className="text-muted-foreground text-base">
            {!isConnected 
              ? 'Connect your Radix wallet to start'
              : `Tap or swipe up to ${!isOnline ? 'queue' : 'open'}`
            }
          </p>
          {!isOnline && (
            <p className="text-orange-400 text-sm font-medium">
              Offline mode - requests will be processed when online
            </p>
          )}
          {pendingTx && (
            <p className="text-blue-400 text-sm font-medium">
              Transaction pending on Stokenet...
            </p>
          )}
          {isConnected && walletAddress && (
            <p className="text-green-400 text-sm font-mono">
              Connected: {walletAddress.slice(0, 20)}...
              {isDemoMode && " (Demo)"}
            </p>
          )}
          {!isConnected && !isDemoMode && (
            <p className="text-yellow-400 text-sm">
              Make sure you have Radix Wallet installed and connected to Stokenet
            </p>
          )}
          {isDemoMode && !isConnected && (
            <p className="text-blue-400 text-sm">
              Demo mode active - click Connect Wallet to simulate the experience
            </p>
          )}
        </div>
      </div>

      {/* Demo Notification Panel (only visible in demo mode) */}
      {isDemoMode && (
        <div className="mt-8 relative z-10">
          <NotificationDemo />
        </div>
      )}

      {/* Bridge Modal */}
      <BridgeModal
        isOpen={isBridgeModalOpen}
        onClose={() => setIsBridgeModalOpen(false)}
        onSuccess={handleBridgeSuccess}
      />
    </main>
  );
};

export default Open;