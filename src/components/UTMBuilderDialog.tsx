import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Copy, Check, Link2, ChevronDown, Info } from "lucide-react";
import { toast } from "sonner";

interface UTMBuilderDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DYNAMIC_PARAMS = {
  campaign: [
    { value: "{{campaign.id}}", label: "ID de campagne" },
    { value: "{{campaign.name}}", label: "Nom de campagne" },
  ],
  adset: [
    { value: "{{adset.id}}", label: "ID d'ensemble" },
    { value: "{{adset.name}}", label: "Nom d'ensemble" },
  ],
  ad: [
    { value: "{{ad.id}}", label: "ID de publicité" },
    { value: "{{ad.name}}", label: "Nom de publicité" },
  ],
  placement: [
    { value: "{{placement}}", label: "Placement" },
    { value: "{{site_source_name}}", label: "Source (fb/ig/msg/an)" },
  ],
};

const FieldWithDynamic = ({ 
  label, 
  description, 
  value, 
  onChange, 
  placeholder,
  dynamicOptions 
}: { 
  label: string;
  description: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  dynamicOptions?: { value: string; label: string }[];
}) => {
  const [open, setOpen] = useState(false);

  const insertDynamic = (param: string) => {
    onChange(value ? `${value}_${param}` : param);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground">{label}</Label>
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">Campaign parameters</span>
      </div>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 font-mono text-sm"
        />
        {dynamicOptions && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <ChevronDown className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-1 bg-popover border" align="end">
              <div className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                Paramètres dynamiques
              </div>
              {dynamicOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => insertDynamic(opt.value)}
                  className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded-sm flex items-center justify-between"
                >
                  <span className="text-foreground">{opt.label}</span>
                  <code className="text-xs text-muted-foreground">{opt.value}</code>
                </button>
              ))}
            </PopoverContent>
          </Popover>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
};

export const UTMBuilderDialog = ({ trigger, open, onOpenChange }: UTMBuilderDialogProps) => {
  const [baseUrl, setBaseUrl] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmContent, setUtmContent] = useState("");
  const [copied, setCopied] = useState(false);

  const generateUrl = () => {
    if (!baseUrl) return "";
    
    try {
      const url = new URL(baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`);
      
      if (utmSource) url.searchParams.set("utm_source", utmSource);
      if (utmMedium) url.searchParams.set("utm_medium", utmMedium);
      if (utmCampaign) url.searchParams.set("utm_campaign", utmCampaign);
      if (utmContent) url.searchParams.set("utm_content", utmContent);
      
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
      toast.error("Error lors de la copie");
    }
  };

  const handleReset = () => {
    setBaseUrl("");
    setUtmSource("");
    setUtmMedium("");
    setUtmCampaign("");
    setUtmContent("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            Build a URL parameter
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Fill out the fields in the form below to add parameters to your website URL. 
            Click <ChevronDown className="w-3 h-3 inline" /> to select dynamic parameters.
          </p>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Base URL */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Website URL</Label>
            <Input
              placeholder="https://www.example.com/page"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <div className="h-px bg-border" />

          {/* Campaign Source */}
          <FieldWithDynamic
            label="Campaign source"
            description="To identify the source of traffic. For example: Facebook, Instagram, a search engine or other source."
            value={utmSource}
            onChange={setUtmSource}
            placeholder="facebook"
            dynamicOptions={DYNAMIC_PARAMS.placement}
          />

          {/* Campaign Medium */}
          <FieldWithDynamic
            label="Campaign medium"
            description="To identify the advertising medium. For example: banner, email, Facebook_Feed or Instagram_Story."
            value={utmMedium}
            onChange={setUtmMedium}
            placeholder="cpc"
            dynamicOptions={[
              { value: "{{placement}}", label: "Placement (Feed, Story...)" },
              { value: "cpc", label: "CPC" },
              { value: "cpm", label: "CPM" },
            ]}
          />

          {/* Campaign Name */}
          <FieldWithDynamic
            label="Campaign name"
            description="To identify a specific promotion or strategic campaign. For example: summer_sale."
            value={utmCampaign}
            onChange={setUtmCampaign}
            placeholder="{{campaign.name}}"
            dynamicOptions={DYNAMIC_PARAMS.campaign}
          />

          {/* Campaign Content */}
          <FieldWithDynamic
            label="Campaign content"
            description="To differentiate ads or links that point to the same URL. For example: white_logo, black_logo."
            value={utmContent}
            onChange={setUtmContent}
            placeholder="{{ad.name}}"
            dynamicOptions={[...DYNAMIC_PARAMS.ad, ...DYNAMIC_PARAMS.adset]}
          />

          <div className="h-px bg-border" />

          {/* Parameter Preview */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Parameter preview</Label>
              <Info className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="p-3 bg-muted rounded-lg min-h-[60px]">
              {generatedUrl ? (
                <p className="text-sm font-mono break-all text-foreground">{generatedUrl}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Preview text</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleReset}
            >
              Reset
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleCopy}
              disabled={!generatedUrl}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy URL
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
