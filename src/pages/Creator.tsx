import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, Coins, DollarSign, Zap, RefreshCw, Info, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { FEATURE_CREATOR_DASHBOARD } from '@/lib/featureFlags';

interface CapsuleData {
  id: string;
  name: string;
  totalOpens: number;
  spEarnedToday: number;
  spEarnedAllTime: number;
  lastUpdated: Date;
}

interface EarningsData {
  totalSpToday: number;
  totalSpAllTime: number;
  usdEquivalent: number;
  xrdPrice: number | null; // null when no price feed is configured
  capsules: CapsuleData[];
}

const Creator = () => {
  const { address, isConnected, connectWallet } = useWallet();
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchCreatorData = useCallback(async () => {
    if (!isConnected || !address) return;
    setIsLoading(true);
    try {
      // On-chain aggregation of creator earnings is not yet implemented.
      // Until it is, this dashboard returns honest zeros instead of mock
      // data — fabricated USD figures would be worse than no figures.
      const data: EarningsData = {
        totalSpToday: 0,
        totalSpAllTime: 0,
        usdEquivalent: 0,
        xrdPrice: null,
        capsules: [],
      };
      setEarningsData(data);
      setLastRefresh(new Date());
    } catch (error) {
      logger.error('Failed to fetch creator data', error, 'Creator');
    } finally {
      setIsLoading(false);
    }
  }, [address, isConnected]);

  useEffect(() => {
    if (!isConnected) return;
    fetchCreatorData();
    const interval = setInterval(fetchCreatorData, 30000);
    return () => clearInterval(interval);
  }, [isConnected, fetchCreatorData]);

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  const formatXRD = (amount: number) => `${amount.toFixed(3)} XRD`;

  if (!FEATURE_CREATOR_DASHBOARD) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <Info className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Creator Dashboard</h1>
          <p className="text-muted-foreground">This feature is not enabled.</p>
        </Card>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <div className="mb-6">
            <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Creator Dashboard</h1>
            <p className="text-muted-foreground">
              Connect your Radix wallet to view your Capsule earnings.
            </p>
          </div>
          <Button
            size="lg"
            onClick={async () => {
              try {
                await connectWallet();
              } catch {
                // Errors are already logged by WalletContext.
              }
            }}
            className="min-w-[200px] h-14 text-lg font-bold rounded-2xl bg-[#00C389] hover:bg-[#00AB7A] text-white border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <Wallet size={20} className="mr-2" />
            Connect Wallet
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary" />
              Creator Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your Capsule performance and earnings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="text-xs text-muted-foreground">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            <Button
              onClick={fetchCreatorData}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm">Connected: {address?.slice(0, 20)}…</span>
          </div>
        </Card>

        {/* Honest banner: dashboard is wired but data sources aren't yet. */}
        <Card className="p-4 bg-muted/40 border-dashed">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">On-chain data integration in progress</p>
              <p className="text-muted-foreground">
                Earnings are calculated from on-chain transactions. Until the
                Capsule resource address is published, this view shows zero
                instead of estimated figures.
              </p>
            </div>
          </div>
        </Card>

        {isLoading && !earningsData && (
          <Card className="p-8 text-center">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Loading…</p>
          </Card>
        )}

        {earningsData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Today's Earnings</h3>
                  <Zap className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-primary">{formatXRD(earningsData.totalSpToday)}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(earningsData.xrdPrice === null ? null : earningsData.totalSpToday * earningsData.xrdPrice)}
                  </p>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">All-Time Earnings</h3>
                  <Coins className="w-5 h-5 text-blue-500" />
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-primary">{formatXRD(earningsData.totalSpAllTime)}</p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(earningsData.xrdPrice === null ? null : earningsData.usdEquivalent)}</p>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">XRD Price</h3>
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-primary">{formatCurrency(earningsData.xrdPrice)}</p>
                  <p className="text-sm text-muted-foreground">
                    {earningsData.xrdPrice === null ? 'Price feed not configured' : 'Per XRD'}
                  </p>
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-6">Your Capsules</h3>

              {earningsData.capsules.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h4 className="text-lg font-medium mb-2">No Capsules yet</h4>
                  <p className="text-muted-foreground">
                    You haven't created any Capsules. Start creating to earn from opens.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {earningsData.capsules.map((capsule) => (
                    <div key={capsule.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{capsule.name}</h4>
                          <p className="text-sm text-muted-foreground">ID: {capsule.id.slice(0, 20)}…</p>
                        </div>
                        <Badge variant="outline">{capsule.totalOpens} opens</Badge>
                      </div>
                      <Separator className="my-3" />
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Today</p>
                          <p className="font-medium">{formatXRD(capsule.spEarnedToday)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">All-Time</p>
                          <p className="font-medium">{formatXRD(capsule.spEarnedAllTime)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">USD Value</p>
                          <p className="font-medium">
                            {formatCurrency(earningsData.xrdPrice === null ? null : capsule.spEarnedAllTime * earningsData.xrdPrice)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last Updated</p>
                          <p className="font-medium">{capsule.lastUpdated.toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-4 bg-muted/50">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">How creator earnings work</p>
                  <p className="text-muted-foreground">
                    You earn 0.5% of SP from every open of your Capsules. Earnings
                    are calculated from on-chain transaction data.
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Creator;
