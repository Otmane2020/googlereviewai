import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Sparkles, Truck, QrCode, Smartphone, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import plaqueFront from "@/assets/nfc-plaque-front.jpg";
import qrStickerVitrine from "@/assets/qr-sticker-vitrine.png";

export default function Boutique() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const en = i18n.language?.startsWith("en");
  const [hasFreeQR, setHasFreeQR] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: existing } = await supabase
        .from("orders").select("id").eq("user_id", user.id).eq("order_type", "printed_qr_free").maybeSingle();
      setHasFreeQR(!!existing);
    })();
  }, []);

  const T = en ? {
    title: "GoogleReviewAI Shop", subtitle: "Physical tools to collect more Google reviews",
    flagship: "Flagship product", order: "Order",
    nfcTitle: "NFC plaque + Google Review QR code",
    nfcDesc1: "Premium 12×12 cm plaque to place on your counter or wall. Your customers ",
    tapNfc: "tap their phone (NFC)", or: " or ", scanQr: "scan the QR code", arrive: " — and land straight on your Google review form.",
    nfcF1: "Dual access: NFC + dynamic QR code",
    nfcF2: "Link editable anytime from GoogleReviewAI",
    nfcF3: "France shipping 3.99 € — International available",
    nfcF4: "3 designs (white, black, green)",
    freeBadge: "Free for everyone — limited time",
    free: "Free", qrAdh: "Printed adhesive QR code",
    qrDesc: "Adhesive sticker ready to stick on your counter, window or menu. We print it and ship it to you for free.",
    qrF1: "1 free copy per account", qrF2: "Free shipping", qrF3: "Points directly to your Google reviews",
    already: "Already ordered", orderFree: "Order my free QR",
    footer: "France & International shipping. Secure payment by Stripe.",
  } : {
    title: "Boutique GoogleReviewAI", subtitle: "Outils physiques pour collecter plus d'avis Google",
    flagship: "Produit phare", order: "Commander",
    nfcTitle: "Plaque NFC + QR code Google Avis",
    nfcDesc1: "Plaque premium 12×12 cm à poser sur votre comptoir ou coller au mur. Vos clients ",
    tapNfc: "tapent leur téléphone (NFC)", or: " ou ", scanQr: "scannent le QR code", arrive: " — et arrivent directement sur votre fiche d'avis Google.",
    nfcF1: "Double accès : NFC + QR code dynamique",
    nfcF2: "Lien modifiable à tout moment depuis GoogleReviewAI",
    nfcF3: "Livraison France 3,99 € — International dispo",
    nfcF4: "3 designs au choix (blanc, noir, vert)",
    freeBadge: "Gratuit pour tous — durée limitée",
    free: "Gratuit", qrAdh: "QR code adhésif imprimé",
    qrDesc: "Adhésif prêt à coller sur votre comptoir, vitrine ou menu. On l'imprime et on vous l'envoie gratuitement.",
    qrF1: "1 exemplaire offert par compte", qrF2: "Frais de port offerts", qrF3: "Pointe directement vers vos avis Google",
    already: "Déjà commandé", orderFree: "Commander mon QR gratuit",
    footer: "Livraison France & International. Paiement sécurisé par Stripe.",
  };

  return (
    <div className="container max-w-5xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <ShoppingBag className="w-7 h-7 text-emerald-600" />
        <div>
          <h1 className="text-2xl font-bold">{T.title}</h1>
          <p className="text-sm text-muted-foreground">{T.subtitle}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Card className="p-6 rounded-2xl border-2 hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between mb-3">
            <Badge className="bg-emerald-100 text-emerald-700">{T.flagship}</Badge>
            <span className="text-2xl font-bold">19,99 €</span>
          </div>
          <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl mb-4 overflow-hidden">
            <img src={plaqueFront} alt={T.nfcTitle} className="w-full h-full object-contain" />
          </div>
          <h2 className="text-xl font-bold mb-2">{T.nfcTitle}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {T.nfcDesc1}<strong>{T.tapNfc}</strong>{T.or}<strong>{T.scanQr}</strong>{T.arrive}
          </p>
          <ul className="space-y-1.5 text-sm mb-5">
            <li className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-emerald-600" /> {T.nfcF1}</li>
            <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-emerald-600" /> {T.nfcF2}</li>
            <li className="flex items-center gap-2"><Truck className="w-4 h-4 text-emerald-600" /> {T.nfcF3}</li>
            <li className="flex items-center gap-2"><QrCode className="w-4 h-4 text-emerald-600" /> {T.nfcF4}</li>
          </ul>
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate("/boutique/nfc")}>
            {T.order}
          </Button>
        </Card>

        <Card className="p-6 rounded-2xl border-2 border-amber-300 bg-amber-50/30">
          <div className="flex items-center justify-between mb-3">
            <Badge className="bg-amber-100 text-amber-700">{T.freeBadge}</Badge>
            <span className="text-2xl font-bold text-emerald-600">{T.free}</span>
          </div>
          <div className="aspect-video rounded-xl mb-4 overflow-hidden bg-slate-100">
            <img src={qrStickerVitrine} alt={T.qrAdh} className="w-full h-full object-cover" />
          </div>
          <h2 className="text-xl font-bold mb-2">{T.qrAdh}</h2>
          <p className="text-sm text-muted-foreground mb-4">{T.qrDesc}</p>
          <ul className="space-y-1.5 text-sm mb-5">
            <li className="flex items-center gap-2"><Gift className="w-4 h-4 text-amber-600" /> {T.qrF1}</li>
            <li className="flex items-center gap-2"><Truck className="w-4 h-4 text-amber-600" /> {T.qrF2}</li>
            <li className="flex items-center gap-2"><QrCode className="w-4 h-4 text-amber-600" /> {T.qrF3}</li>
          </ul>
          {hasFreeQR ? (
            <Button className="w-full" variant="outline" disabled>{T.already}</Button>
          ) : (
            <Button className="w-full bg-amber-500 hover:bg-amber-600" onClick={() => navigate("/boutique/qr-imprime")}>
              {T.orderFree}
            </Button>
          )}
        </Card>
      </div>

      <div className="text-center text-xs text-muted-foreground pt-2">{T.footer}</div>
    </div>
  );
}
