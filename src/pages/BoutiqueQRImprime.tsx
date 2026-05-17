import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Loader2, Gift, QrCode, MapPin, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import QRCode from "qrcode";

const COUNTRIES = [
  { code: "FR", name: "France" },
  { code: "BE", name: "Belgique" },
  { code: "LU", name: "Luxembourg" },
  { code: "CH", name: "Suisse" },
  { code: "DE", name: "Allemagne" },
  { code: "ES", name: "Espagne" },
  { code: "IT", name: "Italie" },
  { code: "GB", name: "Royaume-Uni" },
  { code: "US", name: "USA" },
  { code: "CA", name: "Canada" },
  { code: "NL", name: "Pays-Bas" },
  { code: "PT", name: "Portugal" },
  { code: "MA", name: "Maroc" },
  { code: "TN", name: "Tunisie" },
  { code: "DZ", name: "Algérie" },
  { code: "SN", name: "Sénégal" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "AE", name: "Émirats arabes unis" },
];

const DESIGNS = [
  { id: "classic", label: "Classique blanc", bg: "bg-white border-2 border-gray-300", fg: "#0f766e" },
  { id: "dark", label: "Élégant noir", bg: "bg-gray-900 text-white", fg: "#10b981" },
  { id: "minimal", label: "Minimaliste émeraude", bg: "bg-emerald-50 border-2 border-emerald-300", fg: "#059669" },
];

export default function BoutiqueQRImprime() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [businessId, setBusinessId] = useState<string>("");
  const [design, setDesign] = useState("classic");
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
      const { data: bs } = await supabase.from("businesses").select("id, name, address, google_place_id").eq("user_id", user.id);
      setBusinesses(bs || []);
      if (bs && bs[0]) setBusinessId(bs[0].id);
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      if (profile?.full_name) setShipping((s) => ({ ...s, full_name: profile.full_name! }));
    })();
  }, [navigate]);

  useEffect(() => {
    const b = businesses.find((x) => x.id === businessId);
    if (!b) { setQrPreview(""); return; }
    const url = b.google_place_id
      ? `https://search.google.com/local/writereview?placeid=${b.google_place_id}`
      : `https://starlinko.app/r/${b.id}`;
    QRCode.toDataURL(url, { width: 300, margin: 1, color: { dark: "#000", light: "#fff" } })
      .then(setQrPreview).catch(() => setQrPreview(""));
  }, [businessId, businesses]);

  const business = businesses.find((b) => b.id === businessId);

  const submit = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-printed-qr-order", {
        body: { business_id: businessId, design, shipping },
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
          Votre QR code imprimé sera expédié sous 5–7 jours ouvrés à l'adresse indiquée. Vous recevrez un email avec le numéro de suivi.
        </p>
        <Button onClick={() => navigate("/commandes")} className="bg-emerald-600 hover:bg-emerald-700">
          Voir mes commandes
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto py-6 px-4">
      <Button variant="ghost" onClick={() => navigate("/boutique")} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Boutique
      </Button>

      <Card className="p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-2">
          <Gift className="w-8 h-8 text-amber-500" />
          <h1 className="text-2xl font-bold">QR code adhésif imprimé — Gratuit</h1>
        </div>
        <div className="flex gap-2 mb-5">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full ${s <= step ? "bg-emerald-500" : "bg-muted"}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><QrCode className="w-5 h-5" /> Étape 1 — Choisissez l'établissement</h2>
            {businesses.length === 0 ? (
              <p className="text-muted-foreground">Aucun établissement. <a className="underline" href="/businesses">En ajouter un</a>.</p>
            ) : (
              <Select value={businessId} onValueChange={setBusinessId}>
                <SelectTrigger><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
                <SelectContent>
                  {businesses.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            {business && qrPreview && (
              <div className="space-y-3">
                <Label>Design de votre adhésif</Label>
                <div className="grid grid-cols-3 gap-3">
                  {DESIGNS.map((d) => (
                    <button key={d.id} type="button" onClick={() => setDesign(d.id)}
                      className={`p-3 rounded-xl ${d.bg} transition-all ${design === d.id ? "ring-4 ring-emerald-400" : "ring-1 ring-border"}`}>
                      <img src={qrPreview} alt="QR" className="w-full aspect-square object-contain" />
                      <p className="text-[10px] mt-1 font-semibold text-center">{business.name.slice(0, 20)}</p>
                      <p className="text-[10px] mt-2 text-center">{d.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={() => setStep(2)} disabled={!businessId} className="w-full bg-emerald-600 hover:bg-emerald-700">
              Continuer <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold flex items-center gap-2"><MapPin className="w-5 h-5" /> Étape 2 — Adresse de livraison</h2>
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Retour</Button>
              <Button onClick={() => setStep(3)} disabled={!shipping.full_name || !shipping.line1 || !shipping.city || !shipping.postal_code}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700">Continuer <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold">Étape 3 — Récapitulatif</h2>
            <Card className="p-4 bg-muted/30">
              <p className="text-sm"><strong>Établissement :</strong> {business?.name}</p>
              <p className="text-sm"><strong>Design :</strong> {DESIGNS.find((d) => d.id === design)?.label}</p>
              <p className="text-sm mt-2"><strong>Livraison à :</strong></p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {shipping.full_name}{"\n"}{shipping.line1}{shipping.line2 ? `\n${shipping.line2}` : ""}{"\n"}
                {shipping.postal_code} {shipping.city}{"\n"}{COUNTRIES.find((c) => c.code === shipping.country)?.name}
              </p>
              <p className="text-sm mt-3 text-emerald-700 font-semibold">Prix : Gratuit (frais de port offerts)</p>
            </Card>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Retour</Button>
              <Button onClick={submit} disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Confirmer la commande
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
