import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Wait for fade out animation
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) {
    return (
      <div className="fixed inset-0 z-50 bg-background animate-fade-out pointer-events-none">
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background/95 to-primary/5">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-holographic rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-premium rounded-full blur-2xl animate-pulse-slow delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-mystical rounded-full blur-xl animate-spin-slow"></div>
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
            {/* Logo/Brand */}
            <div className="text-center mb-8 animate-scale-in">
              <h1 className="text-6xl md:text-8xl font-black bg-gradient-text bg-clip-text text-transparent mb-4">
                GachaFi
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground/80">
                Premium Digital Collectibles
              </p>
            </div>

            {/* Loading animation */}
            <div className="flex items-center space-x-2 animate-fade-in delay-500">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background/95 to-primary/5">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-holographic rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-premium rounded-full blur-2xl animate-pulse-slow delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-mystical rounded-full blur-xl animate-spin-slow"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
          {/* Logo/Brand */}
          <div className="text-center mb-8 animate-scale-in">
            <h1 className="text-6xl md:text-8xl font-black bg-gradient-text bg-clip-text text-transparent mb-4">
              GachaFi
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground/80">
              Premium Digital Collectibles
            </p>
          </div>

          {/* Loading animation */}
          <div className="flex items-center space-x-2 animate-fade-in delay-500">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;