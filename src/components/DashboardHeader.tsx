import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { StarlinkoLogo } from "./StarlinkoLogo";
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
  Coins,
  Bell,
  FileText,
  Search
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

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Avis", href: "/reviews", icon: Star },
  { label: "Établissements", href: "/businesses", icon: Building2 },
  { label: "SEO Auto", href: "/seo-auto-post", icon: FileText },
  { label: "AEO Rank", href: "/aeo-rank", icon: Search },
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
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex items-center justify-between h-16">
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Credits display */}
            {profile && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full border border-accent/20">
                <Coins className="w-4 h-4 text-accent" />
                <span className="text-sm font-semibold text-foreground">{profile.credits}</span>
                <span className="text-xs text-muted-foreground">crédits</span>
              </div>
            )}

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-popover">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                  <span className="font-semibold text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllAsRead}>
                      Tout marquer lu
                    </Button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Aucune notification
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                          !notification.read ? "bg-primary/5" : ""
                        }`}
                        onClick={() => {
                          markAsRead(notification.id);
                          if (notification.review_id) {
                            navigate("/reviews");
                          }
                        }}
                      >
                        <span className="font-medium text-sm">{notification.title}</span>
                        <span className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </span>
                        <span className="text-xs text-muted-foreground/60">
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

            {/* Settings & Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover">
                <div className="px-3 py-2">
                  <p className="font-medium text-sm truncate">{profile?.full_name || "Utilisateur"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  {profile?.plan_name && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {profile.plan_name}
                    </Badge>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/ai-settings" className="flex items-center gap-2 cursor-pointer">
                    <Sparkles className="w-4 h-4" />
                    Paramètres IA
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="w-4 h-4" />
                    Paramètres
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-card border-t border-border py-4 animate-fade-in">
            {/* Mobile credits */}
            {profile && (
              <div className="flex items-center gap-2 px-4 py-3 mb-2 bg-accent/10 mx-4 rounded-lg">
                <Coins className="w-5 h-5 text-accent" />
                <span className="font-semibold">{profile.credits}</span>
                <span className="text-sm text-muted-foreground">crédits disponibles</span>
              </div>
            )}
            
            <div className="flex flex-col gap-1 px-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
