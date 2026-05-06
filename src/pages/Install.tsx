import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Check, Share, Plus, MoreVertical } from "lucide-react";
import { Ranki.aiLogo } from "@/components/StarlinkoLogo";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const checkStandalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(checkStandalone);
    
    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for app installed
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isStandalone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Ranki.aiLogo className="h-16 w-auto" />
            </div>
            <CardTitle className="text-2xl">Application installée !</CardTitle>
            <CardDescription>
              Vous utilisez déjà Ranki.ai en tant qu'application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-2 text-secondary mb-6">
              <Check className="h-6 w-6" />
              <span className="text-lg font-medium">Installation réussie</span>
            </div>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Accéder au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isInstalled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Ranki.aiLogo className="h-16 w-auto" />
            </div>
            <CardTitle className="text-2xl text-secondary">Installation réussie !</CardTitle>
            <CardDescription>
              Ranki.ai a été ajouté à votre écran d'accueil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You can now launch the app from your home screen.
            </p>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Continuer sur le web
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 safe-area-insets">
      <Helmet>
        <title>Install Ranki | Google Reviews PWA</title>
        <meta 
          name="description" 
          content="Installez l'application Ranki.ai sur votre téléphone. Accédez à vos avis Google depuis votre écran d'accueil, même hors ligne." 
        />
        <meta name="keywords" content="installer ranki.ai, application avis google, PWA, mobile app" />
        <link rel="canonical" href="https://ranki.ai/install" />
        
        <meta property="og:title" content="Install Ranki - Google Reviews app" />
        <meta property="og:description" content="Installez l'app Ranki.ai pour gérer vos avis Google partout." />
        <meta property="og:url" content="https://ranki.ai/install" />
        <meta property="og:type" content="website" />
      </Helmet>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Ranki.aiLogo className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl">Installer Ranki.ai</CardTitle>
          <CardDescription>
            Installez l'application sur votre appareil pour un accès rapide
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-primary/10">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Accès rapide</p>
                <p className="text-sm text-muted-foreground">Lancez depuis l'écran d'accueil</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-secondary/10">
                <Download className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="font-medium">Fonctionne hors ligne</p>
                <p className="text-sm text-muted-foreground">Consultez vos avis sans connexion</p>
              </div>
            </div>
          </div>

          {/* Install instructions */}
          {isIOS ? (
            <div className="p-4 rounded-lg border bg-card">
              <h3 className="font-semibold mb-3">Comment installer sur iPhone/iPad :</h3>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                  <div className="flex items-center gap-2">
                    Appuyez sur <Share className="h-4 w-4" /> en bas de Safari
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                  <div className="flex items-center gap-2">
                    Faites défiler et appuyez sur <Plus className="h-4 w-4" /> "Sur l'écran d'accueil"
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                  <span>Confirmez en appuyant sur "Ajouter"</span>
                </li>
              </ol>
            </div>
          ) : deferredPrompt ? (
            <Button onClick={handleInstall} size="lg" className="w-full">
              <Download className="mr-2 h-5 w-5" />
              Installer l'application
            </Button>
          ) : (
            <div className="p-4 rounded-lg border bg-card">
              <h3 className="font-semibold mb-3">Comment installer sur Android :</h3>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                  <div className="flex items-center gap-2">
                    Appuyez sur <MoreVertical className="h-4 w-4" /> dans le navigateur
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                  <span>Sélectionnez "Installer l'application" ou "Ajouter à l'écran d'accueil"</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
                  <span>Confirmez l'installation</span>
                </li>
              </ol>
            </div>
          )}

          <Button variant="outline" onClick={() => navigate("/")} className="w-full">
            Back to home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
