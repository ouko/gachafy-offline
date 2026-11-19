import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import { GameProvider } from "@/contexts/GameContext";
import { OfflineProvider } from "@/contexts/OfflineContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Open from "./pages/Open";
import Reveal from "./pages/Reveal";
import Inventory from "./pages/Inventory";
import NotFound from "./pages/NotFound";
import { BottomNav } from "@/components/BottomNav";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <GameProvider>
          <OfflineProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/open" element={<ErrorBoundary><Open /></ErrorBoundary>} />
                  <Route path="/reveal" element={<ErrorBoundary><Reveal /></ErrorBoundary>} />
                  <Route path="/inventory" element={<ErrorBoundary><Inventory /></ErrorBoundary>} />
                  <Route path="/creator" element={<Navigate to="/inventory" replace />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <BottomNav />
              </BrowserRouter>
            </TooltipProvider>
          </OfflineProvider>
        </GameProvider>
      </WalletProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
