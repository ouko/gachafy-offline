import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Crown, Gem, Home, RefreshCw, Star } from 'lucide-react';
import { BadgeImage } from '@/components/BadgeImage';
import { Button } from '@/components/ui/button';
import { getBadgeByTransaction, type GachaBadge } from '@/lib/gateway';
import { getTxExplorerUrl, shortenTxHash } from '@/lib/radix-config';
import { cn } from '@/lib/utils';

const rarityPresentation = {
  common: { gradient: 'from-slate-300 via-slate-400 to-slate-500', icon: Gem },
  rare: { gradient: 'from-blue-300 via-blue-400 to-purple-500', icon: Star },
  epic: { gradient: 'from-purple-300 via-pink-400 to-red-400', icon: Crown },
};

export default function Reveal() {
  const location = useLocation();
  const navigate = useNavigate();
  const txHash = (location.state as { txHash?: unknown } | null)?.txHash;
  const validTxHash = typeof txHash === 'string' && txHash.length >= 10 ? txHash : null;
  const [badge, setBadge] = useState<GachaBadge | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryIndex, setRetryIndex] = useState(0);
  const [spCount, setSpCount] = useState(0);
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    if (!validTxHash) {
      navigate('/open', { replace: true });
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();
    setBadge(null);
    setError(null);

    const resolveBadge = async () => {
      try {
        const resolved = await getBadgeByTransaction(validTxHash);
        if (cancelled) return;
        if (resolved) {
          setBadge(resolved);
          return;
        }
        if (Date.now() - startedAt >= 60000) {
          setError('The transaction succeeded, but the badge is still being indexed. Retry or open your collection to check again.');
          return;
        }
        timer = setTimeout(resolveBadge, 3000);
      } catch (reason: unknown) {
        if (cancelled) return;
        setError(reason instanceof Error ? reason.message : 'Radix Gateway is unavailable');
      }
    };

    void resolveBadge();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [validTxHash, retryIndex, navigate]);

  useEffect(() => {
    if (!badge) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let startTimer: ReturnType<typeof setTimeout> | undefined;
    const showTimer = setTimeout(() => setShowBadge(true), reduceMotion ? 0 : 100);

    if (reduceMotion) {
      setSpCount(badge.sp);
    } else {
      const startTime = Date.now();
      const animate = () => {
        const progress = Math.min((Date.now() - startTime) / 600, 1);
        setSpCount(Math.floor((1 - Math.pow(1 - progress, 3)) * badge.sp));
        if (progress < 1) frame = requestAnimationFrame(animate);
      };
      startTimer = setTimeout(animate, 400);
    }

    return () => {
      clearTimeout(showTimer);
      if (startTimer) clearTimeout(startTimer);
      cancelAnimationFrame(frame);
    };
  }, [badge]);

  if (error) {
    return (
      <main className="min-h-screen game-background flex items-center justify-center p-4">
        <div role="alert" className="max-w-sm text-center">
          <RefreshCw className="mx-auto mb-4 h-12 w-12 text-white/70" />
          <h1 className="text-2xl font-bold text-white">Could not load your badge</h1>
          <p className="mt-3 text-white/70">{error}</p>
          {validTxHash && (
            <a className="mt-4 block text-sm text-blue-300 underline" href={getTxExplorerUrl(validTxHash)} target="_blank" rel="noopener noreferrer">
              View {shortenTxHash(validTxHash)} on Explorer
            </a>
          )}
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => setRetryIndex((value) => value + 1)}>Try Again</Button>
            <Button variant="outline" className="border-white/30 text-white" onClick={() => navigate('/inventory')}>Collection</Button>
          </div>
        </div>
      </main>
    );
  }

  if (!badge) {
    return (
      <main className="min-h-screen game-background flex items-center justify-center p-4">
        <div role="status" className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
          <h1 className="text-xl font-semibold text-white">Confirming your badge…</h1>
          <p className="mt-2 text-sm text-white/60">The transaction succeeded. Waiting for Radix Gateway to index the NFT.</p>
        </div>
      </main>
    );
  }

  const presentation = rarityPresentation[badge.rarity as keyof typeof rarityPresentation] ?? rarityPresentation.common;
  const Icon = presentation.icon;
  const shareText = `I minted ${badge.name} on GachaFi and earned ${badge.sp.toLocaleString()} SP.`;

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ text: shareText });
      else if (navigator.clipboard) await navigator.clipboard.writeText(shareText);
    } catch {
      // Sharing can be cancelled without changing the minted asset.
    }
  };

  return (
    <main className="min-h-screen game-background flex flex-col items-center justify-center p-4">
      <div className="relative mb-8">
        <BadgeImage
          src={badge.imageUrl}
          alt={badge.name}
          eager
          className={cn('h-[200px] w-[200px] transition-all duration-500', showBadge ? 'scale-100 opacity-100' : 'scale-0 opacity-0')}
        />
        <div className={cn('absolute inset-0 -z-10 rounded-full bg-gradient-to-br opacity-70 blur-2xl', presentation.gradient)} />
      </div>

      <div className="mb-2 flex items-center gap-2 text-white/80">
        <Icon className="h-5 w-5" />
        <span className="text-lg uppercase tracking-widest">{badge.rarity} Badge</span>
      </div>
      <h1 className="mb-6 max-w-md text-center text-2xl font-bold text-white">{badge.name}</h1>

      <div className="mb-8 text-center" aria-live="polite">
        <div className="mb-2 text-6xl font-bold text-white">{spCount.toLocaleString()}</div>
        <div className="text-xl text-purple-200">SP Earned</div>
        <p className="mx-auto mt-2 max-w-xs text-sm text-white/60">{badge.description}</p>
      </div>

      <a className="mb-4 rounded-full bg-white/10 px-4 py-2 font-mono text-sm text-white" href={getTxExplorerUrl(validTxHash!)} target="_blank" rel="noopener noreferrer">
        TX: {shortenTxHash(validTxHash!)}
      </a>

      <div className="flex flex-col items-center gap-3">
        <Button onClick={() => void share()} className="bg-white px-8 py-3 font-semibold text-black hover:bg-gray-100">Share</Button>
        <Button onClick={() => navigate('/open', { replace: true })} variant="outline" className="border-white/30 px-8 py-3 text-white hover:bg-white/10">Open Another Box</Button>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={() => navigate('/inventory')} variant="ghost" className="text-white/70 hover:text-white" size="sm">
            <Home size={16} className="mr-2" />Collection
          </Button>
        </div>
      </div>
    </main>
  );
}
