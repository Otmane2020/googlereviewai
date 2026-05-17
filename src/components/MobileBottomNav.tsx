import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { LayoutGrid, Star, Building2, Settings, PlusCircle, Menu, Calendar as CalendarIcon, FileText, TrendingUp, MapPin, Bell, LogOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";

export const MobileBottomNav = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { icon: LayoutGrid, label: t("dashboard.title"), href: "/dashboard" },
    { icon: Star, label: t("dashboard.reviews"), href: "/reviews" },
    { icon: PlusCircle, label: t("dashboard.post"), href: "/gmb-post", isPlus: true },
    { icon: Building2, label: t("dashboard.businesses"), href: "/businesses" },
  ];

  const isFr = !(i18n.language || "").toLowerCase().startsWith("en");
  const planningLabel = isFr ? "Planning" : "Planning";

  const menuItems = [
    { icon: FileText, label: t("dashboard.seoAuto"), href: "/seo-autopost", color: "text-blue-600 bg-blue-500/10" },
    { icon: Sparkles, label: t("dashboard.aeoRank"), href: "/aeo-rank", color: "text-purple-600 bg-purple-500/10" },
    { icon: CalendarIcon, label: planningLabel, href: "/calendar", color: "text-emerald-600 bg-emerald-500/10" },
    { icon: MapPin, label: t("dashboard.mapsRank"), href: "/maps-rank", color: "text-orange-600 bg-orange-500/10" },
    { icon: TrendingUp, label: t("dashboard.aiSettings"), href: "/ai-settings", color: "text-pink-600 bg-pink-500/10" },
    { icon: Bell, label: t("dashboard.notifications"), href: "/notifications", color: "text-amber-600 bg-amber-500/10" },
    { icon: Settings, label: t("dashboard.settings"), href: "/settings", color: "text-slate-600 bg-slate-500/10" },
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
          <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto border-t border-border/60 pb-8">
            <SheetHeader>
              <SheetTitle className="text-left">Menu</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-2.5 mt-3">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`group flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all active:scale-95 ${
                      isActive
                        ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20"
                        : "bg-card border-border/60 hover:bg-muted/40"
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${item.color}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[11px] font-medium text-center leading-tight ${isActive ? "text-primary" : "text-foreground"}`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
            <button
              onClick={handleSignOut}
              className="mt-5 w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 transition-all active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-semibold">{isFr ? "Déconnexion" : "Sign out"}</span>
            </button>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};
