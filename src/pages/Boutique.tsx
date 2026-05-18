import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Sparkles, Truck, QrCode, Smartphone, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import plaqueFront from "@/assets/nfc-plaque-front.jpg";
import plaqueDesigns from "@/assets/nfc-plaque-designs.jpg";

const PAID_PLANS_KEYWORDS = ["quotidien", "agence", "pro", "business"];

export default function Boutique() {
  const navigate = useNavigate();
  const [planName, setPlanName] = useState<string>("");
  const [hasFreeQR, setHasFreeQR] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("plan_name").eq("id", user.id).maybeSingle();
      setPlanName(profile?.plan_name || "");
      const { data: existing } = await supabase
        .from("orders").select("id").eq("user_id", user.id).eq("order_type", "printed_qr_free").maybeSingle();
      setHasFreeQR(!!existing);
    })();
  }, []);

  const isPaid = PAID_PLANS_KEYWORDS.some((k) => planName.toLowerCase().includes(k));

  return (
    <div className="container max-w-5xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <ShoppingBag className="w-7 h-7 text-emerald-600" />
        <div>
          <h1 className="text-2xl font-bold">Boutique Starlinko</h1>
          <p className="text-sm text-muted-foreground">Outils physiques pour collecter plus d'avis Google</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* NFC Card */}
        <Card className="p-6 rounded-2xl border-2 hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between mb-3">
            <Badge className="bg-emerald-100 text-emerald-700">Produit phare</Badge>
            <span className="text-2xl font-bold">19,99 €</span>
          </div>
          <div className="aspect-video bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl mb-4 flex items-center justify-center">
            <CreditCard className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">Carte NFC personnalisée</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Carte au format CB, votre client la tape avec son téléphone et arrive directement sur la page d'avis Google.
          </p>
          <ul className="space-y-1.5 text-sm mb-5">
            <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-emerald-600" /> Personnalisée à votre établissement</li>
            <li className="flex items-center gap-2"><Truck className="w-4 h-4 text-emerald-600" /> Livraison France 3,99 € — International dispo</li>
            <li className="flex items-center gap-2"><QrCode className="w-4 h-4 text-emerald-600" /> QR code également imprimé au dos</li>
          </ul>
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate("/boutique/nfc")}>
            Commander
          </Button>
        </Card>

        {/* Printed QR free */}
        <Card className={`p-6 rounded-2xl border-2 ${isPaid ? "border-amber-300 bg-amber-50/30" : "opacity-90"}`}>
          <div className="flex items-center justify-between mb-3">
            <Badge className="bg-amber-100 text-amber-700">{isPaid ? "Inclus dans votre plan" : "Réservé plans payants"}</Badge>
            <span className="text-2xl font-bold text-emerald-600">Gratuit</span>
          </div>
          <div className="aspect-video bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl mb-4 flex items-center justify-center">
            <Gift className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">QR code adhésif imprimé</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Adhésif prêt à coller sur votre comptoir, vitrine ou menu. On l'imprime et on vous l'envoie gratuitement.
          </p>
          <ul className="space-y-1.5 text-sm mb-5">
            <li className="flex items-center gap-2"><Gift className="w-4 h-4 text-amber-600" /> 1 exemplaire offert par compte payant</li>
            <li className="flex items-center gap-2"><Truck className="w-4 h-4 text-amber-600" /> Frais de port offerts</li>
            <li className="flex items-center gap-2"><QrCode className="w-4 h-4 text-amber-600" /> Pointe directement vers vos avis Google</li>
          </ul>
          {hasFreeQR ? (
            <Button className="w-full" variant="outline" disabled>Déjà commandé</Button>
          ) : isPaid ? (
            <Button className="w-full bg-amber-500 hover:bg-amber-600" onClick={() => navigate("/boutique/qr-imprime")}>
              Commander mon QR gratuit
            </Button>
          ) : (
            <Button className="w-full" variant="outline" asChild>
              <Link to="/select-plan">Passer à un plan payant</Link>
            </Button>
          )}
        </Card>
      </div>

      <div className="text-center text-xs text-muted-foreground pt-2">
        Livraison France & International. Paiement sécurisé par Stripe.
      </div>
    </div>
  );
}
