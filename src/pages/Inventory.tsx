import { useCallback, useEffect, useState } from 'react';
import { Layers, RefreshCw, Sparkles, Wallet } from 'lucide-react';
import { BadgeCard } from '@/components/BadgeCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useWallet } from '@/hooks/useWallet';
import { getBadgeInventory, getTotalMinted, type GachaBadge } from '@/lib/gateway';
import { logger } from '@/lib/logger';

export default function Inventory() {
  const { address, isConnected, connectWallet } = useWallet();
  const [badges, setBadges] = useState<GachaBadge[]>([]);
  const [totalMinted, setTotalMinted] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const refresh = useCallback(() => setRefreshIndex((value) => value + 1), []);

  useEffect(() => {
    if (!isConnected || !address) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([getBadgeInventory(address), getTotalMinted()])
      .then(([items, total]) => {
        if (cancelled) return;
        setBadges(items);
        setTotalMinted(total);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        logger.error('Failed to load badge collection', reason, 'Inventory');
        setError(reason instanceof Error ? reason.message : 'Radix Gateway is unavailable');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [address, isConnected, refreshIndex]);

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-background p-4 pb-24 flex items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <Wallet className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="mb-2 text-2xl font-bold">Your Collection</h1>
          <p className="mb-6 text-muted-foreground">Connect your Radix wallet to see the badges held by your account.</p>
          <Button onClick={() => void connectWallet()} size="lg">Connect Wallet</Button>
        </Card>
      </main>
    );
  }

  const totalSp = badges.reduce((sum, badge) => sum + badge.sp, 0);

  return (
    <main className="min-h-screen bg-background p-4 pb-24">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Your Collection</h1>
            <p className="mt-1 text-muted-foreground">Real GachaFi NFTs held by the connected account.</p>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </header>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Sparkles className="h-4 w-4" />Your SP</div>
            <p className="mt-2 text-3xl font-bold">{totalSp.toLocaleString()}</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Layers className="h-4 w-4" />Global badges</div>
            <p className="total-supply mt-2 text-3xl font-bold">{totalMinted.toLocaleString()}</p>
          </Card>
        </div>

        {isLoading && (
          <div role="status" className="py-16 text-center text-muted-foreground">
            <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
            Loading on-chain badges…
          </div>
        )}

        {!isLoading && error && (
          <Card className="p-8 text-center" role="alert">
            <h2 className="text-xl font-semibold">Could not load your collection</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{error}. Your wallet and blockchain assets have not changed.</p>
            <Button className="mt-5" onClick={refresh}>Try Again</Button>
          </Card>
        )}

        {!isLoading && !error && badges.length === 0 && (
          <Card className="p-10 text-center">
            <Sparkles className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold">No badges yet</h2>
            <p className="mt-2 text-muted-foreground">Open a mystery box to mint your first badge into this account.</p>
          </Card>
        )}

        {!isLoading && !error && badges.length > 0 && (
          <section aria-label="Badge collection" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {badges.map((badge) => <BadgeCard key={`${badge.resourceAddress}:${badge.id}`} badge={badge} />)}
          </section>
        )}
      </div>
    </main>
  );
}
