import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Loader2, Gift, QrCode, MapPin, CheckCircle2, Eye, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import QRCode from "qrcode";

const COUNTRIES = [
  { code: "FR", name: "France" }, { code: "BE", name: "Belgique" }, { code: "LU", name: "Luxembourg" },
  { code: "CH", name: "Suisse" }, { code: "DE", name: "Allemagne" }, { code: "ES", name: "Espagne" },
  { code: "IT", name: "Italie" }, { code: "GB", name: "Royaume-Uni" }, { code: "US", name: "USA" },
  { code: "CA", name: "Canada" }, { code: "NL", name: "Pays-Bas" }, { code: "PT", name: "Portugal" },
  { code: "MA", name: "Maroc" }, { code: "TN", name: "Tunisie" }, { code: "DZ", name: "Algérie" },
  { code: "SN", name: "Sénégal" }, { code: "CI", name: "Côte d'Ivoire" }, { code: "AE", name: "Émirats arabes unis" },
];

type TemplateId = "classic" | "dark" | "emerald" | "gold";
const TEMPLATES: { id: TemplateId; label: string; bg: string; titleColor: string; subColor: string; accent: string }[] = [
  { id: "classic", label: "Classique blanc", bg: "#ffffff", titleColor: "#1e3a8a", subColor: "#0f172a", accent: "#0d9488" },
  { id: "dark",    label: "Élégant noir",     bg: "#0f172a", titleColor: "#ffffff", subColor: "#e2e8f0", accent: "#10b981" },
  { id: "emerald", label: "Vert émeraude",    bg: "#ecfdf5", titleColor: "#065f46", subColor: "#064e3b", accent: "#059669" },
  { id: "gold",    label: "Noir & Or",        bg: "#0a0a0a", titleColor: "#f5d97f", subColor: "#fef3c7", accent: "#c9a84c" },
];

/** Live preview of the plaque — mirrors the printed result. */
function PlaquePreview({
  template, businessName, websiteOrPlaceLabel, qrDataUrl, size = 320,
}: { template: typeof TEMPLATES[number]; businessName: string; websiteOrPlaceLabel: string; qrDataUrl: string; size?: number }) {
  return (
    <div
      className="rounded-2xl shadow-xl flex flex-col items-center justify-between p-5 mx-auto"
      style={{ width: size, height: size, background: template.bg, border: `2px solid ${template.accent}33` }}
    >
      <div className="text-center leading-tight">
        <div className="font-bold text-[15px]" style={{ color: template.titleColor }}>Votre avis nous intéresse !</div>
        <div className="text-[12px] mt-0.5" style={{ color: template.subColor }}>Partagez votre expérience</div>
      </div>
      {/* Google G */}
      <svg width="26" height="26" viewBox="0 0 48 48" aria-hidden>
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"/>
        <path fill="#FF3D00" d="M6.3 14.1l6.6 4.8C14.7 15.5 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5 16.3 4.5 9.7 8.4 6.3 14.1z"/>
        <path fill="#4CAF50" d="M24 43.5c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.5 16.2 43.5 24 43.5z"/>
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C41.1 36 43.5 30.4 43.5 24c0-1.2-.1-2.4-.4-3.5z"/>
      </svg>

      {qrDataUrl ? (
        <img src={qrDataUrl} alt="QR" className="rounded-md" style={{ width: size * 0.45, height: size * 0.45, background: "#fff", padding: 4 }} />
      ) : (
        <div className="rounded-md bg-white/70" style={{ width: size * 0.45, height: size * 0.45 }} />
      )}

      <div className="text-center leading-tight w-full">
        <div className="text-[11px] font-semibold" style={{ color: template.accent }}>SCANNEZ POUR DONNER VOTRE AVIS</div>
        <div className="text-[13px] font-bold truncate mt-0.5" style={{ color: template.titleColor }}>{businessName || "Votre établissement"}</div>
        <div className="text-[10px] truncate" style={{ color: template.subColor, opacity: 0.8 }}>{websiteOrPlaceLabel}</div>
      </div>
    </div>
  );
}

export default function BoutiqueQRImprime() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [businessId, setBusinessId] = useState<string>("");
  const [editName, setEditName] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [template, setTemplate] = useState<TemplateId>("classic");
  const [qrPreview, setQrPreview] = useState<string>("");
  const [shipping, setShipping] = useState({
    full_name: "", line1: "", line2: "", city: "", postal_code: "", country: "FR", phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data: bs } = await supabase.from("businesses")
        .select("id, name, address, google_place_id, website").eq("user_id", user.id);
      setBusinesses(bs || []);
      if (bs && bs[0]) {
        setBusinessId(bs[0].id);
        setEditName(bs[0].name || "");
        setEditWebsite(bs[0].website || "");
      }
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      if (profile?.full_name) setShipping((s) => ({ ...s, full_name: profile.full_name! }));
    })();
  }, [navigate]);

  // Sync edit fields when switching business
  useEffect(() => {
    const b = businesses.find((x) => x.id === businessId);
    if (b) {
      setEditName(b.name || "");
      setEditWebsite(b.website || "");
    }
  }, [businessId, businesses]);

  const business = businesses.find((b) => b.id === businessId);

  const reviewUrl = useMemo(() => {
    if (!business) return "";
    return business.google_place_id
      ? `https://search.google.com/local/writereview?placeid=${business.google_place_id}`
      : `https://starlinko.app/r/${business.id}`;
  }, [business]);

  useEffect(() => {
    if (!reviewUrl) { setQrPreview(""); return; }
    QRCode.toDataURL(reviewUrl, { width: 400, margin: 1, errorCorrectionLevel: "H", color: { dark: "#000", light: "#fff" } })
      .then(setQrPreview).catch(() => setQrPreview(""));
  }, [reviewUrl]);

  const websiteLabel = useMemo(() => {
    const raw = editWebsite || business?.website || "";
    return raw.replace(/^https?:\/\//, "").replace(/\/$/, "").slice(0, 40) || "Avis Google";
  }, [editWebsite, business]);

  const tpl = TEMPLATES.find((t) => t.id === template)!;
  const missingInfo = !editName || !editWebsite;

  const persistMissingInfo = async () => {
    if (!business) return;
    const patch: any = {};
    if (editName && editName !== business.name) patch.name = editName;
    if (editWebsite && editWebsite !== business.website) patch.website = editWebsite;
    if (Object.keys(patch).length) {
      await supabase.from("businesses").update(patch).eq("id", business.id);
    }
  };

  const submit = async () => {
    setLoading(true);
    try {
      await persistMissingInfo();
      const { data, error } = await supabase.functions.invoke("create-printed-qr-order", {
        body: { business_id: businessId, design: template, shipping },
      });
      if (error || data?.error) {
        toast.error(data?.error || error?.message || "Erreur");
        return;
      }
      setDone(true);
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="container max-w-xl mx-auto py-10 px-4 text-center">
        <CheckCircle2 className="w-20 h-20 text-emerald-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Commande confirmée 🎉</h1>
        <p className="text-muted-foreground mb-6">
          Votre QR code imprimé sera expédié sous 5–7 jours ouvrés. Vous recevrez un email avec le numéro de suivi.
        </p>
        <Button onClick={() => navigate("/commandes")} className="bg-emerald-600 hover:bg-emerald-700">
          Voir mes commandes
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      <Button variant="ghost" onClick={() => navigate("/boutique")} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Boutique
      </Button>

      <Card className="p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-2">
          <Gift className="w-8 h-8 text-amber-500" />
          <h1 className="text-2xl font-bold">QR code adhésif imprimé — Gratuit</h1>
        </div>
        <div className="flex gap-2 mb-5">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full ${s <= step ? "bg-emerald-500" : "bg-muted"}`} />
          ))}
        </div>

        {/* STEP 1 — Business + missing info */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><QrCode className="w-5 h-5" /> Étape 1 — Établissement</h2>
            {businesses.length === 0 ? (
              <p className="text-muted-foreground">Aucun établissement. <a className="underline" href="/businesses">En ajouter un</a>.</p>
            ) : (
              <>
                <Label>Choisissez l'établissement</Label>
                <Select value={businessId} onValueChange={setBusinessId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
                  <SelectContent>
                    {businesses.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>

                {missingInfo && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-3">
                    <p className="text-sm text-amber-800 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Informations manquantes dans votre fiche GMB — complétez pour un rendu parfait.
                    </p>
                    <div>
                      <Label>Nom à afficher</Label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Ex : Le Cœur de Paris" />
                    </div>
                    <div>
                      <Label>Site / lien (optionnel)</Label>
                      <Input value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} placeholder="https://votre-site.com" />
                    </div>
                  </div>
                )}
              </>
            )}
            <Button onClick={() => setStep(2)} disabled={!businessId || !editName} className="w-full bg-emerald-600 hover:bg-emerald-700">
              Choisir un template <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* STEP 2 — Template selection */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-semibold flex items-center gap-2"><Sparkles className="w-5 h-5" /> Étape 2 — Choisissez votre template</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TEMPLATES.map((t) => (
                <button key={t.id} type="button" onClick={() => setTemplate(t.id)}
                  className={`p-2 rounded-xl transition-all ${template === t.id ? "ring-4 ring-emerald-400" : "ring-1 ring-border hover:ring-emerald-200"}`}>
                  <PlaquePreview template={t} businessName={editName} websiteOrPlaceLabel={websiteLabel} qrDataUrl={qrPreview} size={140} />
                  <p className="text-xs mt-2 text-center font-medium">{t.label}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Retour</Button>
              <Button onClick={() => setStep(3)} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                Voir l'aperçu <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 — Final preview */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-semibold flex items-center gap-2"><Eye className="w-5 h-5" /> Étape 3 — Aperçu de votre QR imprimé</h2>
            <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-6">
              <PlaquePreview template={tpl} businessName={editName} websiteOrPlaceLabel={websiteLabel} qrDataUrl={qrPreview} size={320} />
            </div>
            <div className="text-center text-xs text-muted-foreground">
              Aperçu réel · imprimé en haute qualité · adhésif prêt à coller
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Changer de template</Button>
              <Button onClick={() => setStep(4)} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                Valider et livrer <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4 — Shipping */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><MapPin className="w-5 h-5" /> Étape 4 — Adresse de livraison</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Nom complet</Label><Input value={shipping.full_name} onChange={(e) => setShipping({ ...shipping, full_name: e.target.value })} /></div>
              <div className="col-span-2"><Label>Adresse</Label><Input value={shipping.line1} onChange={(e) => setShipping({ ...shipping, line1: e.target.value })} /></div>
              <div className="col-span-2"><Label>Complément (optionnel)</Label><Input value={shipping.line2} onChange={(e) => setShipping({ ...shipping, line2: e.target.value })} /></div>
              <div><Label>Code postal</Label><Input value={shipping.postal_code} onChange={(e) => setShipping({ ...shipping, postal_code: e.target.value })} /></div>
              <div><Label>Ville</Label><Input value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} /></div>
              <div className="col-span-2">
                <Label>Pays</Label>
                <Select value={shipping.country} onValueChange={(v) => setShipping({ ...shipping, country: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Téléphone (optionnel)</Label><Input value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} /></div>
            </div>

            <Card className="p-4 bg-emerald-50 border-emerald-200">
              <p className="text-sm"><strong>Établissement :</strong> {editName}</p>
              <p className="text-sm"><strong>Template :</strong> {tpl.label}</p>
              <p className="text-sm mt-2 text-emerald-700 font-semibold">Prix : Gratuit · Frais de port offerts</p>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">Retour</Button>
              <Button onClick={submit}
                disabled={loading || !shipping.full_name || !shipping.line1 || !shipping.city || !shipping.postal_code}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Confirmer la commande
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
