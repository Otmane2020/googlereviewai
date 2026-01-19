import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { 
  User,
  Mail,
  CreditCard,
  Shield,
  Bell,
  Save,
  Loader2,
  Crown,
  Check,
  Settings as SettingsIcon,
  Link2,
  Unlink,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  subscription_status: string;
  plan_id: string;
  plan_name: string | null;
  credits: number;
  max_businesses: number;
  trial_end: string | null;
}

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "2,99€",
    features: ["1 établissement", "10 crédits/mois", "Réponses IA"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "29,99€",
    features: ["2 établissements", "100 crédits/mois", "IA premium"],
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    price: "99€",
    features: ["Illimité", "400 crédits/mois", "IA premium + SEO"],
  },
];

const SettingsPage = () => {
  const { user, session, signOut, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

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
        setFullName(data.full_name || "");
      }
      
      // Check if Google is connected by looking at active businesses
      const { data: businesses } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1);
      
      const hasBusinesses = businesses && businesses.length > 0;
      const hasGoogleProvider = user.app_metadata?.provider === "google" || 
        user.app_metadata?.providers?.includes("google") ||
        !!session?.provider_token;
      
      setIsGoogleConnected(hasBusinesses || hasGoogleProvider);
      
      setLoading(false);
    };

    fetchProfile();
  }, [user, session, navigate]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le profil.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées.",
      });
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleConnectGoogle = async () => {
    setConnectingGoogle(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de connecter Google",
        variant: "destructive",
      });
    }
    setConnectingGoogle(false);
  };

  const handleDisconnectGoogle = async () => {
    // Note: Supabase doesn't have a direct "unlink provider" method
    // We'll clear the businesses and show a message
    try {
      // Deactivate all businesses (soft delete)
      await supabase
        .from("businesses")
        .update({ is_active: false })
        .eq("user_id", user!.id);
      
      toast({
        title: "Google déconnecté",
        description: "Vos établissements ont été désactivés. Reconnectez Google pour les réactiver.",
      });
      
      setIsGoogleConnected(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de déconnecter Google",
        variant: "destructive",
      });
    }
  };

  const handleManageSubscription = async () => {
    setOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: { returnUrl: window.location.href },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (error: any) {
      console.error("Portal error:", error);
      toast({
        title: "Erreur",
        description: error.message === "No customer found" 
          ? "Aucun abonnement trouvé. Souscrivez d'abord à un plan."
          : "Impossible d'ouvrir le portail de gestion",
        variant: "destructive",
      });
    } finally {
      setOpeningPortal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardHeader />

      {/* Page Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
              <p className="text-sm text-muted-foreground">
                Gérez votre compte et vos préférences
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Profile section */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Profil</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Votre nom"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="pl-10 bg-muted"
                />
              </div>
            </div>

            <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Sauvegarder
            </Button>
          </div>
        </div>

        {/* Subscription section */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Abonnement</h2>
          </div>

          <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">
                  Plan {profile?.plan_name?.charAt(0).toUpperCase()}{profile?.plan_name?.slice(1) || "Gratuit"}
                </span>
                {profile?.subscription_status === "trial" && (
                  <Badge variant="secondary">Essai gratuit</Badge>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleManageSubscription}
                disabled={openingPortal}
                className="gap-2"
              >
                {openingPortal ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                Gérer l'abonnement
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Crédits disponibles</p>
                <p className="text-xl font-bold text-foreground">{profile?.credits ?? 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Établissements max</p>
                <p className="text-xl font-bold text-foreground">{profile?.max_businesses ?? 1}</p>
              </div>
            </div>
            {profile?.trial_end && profile?.subscription_status === "trial" && (
              <p className="text-xs text-muted-foreground mt-3">
                Essai gratuit jusqu'au {new Date(profile.trial_end).toLocaleDateString("fr-FR")}
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`p-4 rounded-xl border transition-all ${
                  profile?.plan_name?.toLowerCase() === plan.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                } ${plan.popular ? "ring-2 ring-primary" : ""}`}
              >
                {plan.popular && (
                  <span className="text-xs font-medium text-primary mb-2 block">
                    Plus populaire
                  </span>
                )}
                <h3 className="font-semibold text-foreground">{plan.name}</h3>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {plan.price}
                  <span className="text-sm font-normal text-muted-foreground">/mois</span>
                </p>
                <ul className="mt-3 space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-secondary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={profile?.plan_name?.toLowerCase() === plan.id ? "secondary" : "default"}
                  className="w-full mt-4"
                  disabled={profile?.plan_name?.toLowerCase() === plan.id}
                  onClick={() => setShowUpgradeDialog(true)}
                >
                  {profile?.plan_name?.toLowerCase() === plan.id ? "Plan actuel" : (
                    <>
                      <Sparkles className="w-4 h-4 mr-1" />
                      Upgrade
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Integrations section */}
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 p-4 border-b border-border/30">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Link2 className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground text-sm">Intégrations</h2>
          </div>
          
          {/* Google My Business */}
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-border shadow-sm flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-foreground text-sm">Google My Business</p>
                  {isGoogleConnected && (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] px-2 py-0.5">
                      <Check className="w-2.5 h-2.5 mr-0.5" />
                      Connecté
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sync avis & établissements
                </p>
              </div>
            </div>
            
            {/* Action Buttons - Full width on mobile */}
            <div className="flex flex-col sm:flex-row gap-2">
              {isGoogleConnected ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDisconnectGoogle}
                  className="w-full sm:w-auto text-destructive hover:text-destructive rounded-xl h-10"
                >
                  <Unlink className="w-4 h-4 mr-2" />
                  Déconnecter Google
                </Button>
              ) : (
                <Button 
                  size="sm"
                  onClick={handleConnectGoogle}
                  disabled={connectingGoogle}
                  className="w-full sm:w-auto rounded-xl h-10 shadow-md shadow-primary/20"
                >
                  {connectingGoogle ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  Connecter Google
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Security section */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Sécurité</h2>
          </div>
          
          <div className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              Changer le mot de passe
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleSignOut}
            >
              Se déconnecter
            </Button>
          </div>
        </div>

        {/* Notifications section */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Notifications</h2>
          </div>
          
          <p className="text-muted-foreground text-sm">
            Les paramètres de notifications seront bientôt disponibles.
          </p>
        </div>
      </main>

      <MobileBottomNav />
      
      <UpgradeDialog 
        open={showUpgradeDialog} 
        onOpenChange={setShowUpgradeDialog}
        currentPlan={profile?.plan_name || undefined}
      />
    </div>
  );
};

export default SettingsPage;
