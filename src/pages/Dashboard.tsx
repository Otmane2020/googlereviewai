import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { StarlinkoLogo } from "@/components/StarlinkoLogo";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Star, 
  Building2, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  MessageSquare,
  TrendingUp,
  Bell,
  Sparkles,
  ChevronRight,
  Home,
  User
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  subscription_status: string;
  plan_id: string;
  trial_end: string | null;
  onboarding_completed: boolean;
}

interface StatsCard {
  title: string;
  value: string | number;
  change: string;
  icon: React.ElementType;
  trend: "up" | "down" | "neutral";
  color: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
      } else if (data) {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Déconnexion réussie",
      description: "À bientôt !",
    });
    navigate("/");
  };

  const stats: StatsCard[] = [
    { title: "Avis totaux", value: 156, change: "+12%", icon: Star, trend: "up", color: "bg-amber-500" },
    { title: "Note moyenne", value: "4.7", change: "+0.2", icon: TrendingUp, trend: "up", color: "bg-emerald-500" },
    { title: "Réponses IA", value: 89, change: "+8", icon: MessageSquare, trend: "up", color: "bg-blue-500" },
    { title: "Établissements", value: 3, change: "0", icon: Building2, trend: "neutral", color: "bg-violet-500" },
  ];

  const navItems = [
    { label: "Accueil", icon: Home, href: "/dashboard" },
    { label: "Avis", icon: Star, href: "/reviews" },
    { label: "Établissements", icon: Building2, href: "/businesses" },
    { label: "IA", icon: Sparkles, href: "/ai-settings" },
    { label: "Paramètres", icon: Settings, href: "/settings" },
  ];

  const isActive = (href: string) => location.pathname === href;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col pb-20 lg:pb-0">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          <StarlinkoLogo showBadge={false} />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setMobileNavOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Side Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" 
            onClick={() => setMobileNavOpen(false)} 
          />
          <aside className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-card shadow-2xl animate-slide-in-right">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground truncate max-w-[180px]">
                    {profile?.full_name || "Utilisateur"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                    {user?.email}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileNavOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive(item.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs font-medium rounded-full">
                    {profile?.plan_id?.toUpperCase() || "STARTER"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {profile?.subscription_status === "trial" ? "Essai gratuit" : "Abonnement actif"}
                </p>
              </div>
              
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleSignOut}
              >
                <LogOut className="w-5 h-5 mr-3" />
                Déconnexion
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-card border-r border-border">
        <div className="p-6 border-b border-border">
          <StarlinkoLogo showBadge={false} />
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive(item.href)
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-secondary text-secondary-foreground text-xs font-medium rounded-full">
                {profile?.plan_id?.toUpperCase() || "STARTER"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {profile?.subscription_status === "trial" ? "Essai gratuit en cours" : "Abonnement actif"}
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Gérer l'abonnement
            </Button>
          </div>
          
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-64">
        {/* Desktop Header */}
        <header className="hidden lg:flex sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border px-6 py-4 items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
            <p className="text-sm text-muted-foreground">
              Bienvenue, {profile?.full_name || user?.email}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </Button>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-6">
          {/* Mobile welcome */}
          <div className="lg:hidden">
            <h1 className="text-xl font-bold text-foreground">
              Bonjour, {profile?.full_name?.split(" ")[0] || "👋"}
            </h1>
            <p className="text-sm text-muted-foreground">Voici vos statistiques du jour</p>
          </div>

          {/* Trial banner */}
          {profile?.subscription_status === "trial" && (
            <div className="gradient-hero rounded-2xl p-4 lg:p-6 text-card">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Essai gratuit</h3>
                  <p className="text-card/80 text-sm lg:text-base">
                    14 jours restants. Profitez de toutes les fonctionnalités !
                  </p>
                </div>
                <Button variant="hero" size="lg" className="w-full lg:w-auto">
                  Passer à Pro
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Stats grid - 2 columns on mobile, 4 on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
            {stats.map((stat) => (
              <div
                key={stat.title}
                className="bg-card rounded-2xl p-4 lg:p-6 border border-border shadow-sm"
              >
                <div className="flex items-center justify-between mb-3 lg:mb-4">
                  <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <span
                    className={`text-xs lg:text-sm font-medium px-2 py-1 rounded-full ${
                      stat.trend === "up"
                        ? "bg-secondary/10 text-secondary"
                        : stat.trend === "down"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-foreground">{stat.value}</h3>
                <p className="text-xs lg:text-sm text-muted-foreground mt-1">{stat.title}</p>
              </div>
            ))}
          </div>

          {/* Quick actions - horizontal scroll on mobile */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Actions rapides</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-3 lg:overflow-visible">
              <Link
                to="/reviews"
                className="flex-shrink-0 w-[280px] lg:w-auto bg-card rounded-2xl p-5 border border-border hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-amber-500" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Voir les avis</h3>
                <p className="text-sm text-muted-foreground">Consultez et répondez à vos avis</p>
              </Link>
              
              <Link
                to="/ai-settings"
                className="flex-shrink-0 w-[280px] lg:w-auto bg-card rounded-2xl p-5 border border-border hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Configurer l'IA</h3>
                <p className="text-sm text-muted-foreground">Personnalisez vos réponses automatiques</p>
              </Link>
              
              <Link
                to="/businesses"
                className="flex-shrink-0 w-[280px] lg:w-auto bg-card rounded-2xl p-5 border border-border hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6 text-violet-500" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Ajouter un établissement</h3>
                <p className="text-sm text-muted-foreground">Connectez un nouveau business</p>
              </Link>
            </div>
          </div>

          {/* Recent reviews */}
          <div className="bg-card rounded-2xl border border-border shadow-sm">
            <div className="p-4 lg:p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Avis récents</h2>
              <Link to="/reviews">
                <Button variant="ghost" size="sm">
                  Voir tous
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="p-6 lg:p-8">
              <div className="text-center py-8">
                <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-lg font-medium text-foreground mb-2">Aucun avis pour le moment</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Connectez votre compte Google My Business
                </p>
                <Button variant="default">
                  Connecter Google
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2 safe-area-inset-bottom">
        <div className="flex items-center justify-around">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                isActive(item.href)
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive(item.href) ? "text-primary" : ""}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Dashboard;
