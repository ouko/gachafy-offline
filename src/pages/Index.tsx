import { useEffect } from "react";
import HeroSection from "@/components/HeroSection";
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
    </main>
  );
};

export default Index;
