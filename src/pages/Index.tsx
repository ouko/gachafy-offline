import { useEffect } from "react";
import HeroSection from "@/components/HeroSection";
import AudioControls from "@/components/AudioControls";
import { registerSW, setupPWAInstall } from "@/utils/pwa";

const Index = () => {
  useEffect(() => {
    // Register service worker for PWA functionality
    registerSW();
    
    // Setup PWA install prompt
    setupPWAInstall();
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <AudioControls />
    </main>
  );
};

export default Index;
