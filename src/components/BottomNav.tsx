import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Package, Layers, Shield } from "lucide-react";
import { memo } from "react";

export const BottomNav = memo(function BottomNav() {
  const location = useLocation();
  const pathname = location.pathname;

  const navItems = [
    { path: "/open", label: "Open", icon: Package },
    { path: "/inventory", label: "Collection", icon: Layers },
    { path: "/privacy", label: "Privacy", icon: Shield },
  ];

  // Hide nav on landing page and reveal page for immersion
  if (pathname === "/" || pathname === "/reveal") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t border-border/50 safe-area-pb">
      <div className="max-w-md mx-auto flex items-center justify-around px-4 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all duration-200",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
});
