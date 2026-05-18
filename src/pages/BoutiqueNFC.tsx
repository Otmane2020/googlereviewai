import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShoppingCart, Smartphone, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import plaqueFront from "@/assets/nfc-plaque-front.jpg";

export default function BoutiqueNFC() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const en = i18n.language?.startsWith("en");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const T = en ? {
    back: "Shop", title: "NFC plaque + Google Review QR", qty: "Quantity",
    unit: "Unit price", q: "Quantity", ship: "Shipping", shipCalc: "Calculated at checkout",
    subtotal: "Subtotal", login: "Please sign in", error: "Error",
    info: "🇫🇷 France: 3.99 € · 🇪🇺 Europe: 6.99–9.99 € · 🌍 International: 14.99–19.99 €",
    info2: "Shipping address and exact method are selected on the next step (secure Stripe Checkout).",
    pay: "Pay", excl: "(excl. shipping)",
  } : {
    back: "Boutique", title: "Plaque NFC + QR Google Avis", qty: "Quantité",
    unit: "Prix unitaire", q: "Quantité", ship: "Livraison", shipCalc: "Calculée au paiement",
    subtotal: "Sous-total", login: "Veuillez vous connecter", error: "Erreur",
    info: "🇫🇷 Livraison France: 3,99 € · 🇪🇺 Europe: 6,99–9,99 € · 🌍 International: 14,99–19,99 €",
    info2: "L'adresse de livraison et le mode d'expédition exact sont sélectionnés à l'étape suivante (Stripe Checkout sécurisé).",
    pay: "Payer", excl: "(hors livraison)",
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error(T.login);
        navigate("/auth");
        return;
      }
      const { data, error } = await supabase.functions.invoke("create-nfc-checkout", {
        body: { quantity },
      });
      if (error || !data?.url) {
        toast.error(data?.error || error?.message || T.error);
        return;
      }
      window.location.href = data.url;
    } catch (e: any) {
      toast.error(e.message || T.error);
    } finally {
      setLoading(false);
    }
  };

  const unit = 19.99;
  const total = (unit * quantity).toFixed(2);

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4">
      <Button variant="ghost" onClick={() => navigate("/boutique")} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> {T.back}
      </Button>

      <Card className="p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-5">
          <Smartphone className="w-8 h-8 text-emerald-600" />
          <h1 className="text-2xl font-bold">{T.title}</h1>
        </div>

        <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl mb-5 overflow-hidden">
          <img src={plaqueFront} alt={T.title} className="w-full h-full object-contain" />
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="qty">{T.qty}</Label>
            <div className="flex items-center gap-3 mt-2">
              <Button type="button" variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</Button>
              <Input id="qty" type="number" min={1} max={50} value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(50, parseInt(e.target.value || "1"))))}
                className="w-24 text-center" />
              <Button type="button" variant="outline" size="icon" onClick={() => setQuantity(Math.min(50, quantity + 1))}>+</Button>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>{T.unit}</span><span>19,99 €</span></div>
            <div className="flex justify-between"><span>{T.q}</span><span>× {quantity}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>{T.ship}</span><span>{T.shipCalc}</span></div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>{T.subtotal}</span><span>{total} €</span></div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg">
            {T.info}<br />
            {T.info2}
          </div>

          <Button onClick={handleCheckout} disabled={loading} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-base">
            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <ShoppingCart className="w-5 h-5 mr-2" />}
            {T.pay} {total} € {T.excl}
          </Button>
        </div>
      </Card>
    </div>
  );
}
