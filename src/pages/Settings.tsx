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
import { useGoogleOAuth } from "@/hooks/useGoogleOAuth";
import { useFirebasePush } from "@/hooks/useFirebasePush";
import { 
  User,
  Mail,
  CreditCard,
  Shield,
  Bell,
  BellOff,
  BellRing,
  Save,
  Loader2,
  Crown,
  Check,
  Settings as SettingsIcon,
  Link2,
  Unlink,
  Sparkles,
  RefreshCw
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


const SettingsPage = () => {
  const { user, session, signOut } = useAuth();
  const navigate = useNavigate();
  const { initiateOAuth, checkOAuthStatus, isConnecting } = useGoogleOAuth();
  const { 
    permission: pushPermission, 
    isSupported: pushSupported, 
    isSubscribed: pushSubscribed, 
    isLoading: pushLoading,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush
  } = useFirebasePush();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [hasRefreshToken, setHasRefreshToken] = useState(false);
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
      
      // Check if Google is connected by looking at active businesses AND refresh token
      const [businessesResult, oauthStatus] = await Promise.all([
        supabase
          .from("businesses")
          .select("id")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .limit(1),
        checkOAuthStatus()
      ]);

      const businesses = businessesResult.data;
      const hasBusinesses = businesses && businesses.length > 0;

      // IMPORTANT:
      // Being logged in with Google (app_metadata) does NOT mean the Google Business integration is connected.
      // We consider it connected only if we have active businesses OR a stored refresh token.
      setIsGoogleConnected(hasBusinesses || oauthStatus.isConnected);
      setHasRefreshToken(oauthStatus.isConnected);
      
      setLoading(false);
    };

    fetchProfile();
  }, [user, session, navigate, checkOAuthStatus]);

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
    // Use the custom OAuth flow that stores refresh_token in database
    await initiateOAuth();
  };

  const handleDisconnectGoogle = async () => {
    try {
      // Deactivate all businesses and clear tokens
      await Promise.all([
        supabase
          .from("businesses")
          .update({ is_active: false })
          .eq("user_id", user!.id),
        supabase
          .from("profiles")
          .update({ 
            google_refresh_token: null,
            google_access_token: null,
            google_token_expires_at: null 
          })
          .eq("id", user!.id)
      ]);
      
      toast({
        title: "Google déconnecté",
        description: "Reconnectez Google pour réactiver vos établissements.",
      });
      
      setIsGoogleConnected(false);
      setHasRefreshToken(false);
      
      // Force page reload to refresh all state
      window.location.reload();
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

  // Handle push notification subscribe with feedback
  const handleSubscribePush = async () => {
    console.log("[Settings] handleSubscribePush called");
    console.log("[Settings] Push state:", { pushSupported, pushSubscribed, pushPermission, pushLoading });
    
    const success = await subscribePush();
    console.log("[Settings] Subscribe result:", success);
    
    if (success) {
      toast({
        title: "Notifications activées",
        description: "Vous recevrez les alertes push même quand l'app est fermée.",
      });
    } else {
      // More detailed error message
      let errorMessage = "Impossible d'activer les notifications.";
      if (pushPermission === "denied") {
        errorMessage = "Les notifications sont bloquées. Activez-les dans les paramètres de votre navigateur.";
      } else if (pushPermission === "unsupported") {
        errorMessage = "Les notifications push ne sont pas supportées par ce navigateur.";
      } else {
        errorMessage = "Échec de l'activation. Installez l'app (PWA) pour recevoir les notifications push.";
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Handle push notification unsubscribe with feedback
  const handleUnsubscribePush = async () => {
    const success = await unsubscribePush();
    if (success) {
      toast({
        title: "Notifications désactivées",
        description: "Vous ne recevrez plus les alertes push.",
      });
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de désactiver les notifications.",
        variant: "destructive",
      });
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
            <div className="flex flex-col gap-3 mb-3">
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
                className="gap-2 w-full sm:w-auto"
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

          <Button 
            onClick={() => setShowUpgradeDialog(true)} 
            className="w-full gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Voir tous les plans
          </Button>
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
                  {isGoogleConnected && hasRefreshToken && (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] px-2 py-0.5">
                      <Check className="w-2.5 h-2.5 mr-0.5" />
                      Connecté
                    </Badge>
                  )}
                  {isGoogleConnected && !hasRefreshToken && (
                    <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-[10px] px-2 py-0.5">
                      <RefreshCw className="w-2.5 h-2.5 mr-0.5" />
                      Reconnexion requise
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isGoogleConnected && !hasRefreshToken 
                    ? "Cliquez sur 'Reconnecter' pour permettre la sync automatique"
                    : "Sync avis & établissements"
                  }
                </p>
              </div>
            </div>
            
            {/* Action Buttons - Full width on mobile */}
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Disconnect button - Always visible when Google connected */}
              {isGoogleConnected && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDisconnectGoogle}
                  className="w-full sm:w-auto text-destructive hover:text-destructive rounded-xl h-10"
                >
                  <Unlink className="w-4 h-4 mr-2" />
                  Déconnecter Google
                </Button>
              )}
              {/* Reconnect button - When connected but no refresh token */}
              {isGoogleConnected && !hasRefreshToken && (
                <Button 
                  size="sm"
                  onClick={handleConnectGoogle}
                  disabled={isConnecting}
                  className="w-full sm:w-auto rounded-xl h-10 shadow-md shadow-primary/20"
                >
                  {isConnecting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Reconnecter Google
                </Button>
              )}
              {/* Connect button - When not connected */}
              {!isGoogleConnected && (
                <Button 
                  size="sm"
                  onClick={handleConnectGoogle}
                  disabled={isConnecting}
                  className="w-full sm:w-auto rounded-xl h-10 shadow-md shadow-primary/20"
                >
                  {isConnecting ? (
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
          
          <div className="space-y-4">
            {/* Web Push Notifications */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  pushSubscribed ? 'bg-green-500/10' : 'bg-muted'
                }`}>
                  {pushSubscribed ? (
                    <BellRing className="w-5 h-5 text-green-600" />
                  ) : (
                    <BellOff className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">
                    Notifications Push
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {!pushSupported 
                      ? "Non supporté par ce navigateur"
                      : pushSubscribed 
                        ? "Activées - Vous recevez les alertes même app fermée"
                        : pushPermission === "denied"
                          ? "Bloquées - Activez-les dans les paramètres du navigateur"
                          : "Désactivées - Activez pour recevoir les alertes"
                    }
                  </p>
                </div>
              </div>
              {pushSupported && pushPermission !== "denied" && (
                <Button
                  variant={pushSubscribed ? "outline" : "default"}
                  size="sm"
                  onClick={pushSubscribed ? handleUnsubscribePush : handleSubscribePush}
                  disabled={pushLoading}
                  className="rounded-xl h-9 shrink-0"
                >
                  {pushLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : pushSubscribed ? (
                    <>
                      <BellOff className="w-4 h-4 mr-1.5" />
                      Désactiver
                    </>
                  ) : (
                    <>
                      <BellRing className="w-4 h-4 mr-1.5" />
                      Activer
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Email notifications info */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">
                    Notifications Email
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Configurez dans Paramètres IA
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/ai-settings")}
                className="rounded-xl h-9"
              >
                Configurer
              </Button>
            </div>
          </div>
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
