import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeroSection from "@/components/HeroSection";
import AudioControls from "@/components/AudioControls";
import { setupPWAInstall, isStandalone } from "@/utils/pwa";
import { X, Download } from "lucide-react";

const pwaInstall = setupPWAInstall();

const Index = () => {
  const navigate = useNavigate();
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Use replace: true so the landing page doesn't create a back-button trap.
    // Pressing back from /open will exit the app instead of looping here.
    const timer = setTimeout(() => {
      navigate('/open', { replace: true });
    }, 6000);

    return () => clearTimeout(timer);
  }, [navigate]);

  useEffect(() => {
    // Surface the PWA install prompt on the landing page.
    // Don't show if already installed (standalone) or if prompt isn't available.
    const checkPrompt = () => {
      if (!isStandalone() && pwaInstall.isPromptAvailable()) {
        setShowInstallBanner(true);
      }
    };
    // Delay slightly so the banner doesn't flash immediately before redirect
    const t = setTimeout(checkPrompt, 500);
    return () => clearTimeout(t);
  }, []);

  const handleInstall = async () => {
    try {
      await pwaInstall.showInstallPrompt();
      setShowInstallBanner(false);
    } catch {
      // Prompt failed or was dismissed — fine.
    }
  };

  return (
    <main className="min-h-screen bg-background relative">
      <HeroSection />
      <AudioControls />

      {showInstallBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border p-4 animate-in slide-in-from-bottom">
          <div className="max-w-md mx-auto flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium">Install GachaFi</p>
              <p className="text-xs text-muted-foreground">
                Add to your home screen for the best experience.
              </p>
            </div>
            <button
              onClick={handleInstall}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Download size={16} />
              Install
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss install prompt"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Index;
