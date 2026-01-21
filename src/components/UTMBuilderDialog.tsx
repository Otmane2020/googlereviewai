import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check, Link2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface UTMBuilderDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const FACEBOOK_SOURCES = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "messenger", label: "Messenger" },
  { value: "audience_network", label: "Audience Network" },
];

const MEDIUMS = [
  { value: "cpc", label: "CPC (Coût par clic)" },
  { value: "cpm", label: "CPM (Coût par mille)" },
  { value: "paid_social", label: "Paid Social" },
  { value: "retargeting", label: "Retargeting" },
  { value: "display", label: "Display" },
];

export const UTMBuilderDialog = ({ trigger, open, onOpenChange }: UTMBuilderDialogProps) => {
  const [baseUrl, setBaseUrl] = useState("");
  const [utmSource, setUtmSource] = useState("facebook");
  const [utmMedium, setUtmMedium] = useState("cpc");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmContent, setUtmContent] = useState("");
  const [utmTerm, setUtmTerm] = useState("");
  const [copied, setCopied] = useState(false);

  const generateUrl = () => {
    if (!baseUrl) return "";
    
    try {
      const url = new URL(baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`);
      
      if (utmSource) url.searchParams.set("utm_source", utmSource);
      if (utmMedium) url.searchParams.set("utm_medium", utmMedium);
      if (utmCampaign) url.searchParams.set("utm_campaign", utmCampaign.toLowerCase().replace(/\s+/g, "_"));
      if (utmContent) url.searchParams.set("utm_content", utmContent.toLowerCase().replace(/\s+/g, "_"));
      if (utmTerm) url.searchParams.set("utm_term", utmTerm.toLowerCase().replace(/\s+/g, "_"));
      
      return url.toString();
    } catch {
      return "";
    }
  };

  const generatedUrl = generateUrl();

  const handleCopy = async () => {
    if (!generatedUrl) {
      toast.error("Entrez d'abord une URL de destination");
      return;
    }
    
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      toast.success("URL copiée !");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erreur lors de la copie");
    }
  };

  const handleReset = () => {
    setBaseUrl("");
    setUtmSource("facebook");
    setUtmMedium("cpc");
    setUtmCampaign("");
    setUtmContent("");
    setUtmTerm("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Générateur URL Facebook Ads
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Base URL */}
          <div className="space-y-2">
            <Label htmlFor="baseUrl">URL de destination *</Label>
            <Input
              id="baseUrl"
              placeholder="https://votresite.com/page"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </div>

          {/* UTM Source */}
          <div className="space-y-2">
            <Label>Source (utm_source)</Label>
            <Select value={utmSource} onValueChange={setUtmSource}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FACEBOOK_SOURCES.map((source) => (
                  <SelectItem key={source.value} value={source.value}>
                    {source.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Plateforme d'origine du trafic
            </p>
          </div>

          {/* UTM Medium */}
          <div className="space-y-2">
            <Label>Medium (utm_medium)</Label>
            <Select value={utmMedium} onValueChange={setUtmMedium}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEDIUMS.map((medium) => (
                  <SelectItem key={medium.value} value={medium.value}>
                    {medium.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Type de campagne publicitaire
            </p>
          </div>

          {/* UTM Campaign */}
          <div className="space-y-2">
            <Label htmlFor="campaign">Campagne (utm_campaign) *</Label>
            <Input
              id="campaign"
              placeholder="ex: soldes_ete_2025"
              value={utmCampaign}
              onChange={(e) => setUtmCampaign(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Nom de votre campagne publicitaire
            </p>
          </div>

          {/* UTM Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Contenu (utm_content)</Label>
            <Input
              id="content"
              placeholder="ex: video_1, image_carousel"
              value={utmContent}
              onChange={(e) => setUtmContent(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Variante de la pub (A/B test, format)
            </p>
          </div>

          {/* UTM Term */}
          <div className="space-y-2">
            <Label htmlFor="term">Terme (utm_term)</Label>
            <Input
              id="term"
              placeholder="ex: promo_50_pourcent"
              value={utmTerm}
              onChange={(e) => setUtmTerm(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Mot-clé ciblé ou audience
            </p>
          </div>

          {/* Generated URL Preview */}
          {generatedUrl && (
            <div className="space-y-2 pt-2 border-t">
              <Label>URL générée</Label>
              <div className="p-3 bg-muted rounded-lg break-all text-sm font-mono">
                {generatedUrl}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleReset}
            >
              Réinitialiser
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleCopy}
              disabled={!generatedUrl}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copier l'URL
                </>
              )}
            </Button>
          </div>

          {/* Tips */}
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">💡 Conseils :</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Utilisez cette URL dans le champ "URL du site web" de votre pub Facebook</li>
              <li>Les espaces sont automatiquement convertis en underscores</li>
              <li>Vérifiez vos conversions dans Google Analytics &gt; Acquisition</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
