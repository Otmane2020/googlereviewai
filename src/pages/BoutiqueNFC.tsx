import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ShoppingCart, Smartphone, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import plaqueFront from "@/assets/nfc-plaque-front.jpg";

export default function BoutiqueNFC() {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Veuillez vous connecter");
        navigate("/auth");
        return;
      }
      const { data, error } = await supabase.functions.invoke("create-nfc-checkout", {
        body: { quantity },
      });
      if (error || !data?.url) {
        toast.error(data?.error || error?.message || "Erreur lors du checkout");
        return;
      }
      window.location.href = data.url;
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const unit = 19.99;
  const total = (unit * quantity).toFixed(2);

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4">
      <Button variant="ghost" onClick={() => navigate("/boutique")} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Boutique
      </Button>

      <Card className="p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-5">
          <CreditCard className="w-8 h-8 text-emerald-600" />
          <h1 className="text-2xl font-bold">Carte NFC Starlinko</h1>
        </div>

        <div className="aspect-video bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl mb-5 flex items-center justify-center">
          <CreditCard className="w-24 h-24 text-white" />
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="qty">Quantité</Label>
            <div className="flex items-center gap-3 mt-2">
              <Button type="button" variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</Button>
              <Input id="qty" type="number" min={1} max={50} value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(50, parseInt(e.target.value || "1"))))}
                className="w-24 text-center" />
              <Button type="button" variant="outline" size="icon" onClick={() => setQuantity(Math.min(50, quantity + 1))}>+</Button>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>Prix unitaire</span><span>19,99 €</span></div>
            <div className="flex justify-between"><span>Quantité</span><span>× {quantity}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Livraison</span><span>Calculée au paiement</span></div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>Sous-total</span><span>{total} €</span></div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg">
            🇫🇷 Livraison France: 3,99 € · 🇪🇺 Europe: 6,99–9,99 € · 🌍 International: 14,99–19,99 €<br />
            L'adresse de livraison et le mode d'expédition exact sont sélectionnés à l'étape suivante (Stripe Checkout sécurisé).
          </div>

          <Button onClick={handleCheckout} disabled={loading} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-base">
            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <ShoppingCart className="w-5 h-5 mr-2" />}
            Payer {total} € (hors livraison)
          </Button>
        </div>
      </Card>
    </div>
  );
}
