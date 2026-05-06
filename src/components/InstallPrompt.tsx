import { useState, useEffect } from "react";
import { usePWA } from "@/hooks/usePWA";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { Button } from "@/components/ui/button";
import { X, Download, Share } from "lucide-react";

export const InstallPrompt = () => {
  const { isInstalled, isStandalone, isIOS, canInstall, promptInstall } = usePWA();
  const { isNativeApp, isAndroid } = useDeviceDetection();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // ✅ Hook MUST be called before any conditional return
  useEffect(() => {
    const lastDismissed = localStorage.getItem("install-prompt-dismissed");
    if (lastDismissed) {
      const dismissedTime = parseInt(lastDismissed, 10);
      // Don't show for 1 hour after dismissal (was 24h, too long)
      if (Date.now() - dismissedTime < 60 * 60 * 1000) {
        setDismissed(true);
      }
    }
  }, []);

  // ✅ All conditional returns AFTER hooks
  // Don't show if already in native app (Play Store install)
  if (isNativeApp) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("install-prompt-dismissed", Date.now().toString());
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
    } else {
      const installed = await promptInstall();
      if (installed) {
        handleDismiss();
      }
    }
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm p-5 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Install on iPhone</h3>
            <button onClick={() => setShowIOSGuide(false)} className="p-1 rounded-lg hover:bg-muted">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <ol className="space-y-4 text-sm mb-5">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span>
              <div className="flex items-center gap-2 pt-1">
                Tap <Share className="h-5 w-5 text-primary" /> at the bottom of Safari
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span>
              <div className="flex items-center gap-2 pt-1">
                Scroll down and tap "Add to Home Screen"
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span>
              <span className="pt-1">Confirm by tapping "Add"</span>
            </li>
          </ol>

          <Button variant="outline" onClick={() => setShowIOSGuide(false)} className="w-full">
            Got it
          </Button>
        </div>
      </div>
    );
  }

  // Top banner design (like competitors)
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
            <p className="font-semibold text-sm truncate">Install Ranki</p>
            <p className="text-xs opacity-90 truncate">
              {isIOS ? "Required for notifications" : "Quick access + notifications"}
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
                Install
              </>
            )}
          </Button>
          <button 
            onClick={handleDismiss} 
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
