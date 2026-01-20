import { useState, useEffect } from "react";
import { usePWA } from "@/hooks/usePWA";
import { Button } from "@/components/ui/button";
import { X, Download, Share, Plus, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const InstallPrompt = () => {
  const { isInstalled, isStandalone, isIOS, canInstall, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const navigate = useNavigate();

  // Check if already dismissed recently
  useEffect(() => {
    const lastDismissed = localStorage.getItem("install-prompt-dismissed");
    if (lastDismissed) {
      const dismissedTime = parseInt(lastDismissed, 10);
      // Don't show for 24 hours after dismissal
      if (Date.now() - dismissedTime < 24 * 60 * 60 * 1000) {
        setDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("install-prompt-dismissed", Date.now().toString());
  };

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      handleDismiss();
    }
  };

  const handleIOSInstall = () => {
    setShowIOSGuide(true);
  };

  // Don't show if already installed or dismissed
  if (isInstalled || isStandalone || dismissed) {
    return null;
  }

  // Don't show if can't install (not on supported browser)
  if (!canInstall && !isIOS) {
    return null;
  }

  // iOS Guide Modal
  if (showIOSGuide) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-5 animate-slide-in-right">
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
                Appuyez sur <Share className="h-5 w-5 text-primary" /> en bas de Safari
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
              <div className="flex items-center gap-2 pt-1">
                Sélectionnez <Plus className="h-5 w-5 text-primary" /> "Sur l'écran d'accueil"
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
              <span className="pt-1">Confirmez en appuyant sur "Ajouter"</span>
            </li>
          </ol>

          <Button variant="outline" onClick={() => setShowIOSGuide(false)} className="w-full">
            J'ai compris
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 sm:bottom-4 left-4 right-4 z-40 animate-slide-in-right">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-4 max-w-sm mx-auto">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 flex-shrink-0">
            <Smartphone className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">Installer Starlinko</h3>
            <p className="text-xs text-muted-foreground mb-3">
              {isIOS 
                ? "Requis pour recevoir les notifications push même quand l'app est fermée"
                : "Accès rapide et notifications push même hors navigateur"
              }
            </p>
            <div className="flex gap-2">
              {isIOS ? (
                <Button size="sm" onClick={handleIOSInstall} className="flex-1 h-9">
                  <Share className="w-4 h-4 mr-1.5" />
                  Comment faire
                </Button>
              ) : (
                <Button size="sm" onClick={handleInstall} className="flex-1 h-9">
                  <Download className="w-4 h-4 mr-1.5" />
                  Installer
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={handleDismiss} className="h-9 px-3">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
