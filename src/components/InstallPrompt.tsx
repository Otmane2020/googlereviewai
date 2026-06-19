import { useState, useEffect } from "react";
import { usePWA } from "@/hooks/usePWA";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { Button } from "@/components/ui/button";
import { X, Download, Share, Plus } from "lucide-react";

export const InstallPrompt = () => {
  const { isInstalled, isStandalone, isIOS, canInstall, promptInstall } = usePWA();
  const { isNativeApp, isMobile } = useDeviceDetection();
  const [dismissed, setDismissed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const lastDismissed = localStorage.getItem("install-prompt-dismissed");
    if (lastDismissed) {
      const dismissedTime = parseInt(lastDismissed, 10);
      if (Date.now() - dismissedTime < 60 * 60 * 1000) setDismissed(true);
    }
  }, []);

  if (isNativeApp) return null;
  if (isInstalled || isStandalone || dismissed) return null;
  if (!isMobile && !canInstall) return null;

  const handleDismiss = () => {
    setDismissed(true);
    setShowModal(false);
    localStorage.setItem("install-prompt-dismissed", Date.now().toString());
  };

  const handleOpenModal = () => setShowModal(true);

  const handleNativeInstall = async () => {
    setInstalling(true);
    try {
      const installed = await promptInstall();
      if (installed) handleDismiss();
    } catch (e) {
      console.error("[InstallPrompt] native install failed:", e);
    } finally {
      setInstalling(false);
    }
  };

  // Modal — vraie popup avec un seul bouton "Installer"
  if (showModal) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img src="/icon-192x192.png" alt="Ranki" className="w-12 h-12 rounded-xl shadow" />
              <div>
                <h3 className="font-bold text-base">Installer Ranki</h3>
                <p className="text-xs text-muted-foreground">Accès rapide + notifications</p>
              </div>
            </div>
            <button onClick={handleDismiss} className="p-1 rounded-lg hover:bg-muted" aria-label="Fermer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {isIOS ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Sur iPhone, l'installation se fait en 2 gestes depuis Safari&nbsp;:
              </p>
              <ol className="space-y-2 text-sm mb-5">
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
                  Appuyez sur <Share className="inline h-4 w-4 text-primary" /> en bas de Safari
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
                  Choisissez <Plus className="inline h-4 w-4 text-primary" /> "Sur l'écran d'accueil"
                </li>
              </ol>
              <Button onClick={handleDismiss} className="w-full">J'ai compris</Button>
            </>
          ) : canInstall ? (
            <>
              <p className="text-sm text-muted-foreground mb-5">
                Installez Ranki sur votre appareil pour un accès en un clic et recevoir les notifications de nouveaux avis.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDismiss} className="flex-1">Plus tard</Button>
                <Button onClick={handleNativeInstall} disabled={installing} className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  {installing ? "Installation..." : "Installer"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Votre navigateur ne propose pas d'installation directe. Ouvrez le menu de Chrome (⋮ en haut à droite) et choisissez <strong>"Ajouter à l'écran d'accueil"</strong>.
              </p>
              <Button onClick={handleDismiss} className="w-full">J'ai compris</Button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Bottom banner
  return (
    <div className="fixed left-2 right-2 bottom-[80px] md:bottom-4 z-40 bg-primary text-primary-foreground shadow-2xl rounded-2xl animate-fade-in">
      <div className="px-3 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img src="/icon-192x192.png" alt="Ranki" className="w-9 h-9 rounded-xl flex-shrink-0 shadow-md" />
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">Installer Ranki</p>
            <p className="text-xs opacity-90 truncate">Accès rapide + notifications</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button size="sm" variant="secondary" onClick={handleOpenModal} className="h-8 px-3 text-xs font-medium">
            <Download className="w-3.5 h-3.5 mr-1" />
            Installer
          </Button>
          <button onClick={handleDismiss} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors" aria-label="Fermer">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
