import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGoogleOAuth } from "@/hooks/useGoogleOAuth";

interface ReconnectGoogleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReconnectGoogleDialog = ({ open, onOpenChange }: ReconnectGoogleDialogProps) => {
  const { t } = useTranslation();
  const { initiateOAuth, isConnecting } = useGoogleOAuth();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-2">
            <ShieldAlert className="w-6 h-6 text-destructive" />
          </div>
          <DialogTitle className="text-center">
            {t("reconnectDialog.title", "Reconnexion Google requise")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t(
              "reconnectDialog.description",
              "Votre connexion Google Business a expiré. Reconnectez votre compte pour réactiver la synchronisation automatique des avis."
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            className="w-full rounded-xl h-12"
            onClick={initiateOAuth}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                {t("reconnectDialog.connecting", "Connexion...")}
              </>
            ) : (
              t("reconnectDialog.cta", "Reconnecter Google")
            )}
          </Button>
          <Button
            variant="ghost"
            className="w-full rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            {t("reconnectDialog.later", "Plus tard")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
