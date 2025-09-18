import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Reveal = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const tier = location.state?.tier;

  if (!tier) {
    navigate("/open");
    return null;
  }

  return (
    <main className="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
      <Card className="w-full max-w-sm p-8 gradient-card border-border text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">
          Box Opened!
        </h1>
        <p className="text-muted-foreground mb-6">
          You opened a {tier.name} box for {tier.price} XRD
        </p>
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary to-accent rounded-lg animate-pulse" />
        <p className="text-lg font-semibold text-primary mb-8">
          Revealing your reward...
        </p>
        <Button 
          onClick={() => navigate("/open")}
          className="w-full bg-primary hover:bg-primary/90"
        >
          Open Another Box
        </Button>
      </Card>
    </main>
  );
};

export default Reveal;