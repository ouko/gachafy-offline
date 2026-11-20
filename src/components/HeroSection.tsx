import { Link } from 'react-router-dom';
import { ArrowRight, PackageOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroBg from '@/assets/hero-bg.jpg';

const HeroSection = () => {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,hsl(var(--primary)/0.12),transparent_50%)]" />

      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center px-6 py-16 text-center">
        <div className="mb-6 flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-purple-200">
          <Sparkles className="h-3.5 w-3.5" />
          On-chain on Radix
        </div>

        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[24px] bg-gradient-to-br from-primary to-pink-500 text-white shadow-2xl shadow-primary/25">
          <PackageOpen className="h-10 w-10" strokeWidth={1.8} />
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">GachaFi</h1>
        <p className="mt-4 text-2xl font-bold tracking-tight text-purple-200 sm:text-3xl">Open. Reveal. Collect.</p>
        <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground sm:text-lg">
          Choose your tier, mint a unique badge NFT, and build a collection that lives in your wallet.
        </p>

        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <Button asChild size="lg" className="primary-game-button h-14 w-full rounded-2xl px-8 text-base font-bold sm:w-auto">
            <Link to="/open">Play Now <ArrowRight className="ml-1 h-5 w-5" /></Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-14 w-full rounded-2xl border-border/80 bg-card/50 px-8 sm:w-auto">
            <Link to="/open#how-it-works">How to Play</Link>
          </Button>
        </div>

        <p className="mt-8 font-mono text-xs tabular-nums text-muted-foreground">
          Common 8 · Rare 15 · Epic 25 XRD
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
