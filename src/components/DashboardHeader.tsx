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
            {/* Notifications - Always visible with counter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-popover/95 backdrop-blur-xl border-border/50">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
                  <span className="font-semibold text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" className="text-xs h-7 text-primary" onClick={markAllAsRead}>
                      Tout lire
                    </Button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">Aucune notification</p>
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className={`flex flex-col items-start gap-1 p-3 cursor-pointer border-b border-border/30 last:border-0 ${
                          !notification.read ? "bg-primary/5" : ""
                        }`}
                        onClick={() => {
                          markAsRead(notification.id);
                          if (notification.type === "pending_reviews" || notification.review_id) {
                            navigate("/reviews");
                          } else if (notification.type === "seo_reminder" || notification.type === "seo_promo") {
                            navigate("/seo-autopost");
                          } else if (notification.type === "aeo_reminder" || notification.type === "aeo_promo") {
                            navigate("/aeo-rank");
                          } else if (notification.type === "ai_tip") {
                            navigate("/ai-settings");
                          }
                        }}
                      >
                        <div className="flex items-center gap-2 w-full">
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          )}
                          <span className="font-medium text-sm flex-1">{notification.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground line-clamp-2 pl-4">
                          {notification.message}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60 pl-4">
                          {new Date(notification.created_at).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Hamburger Menu - Contains credits, profile, settings */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] p-0 bg-background/95 backdrop-blur-xl">
                <SheetHeader className="p-4 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/25">
                      <span className="text-lg font-bold text-primary-foreground">
                        {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <SheetTitle className="text-left text-base truncate">
                        {profile?.full_name || "Utilisateur"}
                      </SheetTitle>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
                </SheetHeader>

                {/* Credits Card */}
                <div className="p-4 border-b border-border/50">
                  <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl p-4 border border-accent/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-accent fill-accent" />
                        <span className="text-sm font-medium text-foreground">Crédits</span>
                      </div>
                      {profile?.plan_name && (
                        <Badge variant="secondary" className="text-[10px]">
                          {profile.plan_name}
                        </Badge>
                      )}
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-3">
                      {profile?.credits || 0}
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full rounded-xl gap-2 shadow-md"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setUpgradeDialogOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      Upgrade
                    </Button>
                  </div>
                </div>

                {/* Navigation */}
                <div className="p-4 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">
                    Navigation
                  </p>
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all ${
                          isActive 
                            ? "bg-primary text-primary-foreground shadow-md" 
                            : "text-foreground hover:bg-muted"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="flex-1">{item.label}</span>
                        <ChevronRight className={`w-4 h-4 ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`} />
                      </Link>
                    );
                  })}
                </div>

                {/* Settings */}
                <div className="p-4 space-y-1 border-t border-border/50">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2">
                    Paramètres
                  </p>
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl font-medium text-foreground hover:bg-muted transition-all"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <span className="flex-1">{item.label}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </Link>
                    );
                  })}
                </div>

                {/* Sign Out */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50 bg-background">
                  <Button 
                    variant="outline" 
                    className="w-full rounded-xl h-11 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
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
