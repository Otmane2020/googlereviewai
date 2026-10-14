import { ReactNode, useEffect, useState } from "react";
import { NavLink, useNavigate } from "@/lib/router-compat";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Star, Building2, Search, MapPin, Bell, Settings, CreditCard, LogOut, HelpCircle, MessageCircleQuestion, ListChecks, ShoppingBag, Package, Loader2, RefreshCw } from "lucide-react";
import { RankiLogo } from "@/components/StarlinkoLogo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { DashboardHeader } from "@/components/DashboardHeader";
import { SupportDialog } from "@/components/SupportDialog";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { BrandSparkle } from "@/components/BrandSparkle";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

const useNavItems = () => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith("en");
  const mainNav = [
    { label: t("sidebar.overview"), href: "/dashboard", icon: LayoutDashboard },
    { label: t("sidebar.googleReviews"), href: "/reviews", icon: Star },
    { label: t("sidebar.googlePost"), href: "/gmb-post", icon: MessageCircleQuestion },
  ];
  const visibilityNav = [
    { label: t("sidebar.geoRankAi"), href: "/aeo-rank", icon: BrandSparkle, badge: "AI" },
    { label: t("sidebar.seoAutopilot"), href: "/seo-autopost", icon: Search },
    { label: t("sidebar.planning"), href: "/calendar", icon: ListChecks },
  ];
  const businessNav = [
    { label: t("sidebar.locations"), href: "/businesses", icon: Building2 },
    { label: isEn ? "Shop" : "Boutique", href: "/boutique", icon: ShoppingBag },
    { label: isEn ? "My orders" : "Mes commandes", href: "/commandes", icon: Package },
  ];
  const accountNav = [
    { label: t("sidebar.aiSettings"), href: "/ai-settings", icon: BrandSparkle },
    { label: t("sidebar.notifications"), href: "/notifications", icon: Bell },
    { label: t("sidebar.settings"), href: "/settings", icon: Settings },
  ];
  return { mainNav, visibilityNav, businessNav, accountNav };
};

const RankiSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { mainNav, visibilityNav, businessNav, accountNav } = useNavItems();
  const [profile, setProfile] = useState<{ full_name: string | null; email: string; credits: number; plan_name: string | null } | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, email, credits, plan_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => data && setProfile(data));
  }, [user]);

  const renderItem = (item: { label: string; href: string; icon: React.ElementType; badge?: string }) => (
    <SidebarMenuItem key={item.href}>
      <SidebarMenuButton asChild tooltip={item.label}>
        <NavLink
          to={item.href}
          end={item.href === "/dashboard"}
          className={({ isActive }) =>
            `flex items-center gap-3 ${
              isActive
                ? "bg-primary/10 text-primary font-semibold"
                : "text-foreground/80 hover:bg-muted hover:text-foreground"
            }`
          }
        >
          <item.icon className="h-4 w-4 flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-primary text-primary-foreground">
                  {item.badge}
                </span>
              )}
            </>
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-between px-1 py-2">
          {!collapsed ? (
            <RankiLogo className="text-sidebar-foreground" />
          ) : (
            <RankiLogo className="text-sidebar-foreground scale-75 -ml-1" />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>{t("sidebar.workspace")}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{mainNav.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>{t("sidebar.visibilityBoost")}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{visibilityNav.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>{t("sidebar.myCompany")}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{businessNav.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>{t("sidebar.account")}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{accountNav.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && (
          <div className="px-3 mt-2">
            <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 p-3">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-foreground">{profile?.credits ?? 0} {t("sidebar.credits")}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mb-2">
                {profile?.plan_name ? `${t("sidebar.plan")}: ${profile.plan_name}` : t("sidebar.freePlan")}
              </p>
              <Button
                size="sm"
                className="w-full h-7 text-xs"
                onClick={() => setUpgradeOpen(true)}
              >
                <BrandSparkle className="w-3 h-3 mr-1" /> {t("sidebar.upgrade")}
              </Button>
            </div>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => setSupportOpen(true)} tooltip={t("sidebar.helpSupport")}>
              <HelpCircle className="h-4 w-4" />
              {!collapsed && <span>{t("sidebar.helpSupport")}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} tooltip={t("sidebar.signOut")}>
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>{t("sidebar.signOut")}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && profile && (
          <div className="px-2 pt-2 pb-1 text-[11px] text-muted-foreground truncate">
            {profile.full_name || profile.email}
          </div>
        )}
      </SidebarFooter>
      <SupportDialog userEmail={profile?.email} hideTrigger open={supportOpen} onOpenChange={setSupportOpen} />
      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} currentPlan={profile?.plan_name ?? undefined} />
    </Sidebar>
  );
};

type CreditAccess = {
  userId: string;
  status: "loading" | "ready" | "error";
  credits: number;
  agencyCredits: number;
  businessCredits: number;
  planName: string | null;
  subscriptionStatus: string | null;
};

export const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const { user, signOut } = useAuth();
  const { i18n } = useTranslation();
  const isEN = i18n.language?.startsWith("en");
  const [retryKey, setRetryKey] = useState(0);
  const [access, setAccess] = useState<CreditAccess | null>(null);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    setAccess({
      userId, status: "loading", credits: 0, agencyCredits: 0,
      businessCredits: 0, planName: null, subscriptionStatus: null,
    });

    const refreshBalance = async () => {
      const [profileResult, businessResult] = await Promise.all([
        supabase.from("profiles")
          .select("credits, agency_total_credits, plan_name, subscription_status")
          .eq("id", userId).maybeSingle(),
        supabase.from("businesses")
          .select("credits")
          .eq("user_id", userId)
          .eq("is_active", true),
      ]);
      if (cancelled) return;

      if (profileResult.error || !profileResult.data || businessResult.error) {
        setAccess((prev) => ({
          userId, status: "error", credits: prev?.userId === userId ? prev.credits : 0,
          agencyCredits: prev?.userId === userId ? prev.agencyCredits : 0,
          businessCredits: prev?.userId === userId ? prev.businessCredits : 0,
          planName: prev?.userId === userId ? prev.planName : null,
          subscriptionStatus: prev?.userId === userId ? prev.subscriptionStatus : null,
        }));
        return;
      }

      setAccess({
        userId,
        status: "ready",
        credits: Math.max(0, profileResult.data.credits ?? 0),
        agencyCredits: Math.max(0, profileResult.data.agency_total_credits ?? 0),
        businessCredits: (businessResult.data ?? []).reduce(
          (total, business) => total + Math.max(0, business.credits ?? 0), 0
        ),
        planName: profileResult.data.plan_name,
        subscriptionStatus: profileResult.data.subscription_status,
      });
    };

    void refreshBalance();

    // React as soon as Stripe/webhooks or credits usage changes.
    const profileChannel = supabase.channel(`dashboard-credit-profile-${userId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}`,
      }, () => { void refreshBalance(); }).subscribe();
    const businessChannel = supabase.channel(`dashboard-credit-businesses-${userId}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "businesses", filter: `user_id=eq.${userId}`,
      }, () => { void refreshBalance(); }).subscribe();

    const onFocus = () => { if (document.visibilityState === "visible") void refreshBalance(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    // Poll as a fallback in case Realtime is unavailable or Stripe webhook is delayed.
    const interval = window.setInterval(() => { void refreshBalance(); }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      void supabase.removeChannel(profileChannel);
      void supabase.removeChannel(businessChannel);
    };
  }, [userId, retryKey]);

  const checking = !!userId && (!access || access.userId !== userId || access.status === "loading");
  const failed = !!userId && access?.userId === userId && access.status === "error";

  // Paid Pro / Business plans include unlimited AI replies: a zero numeric balance
  // must not lock out a customer whose unlimited subscription is still active.
  const paidUnlimited = access?.status === "ready"
    && ["active", "trial", "trialing"].includes((access.subscriptionStatus ?? "").toLowerCase())
    && /(^|[_\s-])(pro|business|agence|agency)([_\s-]|$)/i.test(access.planName ?? "");
  const availableCredits = (access?.credits ?? 0)
    + (access?.agencyCredits ?? 0) + (access?.businessCredits ?? 0);
  const exhausted = !!userId && access?.userId === userId
    && access.status === "ready" && availableCredits <= 0 && !paidUnlimited;

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" aria-live="polite">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    );
  }

  if (failed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center space-y-4">
          <h2 className="text-lg font-semibold">
            {isEN ? "Unable to verify your credit balance" : "Impossible de vérifier votre solde de crédits"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEN ? "Please retry to access your dashboard." : "Réessayez pour accéder à votre tableau de bord."}
          </p>
          <Button onClick={() => setRetryKey((n) => n + 1)} className="gap-2">
            <RefreshCw className="w-4 h-4" /> {isEN ? "Retry" : "Réessayer"}
          </Button>
          <Button variant="ghost" onClick={() => { void signOut(); }}>
            {isEN ? "Sign out" : "Se déconnecter"}
          </Button>
        </div>
      </div>
    );
  }

  if (exhausted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
        <RankiLogo className="text-foreground mb-5" />
        <p className="max-w-sm text-center text-muted-foreground text-sm">
          {isEN
            ? "Your balance is empty. Top up or upgrade to access your dashboard."
            : "Votre solde est épuisé. Rechargez vos crédits ou passez à un abonnement pour accéder au tableau de bord."}
        </p>
        <UpgradeDialog
          open={true}
          onOpenChange={() => {}}
          currentPlan={access?.planName ?? undefined}
          exhausted
          locked
          onRetry={() => setRetryKey((n) => n + 1)}
          onSignOut={() => { void signOut(); }}
        />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop sidebar — always visible (fixed), hidden on mobile (mobile uses bottom nav) */}
        <div className="hidden md:block">
          <RankiSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Sticky top bar — visible on every dashboard page (language, notifications, credits) */}
          <DashboardHeader />
          {title && (
            <div className="hidden md:flex sticky top-14 z-30 px-4 py-2 bg-background/80 backdrop-blur border-b border-border/40 items-center gap-3">
              <SidebarTrigger className="text-foreground" />
              <h1 className="text-sm font-semibold text-foreground">{title}</h1>
            </div>
          )}
          {!title && (
            <div className="hidden md:flex sticky top-14 z-30 px-3 py-1 items-center">
              <SidebarTrigger className="text-foreground bg-card/90 backdrop-blur border border-border rounded-lg shadow-xs" />
            </div>
          )}

          <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>

          {/* Mobile bottom nav (preserved) */}
          <MobileBottomNav />
        </div>
      </div>
    </SidebarProvider>
  );
};
