import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-background/70" />
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-primary/20 rounded-full blur-xl animate-float" />
      <div className="absolute bottom-32 right-20 w-24 h-24 bg-accent/30 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-primary/10 rounded-full blur-lg animate-float" style={{ animationDelay: '4s' }} />
      
      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            GachaFi
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-2">
            The Future of Gacha Gaming DeFi
          </p>
          <p className="text-lg text-muted-foreground/80 max-w-2xl mx-auto">
            Experience the next generation of gacha gaming powered by DeFi mechanics. 
            Collect rare NFTs, trade assets, and earn rewards in the decentralized gaming economy.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button 
            size="lg" 
            className="gradient-hero text-white border-0 shadow-glow transition-smooth hover:shadow-glow hover:scale-105"
            onClick={() => window.location.href = '/open'}
          >
            Launch App
          </Button>
          <Button variant="outline" size="lg" className="border-primary/50 text-primary hover:bg-primary/10 transition-smooth">
            Learn More
          </Button>
        </div>
        
        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="gradient-card border-primary/20 p-6 shadow-card transition-smooth hover:shadow-glow hover:scale-105">
            <div className="text-3xl mb-4">🎲</div>
            <h3 className="text-xl font-semibold mb-2 text-primary">Gacha Mechanics</h3>
            <p className="text-muted-foreground">Collect rare NFTs through provably fair gacha mechanics powered by blockchain technology.</p>
          </Card>
          
          <Card className="gradient-card border-primary/20 p-6 shadow-card transition-smooth hover:shadow-glow hover:scale-105">
            <div className="text-3xl mb-4">💎</div>
            <h3 className="text-xl font-semibold mb-2 text-primary">DeFi Rewards</h3>
            <p className="text-muted-foreground">Stake your assets, provide liquidity, and earn yield through innovative DeFi protocols.</p>
          </Card>
          
          <Card className="gradient-card border-primary/20 p-6 shadow-card transition-smooth hover:shadow-glow hover:scale-105">
            <div className="text-3xl mb-4">🔄</div>
            <h3 className="text-xl font-semibold mb-2 text-primary">NFT Trading</h3>
            <p className="text-muted-foreground">Trade your collections on our built-in marketplace with zero gas fees and instant settlements.</p>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;