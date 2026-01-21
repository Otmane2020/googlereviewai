import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { StarlinkoLogo } from "./StarlinkoLogo";
import { UpgradeDialog } from "./UpgradeDialog";
import { Button } from "./ui/button";
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Star, 
  Building2, 
  Settings, 
  Sparkles,
  LogOut,
  Bell,
  FileText,
  Search,
  Plus,
  CreditCard,
  ChevronRight,
  Target
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/hooks/useNotifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Avis", href: "/reviews", icon: Star },
  { label: "Établissements", href: "/businesses", icon: Building2 },
  { label: "SEO Auto", href: "/seo-autopost", icon: FileText },
  { label: "AEO Rank", href: "/aeo-rank", icon: Search },
  { label: "Maps Rank", href: "/maps-rank", icon: Target },
];

const menuItems = [
  { label: "Paramètres IA", href: "/ai-settings", icon: Sparkles },
  { label: "Paramètres", href: "/settings", icon: Settings },
];

interface UserProfile {
  credits: number;
  plan_name: string | null;
  full_name: string | null;
}

export const DashboardHeader = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("credits, plan_name, full_name")
        .eq("id", user.id)
        .single();
      
      if (data) {
        setProfile(data);
      }
    };

    fetchProfile();

    // Subscribe to profile changes
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
          setProfile((prev) => prev ? { ...prev, ...payload.new } : null);
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
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/dashboard" className="flex-shrink-0">
            <StarlinkoLogo showBadge={false} />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right side actions - Mobile optimized */}
          <div className="flex items-center gap-2">
            {/* Notifications - Navigate to full page */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative h-10 w-10 rounded-xl"
              onClick={() => navigate("/notifications")}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>

            {/* Hamburger Menu - Contains credits, profile, settings */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] p-0 bg-background/95 backdrop-blur-xl flex flex-col">
                <SheetHeader className="p-3 border-b border-border/50 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25">
                      <span className="text-base font-bold text-primary-foreground">
                        {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <SheetTitle className="text-left text-sm truncate">
                        {profile?.full_name || "Utilisateur"}
                      </SheetTitle>
                      <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
                </SheetHeader>

                {/* Credits Card - Compact */}
                <div className="p-3 border-b border-border/50">
                  <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl p-3 border border-accent/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-accent fill-accent" />
                        <span className="text-xs font-medium text-foreground">Crédits</span>
                      </div>
                      {profile?.plan_name && (
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                          {profile.plan_name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-foreground">
                        {profile?.credits || 0}
                      </span>
                      <Button 
                        size="sm" 
                        className="h-8 rounded-lg gap-1.5 text-xs shadow-md"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setUpgradeDialogOpen(true);
                        }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Upgrade
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Navigation - Compact */}
                <div className="px-3 py-2 space-y-0.5">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 px-2">
                    Navigation
                  </p>
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-md" 
                            : "text-foreground hover:bg-muted"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="flex-1">{item.label}</span>
                        <ChevronRight className={`w-3.5 h-3.5 ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`} />
                      </Link>
                    );
                  })}
                </div>

                {/* Settings - Compact */}
                <div className="px-3 py-2 space-y-0.5 border-t border-border/50">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5 px-2">
                    Paramètres
                  </p>
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-all"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="flex-1">{item.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </Link>
                    );
                  })}
                </div>

                {/* Sign Out */}
                <div className="p-3 border-t border-border/50">
                  <Button
                    variant="outline" 
                    className="w-full rounded-lg h-10 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnexion
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>

      <UpgradeDialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen} />
    </header>
  );
};
