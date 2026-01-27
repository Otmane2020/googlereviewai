import { Link, useLocation } from "react-router-dom";
import { 
  LayoutGrid, 
  Star, 
  Building2, 
  Settings,
  PlusCircle
} from "lucide-react";

const navItems = [
  { icon: LayoutGrid, label: "Accueil", href: "/dashboard" },
  { icon: Star, label: "Avis", href: "/reviews" },
  { icon: PlusCircle, label: "Post", href: "/gmb-post", isPlus: true },
  { icon: Building2, label: "Business", href: "/businesses" },
  { icon: Settings, label: "Réglages", href: "/settings" },
];

export const MobileBottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-xl border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const isPlus = item.isPlus;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
                isPlus 
                  ? "" 
                  : isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isPlus ? (
                <div className="relative -mt-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                    <item.icon className="w-6 h-6 text-primary-foreground stroke-[2.5px]" />
                  </div>
                </div>
              ) : (
                <div className={`relative ${isActive ? "scale-110" : ""} transition-transform`}>
                  <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"}`} />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </div>
              )}
              <span className={`text-[10px] font-medium ${isPlus ? "text-primary mt-1" : isActive ? "text-primary" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
