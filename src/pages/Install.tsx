import { useState } from "react";
import { usePWA } from "@/hooks/usePWA";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Check, Share, Plus, MoreVertical } from "lucide-react";
import { RankiLogo } from "@/components/StarlinkoLogo";
import { useNavigate } from "@/lib/router-compat";
import { Helmet } from "react-helmet";

const Install = () => {
  const navigate = useNavigate();
  const { isInstalled, isStandalone, isIOS, canInstall, promptInstall } = usePWA();
  const [installRequested, setInstallRequested] = useState(false);

  const handleInstall = async () => {
    // Direct browser install prompt on the click gesture; success is confirmed separately.
    const accepted = await promptInstall();
    if (accepted) setInstallRequested(true);
  };

  if (isStandalone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <RankiLogo className="h-16 w-auto" />
            </div>
            <CardTitle className="text-2xl">Application installée !</CardTitle>
            <CardDescription>
              Vous utilisez déjà Reviews AI en tant qu'application
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
              <RankiLogo className="h-16 w-auto" />
            </div>
            <CardTitle className="text-2xl text-secondary">Installation réussie !</CardTitle>
            <CardDescription>
              Reviews AI a été ajouté à votre écran d'accueil
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
        <title>Install Reviews AI | Google Reviews PWA</title>
        <meta 
          name="description" 
          content="Installez l'application Reviews AI sur votre téléphone. Accédez à vos avis Google depuis votre écran d'accueil, même hors ligne." 
        />
        <meta name="keywords" content="installer googlereviewai.com, application avis Google, PWA, mobile app" />
        <link rel="canonical" href="https://reviewsai.store/install" />
        
        <meta property="og:title" content="Install Reviews AI - Google Reviews app" />
        <meta property="og:description" content="Installez l'app Reviews AI pour gérer vos avis Google partout." />
        <meta property="og:url" content="https://reviewsai.store/install" />
        <meta property="og:type" content="website" />
      </Helmet>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <RankiLogo className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl">Installer Reviews AI</CardTitle>
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
                <p className="font-medium">Notifications d’avis</p>
                <p className="text-sm text-muted-foreground">Restez informé des nouveaux avis</p>
              </div>
            </div>
          </div>

          {installRequested && !isInstalled && (
            <p className="text-sm text-muted-foreground" role="status">Confirmez l’installation dans votre navigateur. Vous pourrez ensuite ouvrir Reviews AI depuis votre écran d’accueil.</p>
          )}
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
              <h3 className="font-semibold mb-3">Installation manuelle (Chrome, Edge ou Android) :</h3>
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