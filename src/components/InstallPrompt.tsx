import { useState, useEffect } from "react";
import { usePWA } from "@/hooks/usePWA";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { Button } from "@/components/ui/button";
import { X, Download, Share, MoreVertical, Plus } from "lucide-react";

export const InstallPrompt = () => {
  const { isInstalled, isStandalone, isIOS, canInstall, promptInstall } = usePWA();
  const { isNativeApp, isAndroid, isMobile } = useDeviceDetection();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);

  useEffect(() => {
    const lastDismissed = localStorage.getItem("install-prompt-dismissed");
    if (lastDismissed) {
      const dismissedTime = parseInt(lastDismissed, 10);
      // Don't show for 1 hour after dismissal
      if (Date.now() - dismissedTime < 60 * 60 * 1000) {
        setDismissed(true);
      }
    }
  }, []);

  // Don't show in native app (Play Store install)
  if (isNativeApp) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("install-prompt-dismissed", Date.now().toString());
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    // Android: try native prompt, otherwise show manual guide
    if (canInstall) {
      const installed = await promptInstall();
      if (installed) handleDismiss();
      else setShowAndroidGuide(true);
    } else {
      setShowAndroidGuide(true);
    }
  };

  if (isInstalled || isStandalone || dismissed) return null;

  // Show on any mobile device (iOS Safari, Android Chrome, etc.)
  // On desktop, only show if the browser actually supports install
  if (!isMobile && !canInstall) return null;

  // iOS Guide Modal
  if (showIOSGuide) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-5 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Installer sur iPhone</h3>
            <button onClick={() => setShowIOSGuide(false)} className="p-1 rounded-lg hover:bg-muted">
              <X className="w-5 h-5" />
            </button>
          </div>
          <ol className="space-y-4 text-sm mb-5">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
              <div className="flex items-center gap-2 pt-1">
                Appuie sur <Share className="h-5 w-5 text-primary" /> en bas de Safari
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
              <div className="pt-1">Fais défiler et appuie sur "Sur l'écran d'accueil"</div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
              <span className="pt-1">Confirme avec "Ajouter"</span>
            </li>
          </ol>
          <Button variant="outline" onClick={() => setShowIOSGuide(false)} className="w-full">
            J'ai compris
          </Button>
        </div>
      </div>
    );
  }

  // Android Guide Modal (fallback when beforeinstallprompt doesn't fire)
  if (showAndroidGuide) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-5 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Installer sur Android</h3>
            <button onClick={() => setShowAndroidGuide(false)} className="p-1 rounded-lg hover:bg-muted">
              <X className="w-5 h-5" />
            </button>
          </div>
          <ol className="space-y-4 text-sm mb-5">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
              <div className="flex items-center gap-2 pt-1">
                Appuie sur <MoreVertical className="h-5 w-5 text-primary" /> (menu Chrome, en haut à droite)
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
              <div className="flex items-center gap-2 pt-1">
                Choisis <Plus className="h-4 w-4 text-primary" /> "Ajouter à l'écran d'accueil" ou "Installer l'application"
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
              <span className="pt-1">Confirme avec "Installer"</span>
            </li>
          </ol>
          <Button variant="outline" onClick={() => setShowAndroidGuide(false)} className="w-full">
            J'ai compris
          </Button>
        </div>
      </div>
    );
  }

  // Top banner
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground shadow-lg animate-fade-in">
      <div className="container mx-auto px-3 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/icon-192x192.svg"
            alt="Ranki"
            className="w-9 h-9 rounded-xl flex-shrink-0 shadow-md"
          />
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">Installer Ranki</p>
            <p className="text-xs opacity-90 truncate">
              {isIOS ? "Requis pour les notifications" : "Accès rapide + notifications"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleInstall}
            className="h-8 px-3 text-xs font-medium"
          >
            {isIOS ? (
              <>
                <Share className="w-3.5 h-3.5 mr-1" />
                Guide
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 mr-1" />
                Installer
              </>
            )}
          </Button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
