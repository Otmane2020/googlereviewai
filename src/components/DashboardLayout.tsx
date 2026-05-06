import { ReactNode, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
import {
  LayoutDashboard,
  Star,
  Building2,
  Sparkles,
  Search,
  MapPin,
  Bell,
  Settings,
  CreditCard,
  LogOut,
  HelpCircle,
  MessageCircleQuestion,
  ListChecks,
} from "lucide-react";
import { RankiLogo } from "@/components/StarlinkoLogo";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useTranslation } from "react-i18next";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

const useNavItems = () => {
  const { t } = useTranslation();
  const mainNav = [
    { label: t("sidebar.overview"), href: "/dashboard", icon: LayoutDashboard },
    { label: "Avis Google", href: "/reviews", icon: Star },
  ];
  const visibilityNav = [
    { label: "GEO Rank AI", href: "/aeo-rank", icon: Sparkles, badge: "AI" },
    { label: "SEO Autopilot", href: "/seo-autopost", icon: Search },
    
    { label: "Q&A", href: "/gmb-post", icon: MessageCircleQuestion },
    { label: "Planning", href: "/calendar", icon: ListChecks },
  ];
  const businessNav = [
    { label: "Établissements", href: "/businesses", icon: Building2 },
  ];
  const accountNav = [
    { label: t("sidebar.aiSettings"), href: "/ai-settings", icon: Sparkles },
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

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, email, credits, plan_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => data && setProfile(data));
  }, [user]);

  const renderItem = (item: { label: string; href: string; icon: typeof LayoutDashboard; badge?: string }) => (
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
          {!collapsed && <SidebarGroupLabel>Espace de travail</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{mainNav.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Visibilité Boost</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{visibilityNav.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Mon entreprise</SidebarGroupLabel>}
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
                onClick={() => navigate("/choose-plan")}
              >
                <Sparkles className="w-3 h-3 mr-1" /> {t("sidebar.upgrade")}
              </Button>
            </div>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={t("sidebar.helpSupport")}>
              <a href="mailto:support@ranki.ai" className="flex items-center gap-3">
                <HelpCircle className="h-4 w-4" />
                {!collapsed && <span>{t("sidebar.helpSupport")}</span>}
              </a>
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
    </Sidebar>
  );
};

export const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop sidebar — always visible (fixed), hidden on mobile (mobile uses bottom nav) */}
        <div className="hidden md:block">
          <RankiSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Floating sidebar trigger — always reachable on desktop, even when sidebar is collapsed */}
          <div className="hidden md:flex sticky top-2 z-40 px-3 -mb-2">
            <SidebarTrigger className="text-foreground bg-card/90 backdrop-blur border border-border rounded-lg shadow-sm" />
            {title && <h1 className="ml-3 self-center text-sm font-semibold text-foreground">{title}</h1>}
          </div>

          <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>

          {/* Mobile bottom nav (preserved) */}
          <MobileBottomNav />
        </div>
      </div>
    </SidebarProvider>
  );
};
