import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, CheckCircle2, Truck, Clock, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "En attente de paiement", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  paid: { label: "Payé — préparation", color: "bg-blue-100 text-blue-700", icon: Package },
  shipped: { label: "Expédié", color: "bg-indigo-100 text-indigo-700", icon: Truck },
  delivered: { label: "Livré", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  failed: { label: "Échec paiement", color: "bg-red-100 text-red-700", icon: Clock },
};

export default function Commandes() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.get("success")) toast.success("Paiement réussi ! Commande enregistrée.");
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data } = await supabase.from("orders")
        .select("*, order_items(*)")
        .eq("user_id", user.id)
        .in("order_type", ["nfc_card", "printed_qr_free"])
        .order("created_at", { ascending: false });
      setOrders(data || []);
      setLoading(false);
    })();
  }, [navigate, params]);

  return (
    <div className="container max-w-3xl mx-auto py-6 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-7 h-7 text-emerald-600" />
        <h1 className="text-2xl font-bold">Mes commandes</h1>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : orders.length === 0 ? (
        <Card className="p-8 text-center rounded-2xl">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">Aucune commande pour le moment.</p>
          <Button onClick={() => navigate("/boutique")} className="bg-emerald-600 hover:bg-emerald-700">
            Voir la boutique
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const s = STATUS_MAP[o.status] || STATUS_MAP.pending;
            const Icon = s.icon;
            return (
              <Card key={o.id} className="p-5 rounded-2xl">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={s.color}><Icon className="w-3 h-3 mr-1" />{s.label}</Badge>
                      <span className="text-xs text-muted-foreground">#{o.id.slice(0, 8)}</span>
                    </div>
                    <p className="font-semibold">
                      {o.order_type === "nfc_card" ? "Carte NFC Starlinko" : "QR code adhésif imprimé"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("fr-FR", { dateStyle: "long" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{Number(o.amount).toFixed(2)} {o.currency?.toUpperCase()}</p>
                    {Number(o.shipping_cost) > 0 && (
                      <p className="text-xs text-muted-foreground">+ {Number(o.shipping_cost).toFixed(2)} € livraison</p>
                    )}
                  </div>
                </div>
                {o.order_items?.[0] && (
                  <p className="text-sm text-muted-foreground">
                    {o.order_items[0].product_name} × {o.order_items[0].quantity}
                  </p>
                )}
                {o.shipping_address && (
                  <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                    📍 {o.shipping_address.full_name} — {o.shipping_address.line1}, {o.shipping_address.postal_code} {o.shipping_address.city} ({o.shipping_address.country})
                  </p>
                )}
                {o.tracking_number && (
                  <p className="text-xs text-emerald-700 font-semibold mt-2">
                    📦 Suivi : {o.tracking_number}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Button variant="ghost" onClick={() => navigate(-1)} className="mt-6">
        <ArrowLeft className="w-4 h-4 mr-2" /> Retour
      </Button>
    </div>
  );
}
