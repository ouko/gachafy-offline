import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [currentPhase, setCurrentPhase] = useState(0);

  useEffect(() => {
    // Visual phase transitions
    const phaseTimer = setInterval(() => {
      setCurrentPhase(prev => (prev + 1) % 3);
    }, 400);

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 400);
    }, 1500);

    return () => {
      clearTimeout(timer);
      clearInterval(phaseTimer);
    };
  }, [onComplete]);

  // Visual graphics instead of text
  const visualElements = [
    "💎", // Premium collectibles
    "🎁", // Gacha boxes/capsules
    "⚡"  // Power/energy
  ];

  if (!isVisible) {
    return (
      <div className="fixed inset-0 z-50 bg-background animate-fade-out pointer-events-none">
        <div className="relative min-h-screen overflow-hidden">
          {/* Enhanced holographic background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-primary/10"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-holographic opacity-60 animate-pulse-slow"></div>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-premium rounded-full blur-3xl animate-magical-float opacity-80"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-mystical rounded-full blur-2xl animate-magical-float delay-1000 opacity-70"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-holographic rounded-full blur-xl animate-spin-slow opacity-50"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
          <div className="text-center animate-scale-in">
            <h1 className="text-7xl md:text-9xl font-black bg-gradient-text bg-clip-text text-transparent mb-6 animate-holographic-pulse">
              GachaFi
            </h1>
            <div className="h-16 mb-8 flex items-center justify-center">
              <div className="text-6xl animate-magical-bounce">
                {visualElements[currentPhase]}
              </div>
            </div>
          </div>

            <div className="flex items-center space-x-3 animate-fade-in delay-500">
              <div className="w-3 h-3 bg-gradient-premium rounded-full animate-magical-bounce"></div>
              <div className="w-3 h-3 bg-gradient-mystical rounded-full animate-magical-bounce delay-200"></div>
              <div className="w-3 h-3 bg-gradient-holographic rounded-full animate-magical-bounce delay-400"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="relative min-h-screen overflow-hidden">
        {/* Enhanced holographic background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-primary/10"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-holographic opacity-60 animate-pulse-slow"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-premium rounded-full blur-3xl animate-magical-float opacity-80"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-mystical rounded-full blur-2xl animate-magical-float delay-1000 opacity-70"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-holographic rounded-full blur-xl animate-spin-slow opacity-50"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        <div className="text-center animate-scale-in">
          <h1 className="text-7xl md:text-9xl font-black bg-gradient-text bg-clip-text text-transparent mb-6 animate-holographic-pulse">
            GachaFi
          </h1>
          <div className="h-16 mb-8 flex items-center justify-center">
            <div className="text-6xl animate-magical-bounce">
              {visualElements[currentPhase]}
            </div>
          </div>
        </div>

          <div className="flex items-center space-x-3 animate-fade-in delay-500">
            <div className="w-3 h-3 bg-gradient-premium rounded-full animate-magical-bounce"></div>
            <div className="w-3 h-3 bg-gradient-mystical rounded-full animate-magical-bounce delay-200"></div>
            <div className="w-3 h-3 bg-gradient-holographic rounded-full animate-magical-bounce delay-400"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;