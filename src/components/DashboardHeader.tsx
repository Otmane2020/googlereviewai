import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UpgradeDialog } from "./UpgradeDialog";
import { Button } from "./ui/button";
import { Bell, Plus, LogOut, User as UserIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { RankiLogo } from "./StarlinkoLogo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { BrandSparkle } from "@/components/BrandSparkle";

interface UserProfile {
  credits: number;
  plan_name: string | null;
  full_name: string | null;
  email?: string;
}

export const DashboardHeader = ({ className }: { className?: string } = {}) => {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { unreadCount } = useNotifications();

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("credits, plan_name, full_name, email")
        .eq("id", user.id)
        .single();
      if (data) setProfile(data);
    };

    fetchProfile();

    const channel = supabase
      .channel("profile-credits")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          setProfile((prev) => (prev ? { ...prev, ...(payload.new as UserProfile) } : null));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className={`sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50 ${className ?? ""}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between gap-2 h-14">
          <Link to="/dashboard" className="flex-shrink-0 md:hidden" aria-label="GoogleReviewAI home">
            <RankiLogo className="text-foreground scale-90" />
          </Link>
          <div className="flex-1" />
          {/* Credits pill */}
          <button
            onClick={() => setUpgradeDialogOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 h-9 rounded-xl bg-muted/60 hover:bg-muted transition-colors"
          >
            <BrandSparkle className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {profile?.credits ?? 0} {t("common.credits")}
            </span>
            {profile?.plan_name && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
                {profile.plan_name}
              </Badge>
            )}
            <Plus className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {/* Language switcher */}
          <LanguageSwitcher variant="dropdown" />

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10 rounded-xl"
            onClick={() => navigate("/notifications")}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-sm">
                  <span className="text-xs font-bold text-primary-foreground">
                    {profile?.full_name?.charAt(0).toUpperCase() ||
                      user?.email?.charAt(0).toUpperCase() ||
                      "U"}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-medium truncate">
                    {profile?.full_name || t("common.user")}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <UserIcon className="w-4 h-4 mr-2" /> {t("common.settings")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setUpgradeDialogOpen(true)}>
                <BrandSparkle className="w-4 h-4 mr-2" /> {t("common.upgrade")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" /> {t("common.signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        currentPlan={profile?.plan_name || undefined}
      />
    </header>
  );
};
