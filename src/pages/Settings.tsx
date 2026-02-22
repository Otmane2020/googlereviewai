import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { useWebPush } from "@/hooks/useWebPush";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { SupportDialog } from "@/components/SupportDialog";
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
  BellOff,
  BellRing,
  Save,
  Loader2,
  Crown,
  Check,
  Settings as SettingsIcon,
  Link2,
  Sparkles,
  ExternalLink,
  Send
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
  const { isNativeApp, canUsePushAlert } = useDeviceDetection();
  const webPush = useWebPush();
  const [pushPermission, setPushPermission] = useState<NotificationPermission | "unsupported">("default");
  const [isSubscribedToPush, setIsSubscribedToPush] = useState<boolean>(true);
  const [testingSending, setTestingSending] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  // Check notification permission and subscription state via PushAlert SDK
  useEffect(() => {
    if ("Notification" in window) {
      setPushPermission(Notification.permission);
      
      // Use PushAlert API to check real subscription status
      (window as any).pushalertbyiw = (window as any).pushalertbyiw || [];
      (window as any).pushalertbyiw.push(['onReady', () => {
        const subsInfo = (window as any).PushAlertCo?.getSubsInfo?.();
        if (subsInfo) {
          setIsSubscribedToPush(subsInfo.status === "subscribed");
        }
      }]);
    } else {
      setPushPermission("unsupported");
    }
  }, []);

  const fetchProfileData = async () => {
    if (!user) return;
    
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
    
    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    fetchProfileData();
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
                size="sm"
                onClick={handleManageSubscription}
                disabled={openingPortal}
                className="gap-2 w-full sm:w-auto !bg-amber-400 hover:!bg-amber-500 !text-amber-950 !border-0"
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
            <div className="flex items-center gap-3">
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
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] px-2 py-0.5">
                    <Check className="w-2.5 h-2.5 mr-0.5" />
                    Connecté
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Synchronisation automatique des avis et établissements
                </p>
              </div>
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
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={async () => {
                if (!user?.email) {
                  toast({
                    title: "Erreur",
                    description: "Email non disponible",
                    variant: "destructive",
                  });
                  return;
                }
                
                const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                  redirectTo: `${window.location.origin}/reset-password`,
                });
                
                if (error) {
                  toast({
                    title: "Erreur",
                    description: error.message,
                    variant: "destructive",
                  });
                } else {
                  toast({
                    title: "Email envoyé",
                    description: "Vérifiez votre boîte mail pour réinitialiser votre mot de passe.",
                  });
                }
              }}
            >
              Changer le mot de passe
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 justify-start text-destructive hover:text-destructive"
                onClick={handleSignOut}
              >
                Se déconnecter
              </Button>
              <SupportDialog userEmail={profile?.email} />
            </div>
          </div>
        </div>

        {/* Notifications section */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            {/* Native App - Show Android system message */}
            {isNativeApp ? (
              <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <BellRing className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      Notifications Push
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Gérées par le système Android
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Try to open Android app settings
                    // This works in Capacitor WebView
                    try {
                      window.open("intent:#Intent;action=android.settings.APP_NOTIFICATION_SETTINGS;extra=android.provider.extra.APP_PACKAGE=com.world.fi.starlinko;end", "_system");
                    } catch {
                      toast({
                        title: "Paramètres Android",
                        description: "Ouvrez Paramètres > Applications > Starlinko > Notifications",
                      });
                    }
                  }}
                  className="rounded-xl h-9 shrink-0 gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Paramètres
                </Button>
              </div>
            ) : (
              /* Web/PWA Push Notifications - PushAlert handles this */
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    pushPermission === "granted" && isSubscribedToPush ? 'bg-green-500/10' : 'bg-muted'
                  }`}>
                    {pushPermission === "granted" && isSubscribedToPush ? (
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
                      {pushPermission === "unsupported"
                        ? "Non supporté par ce navigateur"
                        : pushPermission === "granted" && isSubscribedToPush
                          ? "Activées - Vous recevez les alertes"
                          : pushPermission === "denied"
                            ? "Bloquées - Autorisez dans le navigateur"
                            : "Désactivées"
                      }
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                {pushPermission === "granted" && isSubscribedToPush && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // PushAlert unsubscribe - properly unsubscribe user
                      if (typeof window !== 'undefined' && (window as any).PushAlertCo) {
                        (window as any).PushAlertCo.unsubscribe();
                        setIsSubscribedToPush(false);
                        toast({
                          title: "Notifications désactivées",
                          description: "Vous ne recevrez plus de notifications push.",
                        });
                      }
                    }}
                    className="rounded-xl h-9 shrink-0"
                  >
                    <BellOff className="w-4 h-4 mr-1" />
                    Désactiver
                  </Button>
                )}
                {/* Force reactivation button - always visible when push permission granted but SDK issues */}
                {pushPermission === "granted" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      // Force re-subscribe: clear old subscriber_id and trigger new subscription
                      if (typeof window !== 'undefined' && (window as any).PushAlertCo && user) {
                        // 1. Clear old subscriber_id from database
                        try {
                          await supabase
                            .from("profiles")
                            .update({ pushalert_subscriber_id: null })
                            .eq("id", user.id);
                          console.log("[Settings] Cleared old subscriber_id");
                        } catch (e) {
                          console.error("[Settings] Error clearing subscriber_id:", e);
                        }
                        
                        // 2. Force new subscription
                        (window as any).PushAlertCo.forceSubscribe({
                          onSuccess: async () => {
                            const info = (window as any).PushAlertCo?.getSubsInfo?.();
                            if (info?.subs_id) {
                              // Register new subscriber_id
                              try {
                                const { data: { session } } = await supabase.auth.getSession();
                                if (session?.access_token) {
                                  await fetch(
                                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/register-pushalert-subscriber`,
                                    {
                                      method: "POST",
                                      headers: {
                                        "Content-Type": "application/json",
                                        "Authorization": `Bearer ${session.access_token}`,
                                      },
                                      body: JSON.stringify({ subscriber_id: info.subs_id }),
                                    }
                                  );
                                }
                              } catch (e) {
                                console.error("[Settings] Error registering new subscriber:", e);
                              }
                            }
                            setIsSubscribedToPush(true);
                            toast({
                              title: "Notifications réactivées ✅",
                              description: "Vous recevrez à nouveau les alertes.",
                            });
                          },
                          onFailure: () => {
                            toast({
                              title: "Échec de réactivation",
                              description: "Vérifiez les permissions du navigateur.",
                              variant: "destructive",
                            });
                          }
                        });
                      }
                    }}
                    className="rounded-xl h-9 shrink-0"
                  >
                    <BellRing className="w-4 h-4 mr-1" />
                    Réactiver
                  </Button>
                )}
                {pushPermission === "default" && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      // First time subscription with native prompt
                      if (typeof window !== 'undefined' && (window as any).PushAlertCo) {
                        (window as any).pushalertbyiw = (window as any).pushalertbyiw || [];
                        (window as any).pushalertbyiw.push(['onSuccess', () => {
                          setPushPermission("granted");
                          setIsSubscribedToPush(true);
                          toast({
                            title: "Notifications activées",
                            description: "Vous recevrez les alertes de nouveaux avis.",
                          });
                        }]);
                        (window as any).pushalertbyiw.push(['onFailure', (result: any) => {
                          if (result?.status === -1) {
                            setPushPermission("denied");
                            toast({
                              title: "Notifications bloquées",
                              description: "Autorisez dans les paramètres du navigateur.",
                              variant: "destructive",
                            });
                          }
                        }]);
                        (window as any).PushAlertCo.forceSubscribe();
                      }
                    }}
                    className="rounded-xl h-9 shrink-0"
                  >
                    <Bell className="w-4 h-4 mr-1" />
                    Activer
                  </Button>
                )}
                {pushPermission === "denied" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="rounded-xl h-9 shrink-0"
                  >
                    Recharger
                  </Button>
                )}
                </div>
              </div>
            )}
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

            {/* VAPID Web Push section */}
            <div className="p-4 bg-muted/50 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    webPush.isSubscribed ? 'bg-green-500/10' : 'bg-muted'
                  }`}>
                    {webPush.isSubscribed ? (
                      <BellRing className="w-5 h-5 text-green-600" />
                    ) : (
                      <Bell className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      Web Push (VAPID)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {!webPush.isSupported
                        ? "Non supporté par ce navigateur"
                        : webPush.isSubscribed
                          ? "Activé - Push natif actif"
                          : webPush.permission === "denied"
                            ? "Bloqué par le navigateur"
                            : "Inactif - Activez pour recevoir les alertes"
                      }
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {webPush.isSupported && !webPush.isSubscribed && webPush.permission !== "denied" && (
                    <Button
                      variant="default"
                      size="sm"
                      disabled={webPush.loading}
                      onClick={async () => {
                        const ok = await webPush.subscribe();
                        toast({
                          title: ok ? "Web Push activé ✅" : "Échec de l'activation",
                          description: ok 
                            ? "Vous recevrez les notifications push natives." 
                            : "Vérifiez les permissions du navigateur.",
                          variant: ok ? "default" : "destructive",
                        });
                      }}
                      className="rounded-xl h-9"
                    >
                      {webPush.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4 mr-1" />}
                      Activer
                    </Button>
                  )}
                  {webPush.isSubscribed && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={webPush.loading}
                      onClick={async () => {
                        await webPush.unsubscribe();
                        toast({
                          title: "Web Push désactivé",
                          description: "Notifications push natives désactivées.",
                        });
                      }}
                      className="rounded-xl h-9"
                    >
                      <BellOff className="w-4 h-4 mr-1" />
                      Désactiver
                    </Button>
                  )}
                </div>
              </div>

              {/* Test push notification button */}
              {webPush.isSubscribed && (
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Envoyez une notification de test pour vérifier
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={testingSending}
                    onClick={async () => {
                      setTestingSending(true);
                      const ok = await webPush.sendTestNotification();
                      setTestingSending(false);
                      toast({
                        title: ok ? "Notification envoyée 🔔" : "Échec de l'envoi",
                        description: ok 
                          ? "Vous devriez recevoir la notification dans quelques secondes." 
                          : "Vérifiez votre souscription push.",
                        variant: ok ? "default" : "destructive",
                      });
                    }}
                    className="rounded-xl h-9 gap-1"
                  >
                    {testingSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Tester
                  </Button>
                </div>
              )}
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
