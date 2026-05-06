import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import {
  LayoutGrid,
  Star,
  Building2,
  Settings,
  PlusCircle,
  Menu,
  Calendar as CalendarIcon,
  Sparkles,
  FileText,
  TrendingUp,
  MapPin,
  Bell,
  LogOut,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";

export const MobileBottomNav = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { icon: LayoutGrid, label: t("dashboard.title"), href: "/dashboard" },
    { icon: Star, label: t("dashboard.reviews"), href: "/reviews" },
    { icon: PlusCircle, label: t("dashboard.post"), href: "/gmb-post", isPlus: true },
    { icon: Building2, label: t("dashboard.businesses"), href: "/businesses" },
  ];

  const menuItems = [
    { icon: CalendarIcon, label: t("dashboard.calendar") || "Calendrier", href: "/calendar" },
    { icon: FileText, label: t("dashboard.seoAuto"), href: "/seo-autopost" },
    { icon: Sparkles, label: t("dashboard.aeoRank"), href: "/aeo-rank" },
    { icon: MapPin, label: t("dashboard.mapsRank"), href: "/maps-rank" },
    { icon: TrendingUp, label: t("dashboard.aiSettings"), href: "/ai-settings" },
    { icon: Bell, label: t("dashboard.notifications"), href: "/notifications" },
    { icon: Settings, label: t("dashboard.settings"), href: "/settings" },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    window.location.href = "/auth";
  };

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

        {/* Hamburger menu for everything else */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              className="flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all text-muted-foreground hover:text-foreground"
              aria-label="Menu"
            >
              <div className="relative transition-transform">
                <Menu className="w-5 h-5 stroke-[1.5px]" />
              </div>
              <span className="text-[10px] font-medium">Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-left">Menu</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${
                      isActive
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-card border-border text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <item.icon className="w-6 h-6" />
                    <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <button
              onClick={handleSignOut}
              className="mt-6 w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">{t("auth.signOut") || "Déconnexion"}</span>
            </button>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};
