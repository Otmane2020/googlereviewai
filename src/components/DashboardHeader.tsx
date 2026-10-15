import { useState, useEffect } from "react";
import { useNavigate, Link } from "@/lib/router-compat";
import { Bell, Plus, LogOut, UserRound, Menu, Settings, CreditCard, Building2 } from "lucide-react";
import { RankiLogo } from "./StarlinkoLogo";
import { BrandSparkle } from "@/components/BrandSparkle";
import { Button } from "./ui/button";
import { UpgradeDialog } from "./UpgradeDialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/hooks/useNotifications";
import { useTranslation } from "react-i18next";

interface UserProfile {
  credits: number;
  plan_name: string | null;
  full_name: string | null;
  email?: string | null;
}

export const DashboardHeader = ({ className }: { className?: string } = {}) => {
  const { user, signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const isFr = !i18n.language?.toLowerCase().startsWith("en");
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) { setProfile(null); return; }
    void supabase.from("profiles").select("credits,plan_name,full_name,email").eq("id", user.id)
      .maybeSingle().then(({ data }) => { if (data) setProfile(data); });
    const channel = supabase.channel(`profile-header-${user.id}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload) => setProfile(prev => prev ? { ...prev, ...(payload.new as UserProfile) } : prev))
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user?.id]);

  const navigateAndClose = (url: string) => {
    setMenuOpen(false);
    navigate(url);
  };

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    navigate("/");
  };

  return (
    <header className={`sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/60 ${className || ""}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex h-14 sm:h-16 items-center gap-2 justify-between min-w-0">
          <Link to="/dashboard" className="flex items-center min-w-0 shrink-0 md:hidden" aria-label="ReviewAI home">
            <RankiLogo compactOnMobile className="gap-1.5 text-foreground" />
          </Link>
          <div className="flex-1 min-w-0" />
          <button type="button" onClick={() => setUpgradeDialogOpen(true)}
            className="inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-xl bg-primary/10 px-2.5 sm:px-3 text-primary font-semibold shrink-0 hover:bg-primary/15"
            aria-label={isFr ? `${profile?.credits ?? 0} crédits, gérer le solde` : `${profile?.credits ?? 0} credits, manage balance`}>
            <BrandSparkle className="h-4 w-4 shrink-0" />
            <span className="text-sm tabular-nums">{profile?.credits ?? 0}</span>
            <span className="hidden min-[375px]:inline text-[11px] font-normal">{isFr ? "crédits" : "credits"}</span>
            <Plus className="h-3 w-3 opacity-70 hidden sm:block" />
          </button>

          <Button type="button" variant="ghost" size="icon"
            className="relative h-10 w-10 shrink-0 rounded-xl" onClick={() => navigate("/notifications")}
            aria-label={isFr ? "Notifications" : "Notifications"}>
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 rounded-full bg-destructive text-destructive-foreground px-1 min-w-[19px] h-[19px] flex items-center justify-center font-bold text-[10px]">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button type="button" variant="ghost" size="icon"
                aria-label={isFr ? "Menu et compte" : "Menu and account"}
                className="h-10 w-10 shrink-0 rounded-xl">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(340px,88vw)] p-5 overflow-y-auto">
              <SheetHeader className="text-left">
                <SheetTitle>{isFr ? "Menu et compte" : "Menu & account"}</SheetTitle>
              </SheetHeader>
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-muted/60 px-4 py-3 min-w-0">
                  <p className="text-sm font-semibold break-words">{profile?.full_name || user?.email || t("common.user")}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">{profile?.plan_name || "Free"} · {profile?.credits ?? 0} {isFr ? "crédits" : "credits"}</p>
                </div>
                <div className="flex justify-between items-center gap-2 rounded-xl border px-3 py-2.5">
                  <span className="text-sm font-medium">{isFr ? "Langue" : "Language"}</span>
                  <LanguageSwitcher variant="dropdown" />
                </div>
                {[
                  { icon: Building2, label: isFr ? "Établissements" : "Businesses", href: "/businesses" },
                  { icon: Settings, label: isFr ? "Paramètres et établissements gérés" : "Settings & managed locations", href: "/settings" },
                  { icon: UserRound, label: isFr ? "Gestion du compte" : "Account management", href: "/settings" },
                ].map(item => (
                  <button type="button" key={item.label} onClick={() => navigateAndClose(item.href)}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-left hover:bg-muted">
                    <item.icon className="h-4 w-4 text-primary shrink-0" />{item.label}
                  </button>
                ))}
                <button type="button" onClick={() => { setMenuOpen(false); setUpgradeDialogOpen(true); }}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-left hover:bg-muted">
                  <CreditCard className="h-4 w-4 text-primary" />{isFr ? "Abonnement et crédits" : "Plan and credits"}
                </button>
                <button type="button" onClick={() => void handleSignOut()}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-left text-destructive hover:bg-destructive/5">
                  <LogOut className="h-4 w-4" />{t("common.signOut")}
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <UpgradeDialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen} currentPlan={profile?.plan_name || undefined} />
    </header>
  );
};
