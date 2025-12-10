import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Users,
  Bell,
  Sparkles,
  ChevronRight
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
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    { title: "Avis totaux", value: 156, change: "+12%", icon: Star, trend: "up" },
    { title: "Note moyenne", value: "4.7", change: "+0.2", icon: TrendingUp, trend: "up" },
    { title: "Réponses IA", value: 89, change: "+8", icon: MessageSquare, trend: "up" },
    { title: "Établissements", value: 3, change: "0", icon: Building2, trend: "neutral" },
  ];

  const navItems = [
    { label: "Tableau de bord", icon: LayoutDashboard, href: "/dashboard", active: true },
    { label: "Avis Google", icon: Star, href: "/reviews" },
    { label: "Établissements", icon: Building2, href: "/businesses" },
    { label: "Paramètres IA", icon: Sparkles, href: "/ai-settings" },
    { label: "Paramètres", icon: Settings, href: "/settings" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 bg-card border-r border-border">
        <div className="p-6 border-b border-border">
          <StarlinkoLogo showBadge={false} />
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                item.active
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </a>
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

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-card shadow-xl animate-slide-in">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <StarlinkoLogo showBadge={false} />
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-6 h-6 text-muted-foreground" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    item.active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </a>
              ))}
            </nav>
            <div className="p-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground"
                onClick={handleSignOut}
              >
                <LogOut className="w-5 h-5 mr-3" />
                Déconnexion
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-muted rounded-lg"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
                <p className="text-sm text-muted-foreground">
                  Bienvenue, {profile?.full_name || user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </Button>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-8">
          {/* Trial banner */}
          {profile?.subscription_status === "trial" && (
            <div className="gradient-hero rounded-2xl p-6 text-card">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Essai gratuit</h3>
                  <p className="text-card/80">
                    Il vous reste 14 jours d'essai gratuit. Profitez de toutes les fonctionnalités !
                  </p>
                </div>
                <Button variant="hero" size="lg">
                  Passer à la version Pro
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div
                key={stat.title}
                className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span
                    className={`text-sm font-medium px-2 py-1 rounded-full ${
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
                <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
                <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
              </div>
            ))}
          </div>

          {/* Recent reviews */}
          <div className="bg-card rounded-2xl border border-border shadow-sm">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">Avis récents</h2>
              <Button variant="ghost" size="sm">
                Voir tous
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="p-6">
              <div className="text-center py-12 text-muted-foreground">
                <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Aucun avis pour le moment</p>
                <p className="text-sm mb-4">
                  Connectez votre compte Google My Business pour commencer à gérer vos avis.
                </p>
                <Button variant="default">
                  Connecter Google My Business
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
