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
import { useTranslation } from "react-i18next";
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
const TEMPLATES: {
  id: TemplateId; label: string;
  topBg: string; bottomBg: string;
  titleColor: string; scanColor: string; footerColor: string;
  starColor: string;
}[] = [
  { id: "classic", label: "Classique lavande", topBg: "#ffffff", bottomBg: "#cdd3e6", titleColor: "#0a0a0a", scanColor: "#1f2a44", footerColor: "#1f2a44", starColor: "#f5b301" },
  { id: "emerald", label: "Vert émeraude",     topBg: "#ffffff", bottomBg: "#c7ecd9", titleColor: "#0a0a0a", scanColor: "#065f46", footerColor: "#065f46", starColor: "#f5b301" },
  { id: "gold",    label: "Noir & Or",         topBg: "#0a0a0a", bottomBg: "#1a1208", titleColor: "#f5d97f", scanColor: "#f5d97f", footerColor: "#f5d97f", starColor: "#f5d97f" },
  { id: "dark",    label: "Élégant noir",      topBg: "#0f172a", bottomBg: "#1e293b", titleColor: "#ffffff", scanColor: "#e2e8f0", footerColor: "#94a3b8", starColor: "#f5b301" },
];

/** Google "G" logo. */
function GoogleLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size * 3.3} height={size} viewBox="0 0 272 92" aria-hidden xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
      <path fill="#EA4335" d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"/>
      <path fill="#FBBC05" d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z"/>
      <path fill="#34A853" d="M225 3v65h-9.5V3h9.5z"/>
      <path fill="#EA4335" d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z"/>
      <path fill="#4285F4" d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z"/>
    </svg>
  );
}

/** Live preview of the plaque — Plakode deluxe style with bevelled corners. */
function PlaquePreview({
  template, businessName, websiteOrPlaceLabel, qrDataUrl, size = 320,
}: { template: typeof TEMPLATES[number]; businessName: string; websiteOrPlaceLabel: string; qrDataUrl: string; size?: number }) {
  const isDark = template.id === "dark" || template.id === "gold";
  return (
    <div
      className="mx-auto overflow-hidden flex flex-col"
      style={{
        width: size, height: size,
        borderRadius: size * 0.08,
        background: template.topBg,
        boxShadow: isDark
          ? `inset 0 1px 2px rgba(255,255,255,0.15), 0 12px 30px -10px rgba(0,0,0,0.5)`
          : `inset 0 1px 2px rgba(255,255,255,0.9), 0 12px 30px -10px rgba(15,23,42,0.25)`,
      }}
    >
      {/* TOP — title + Google + stars */}
      <div className="flex-1 flex flex-col items-center justify-center px-3 pt-3 pb-1" style={{ background: template.topBg }}>
        <div className="font-extrabold tracking-wide text-center uppercase"
             style={{ color: template.titleColor, fontSize: size * 0.058, letterSpacing: size * 0.002 }}>
          Votre avis nous intéresse
        </div>
        <div className="mt-1.5">
          <GoogleLogo size={size * 0.13} />
        </div>
        <div className="flex gap-0.5 mt-1.5">
          {[...Array(5)].map((_, i) => (
            <svg key={i} width={size * 0.072} height={size * 0.072} viewBox="0 0 24 24" fill={template.starColor} stroke="#e0a800" strokeWidth="1">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          ))}
        </div>
      </div>

      {/* BOTTOM — colored band with SCAN text + QR + footer */}
      <div className="flex flex-col items-center justify-between pt-2 pb-1.5 px-3"
           style={{ background: template.bottomBg, height: size * 0.46 }}>
        <div className="text-center font-bold uppercase leading-tight"
             style={{ color: template.scanColor, fontSize: size * 0.04, letterSpacing: 0.5 }}>
          Scannez<br />le QR code
        </div>
        {qrDataUrl ? (
          <img src={qrDataUrl} alt="QR" className="rounded-md"
               style={{ width: size * 0.28, height: size * 0.28, background: "#fff", padding: size * 0.012 }} />
        ) : (
          <div className="rounded-md bg-white/70" style={{ width: size * 0.28, height: size * 0.28 }} />
        )}
        <div className="text-center w-full" style={{ color: template.footerColor, fontSize: size * 0.028, opacity: 0.85 }}>
          <div className="font-bold truncate">{businessName || "Votre établissement"}</div>
          <div className="truncate" style={{ opacity: 0.7 }}>{websiteOrPlaceLabel}</div>
        </div>
      </div>
    </div>
  );
}

export default function BoutiqueQRImprime() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const en = i18n.language?.startsWith("en");
  const T = en ? {
    back: "Shop", title: "Printed adhesive QR — Free",
    step1: "Step 1 — Business", noBiz: "No business yet.", addBiz: "Add one",
    chooseBiz: "Choose the business", select: "Select",
    missing: "Missing info in your GMB listing — complete for a perfect render.",
    displayName: "Display name", site: "Website / link (optional)",
    chooseTpl: "Choose a template", back2: "Back",
    step2: "Step 2 — Choose your template", seePreview: "See preview",
    step3: "Step 3 — Preview of your printed QR",
    previewNote: "True-to-life preview · printed in high quality · adhesive ready to stick",
    changeTpl: "Change template", validate: "Validate & ship",
    step4: "Step 4 — Shipping address",
    fullName: "Full name", address: "Address", line2: "Complement (optional)",
    postal: "Postal code", city: "City", country: "Country", phone: "Phone (optional)",
    biz: "Business", tpl: "Template", price: "Price: Free · Free shipping",
    confirm: "Confirm order", err: "Error",
    doneTitle: "Order confirmed 🎉",
    doneDesc: "Your printed QR will be shipped within 5–7 business days. You will receive an email with the tracking number.",
    seeOrders: "See my orders",
    plaqueTitle: "We value your review", scan: "Scan\nthe QR code", defaultBiz: "Your business", defaultLink: "Google Reviews",
  } : {
    back: "Boutique", title: "QR code adhésif imprimé — Gratuit",
    step1: "Étape 1 — Établissement", noBiz: "Aucun établissement.", addBiz: "En ajouter un",
    chooseBiz: "Choisissez l'établissement", select: "Sélectionnez",
    missing: "Informations manquantes dans votre fiche GMB — complétez pour un rendu parfait.",
    displayName: "Nom à afficher", site: "Site / lien (optionnel)",
    chooseTpl: "Choisir un template", back2: "Retour",
    step2: "Étape 2 — Choisissez votre template", seePreview: "Voir l'aperçu",
    step3: "Étape 3 — Aperçu de votre QR imprimé",
    previewNote: "Aperçu réel · imprimé en haute qualité · adhésif prêt à coller",
    changeTpl: "Changer de template", validate: "Valider et livrer",
    step4: "Étape 4 — Adresse de livraison",
    fullName: "Nom complet", address: "Adresse", line2: "Complément (optionnel)",
    postal: "Code postal", city: "Ville", country: "Pays", phone: "Téléphone (optionnel)",
    biz: "Établissement", tpl: "Template", price: "Prix : Gratuit · Frais de port offerts",
    confirm: "Confirmer la commande", err: "Erreur",
    doneTitle: "Commande confirmée 🎉",
    doneDesc: "Votre QR code imprimé sera expédié sous 5–7 jours ouvrés. Vous recevrez un email avec le numéro de suivi.",
    seeOrders: "Voir mes commandes",
    plaqueTitle: "Votre avis nous intéresse", scan: "Scannez\nle QR code", defaultBiz: "Votre établissement", defaultLink: "Avis Google",
  };
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
    return raw.replace(/^https?:\/\//, "").replace(/\/$/, "").slice(0, 40) || T.defaultLink;
  }, [editWebsite, business, T.defaultLink]);

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
        toast.error(data?.error || error?.message || T.err);
        return;
      }
      setDone(true);
    } catch (e: any) {
      toast.error(e.message || T.err);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="container max-w-xl mx-auto py-10 px-4 text-center">
        <CheckCircle2 className="w-20 h-20 text-emerald-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">{T.doneTitle}</h1>
        <p className="text-muted-foreground mb-6">{T.doneDesc}</p>
        <Button onClick={() => navigate("/commandes")} className="bg-emerald-600 hover:bg-emerald-700">
          {T.seeOrders}
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4">
      <Button variant="ghost" onClick={() => navigate("/boutique")} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> {T.back}
      </Button>

      <Card className="p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-2">
          <Gift className="w-8 h-8 text-amber-500" />
          <h1 className="text-2xl font-bold">{T.title}</h1>
        </div>
        <div className="flex gap-2 mb-5">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full ${s <= step ? "bg-emerald-500" : "bg-muted"}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><QrCode className="w-5 h-5" /> {T.step1}</h2>
            {businesses.length === 0 ? (
              <p className="text-muted-foreground">{T.noBiz} <a className="underline" href="/businesses">{T.addBiz}</a>.</p>
            ) : (
              <>
                <Label>{T.chooseBiz}</Label>
                <Select value={businessId} onValueChange={setBusinessId}>
                  <SelectTrigger><SelectValue placeholder={T.select} /></SelectTrigger>
                  <SelectContent>
                    {businesses.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>

                {missingInfo && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-3">
                    <p className="text-sm text-amber-800 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> {T.missing}
                    </p>
                    <div>
                      <Label>{T.displayName}</Label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </div>
                    <div>
                      <Label>{T.site}</Label>
                      <Input value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} placeholder="https://…" />
                    </div>
                  </div>
                )}
              </>
            )}
            <Button onClick={() => setStep(2)} disabled={!businessId || !editName} className="w-full bg-emerald-600 hover:bg-emerald-700">
              {T.chooseTpl} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-semibold flex items-center gap-2"><Sparkles className="w-5 h-5" /> {T.step2}</h2>
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
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">{T.back2}</Button>
              <Button onClick={() => setStep(3)} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                {T.seePreview} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-semibold flex items-center gap-2"><Eye className="w-5 h-5" /> {T.step3}</h2>
            <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-6">
              <PlaquePreview template={tpl} businessName={editName} websiteOrPlaceLabel={websiteLabel} qrDataUrl={qrPreview} size={320} />
            </div>
            <div className="text-center text-xs text-muted-foreground">{T.previewNote}</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">{T.changeTpl}</Button>
              <Button onClick={() => setStep(4)} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                {T.validate} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><MapPin className="w-5 h-5" /> {T.step4}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>{T.fullName}</Label><Input value={shipping.full_name} onChange={(e) => setShipping({ ...shipping, full_name: e.target.value })} /></div>
              <div className="col-span-2"><Label>{T.address}</Label><Input value={shipping.line1} onChange={(e) => setShipping({ ...shipping, line1: e.target.value })} /></div>
              <div className="col-span-2"><Label>{T.line2}</Label><Input value={shipping.line2} onChange={(e) => setShipping({ ...shipping, line2: e.target.value })} /></div>
              <div><Label>{T.postal}</Label><Input value={shipping.postal_code} onChange={(e) => setShipping({ ...shipping, postal_code: e.target.value })} /></div>
              <div><Label>{T.city}</Label><Input value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} /></div>
              <div className="col-span-2">
                <Label>{T.country}</Label>
                <Select value={shipping.country} onValueChange={(v) => setShipping({ ...shipping, country: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>{T.phone}</Label><Input value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} /></div>
            </div>

            <Card className="p-4 bg-emerald-50 border-emerald-200">
              <p className="text-sm"><strong>{T.biz} :</strong> {editName}</p>
              <p className="text-sm"><strong>{T.tpl} :</strong> {tpl.label}</p>
              <p className="text-sm mt-2 text-emerald-700 font-semibold">{T.price}</p>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">{T.back2}</Button>
              <Button onClick={submit}
                disabled={loading || !shipping.full_name || !shipping.line1 || !shipping.city || !shipping.postal_code}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{T.confirm}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
