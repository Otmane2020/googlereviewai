import { useState, useEffect } from "react";
import { useNavigate, Link } from "@/lib/router-compat";
import { Bell, Plus } from "lucide-react";
import { RankiLogo } from "./StarlinkoLogo";
import { BrandSparkle } from "@/components/BrandSparkle";
import { Button } from "./ui/button";
import { UpgradeDialog } from "./UpgradeDialog";
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
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const isFr = !i18n.language?.toLowerCase().startsWith("en");
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

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

          {/* On mobile, the bottom navigation has the ONLY hamburger/menu.
              Desktop account navigation is already present in the sidebar. */}
        </div>
      </div>
      <UpgradeDialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen} currentPlan={profile?.plan_name || undefined} />
    </header>
  );
};
