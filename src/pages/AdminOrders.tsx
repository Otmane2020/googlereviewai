import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, Loader2, Package, RefreshCw, Truck } from "lucide-react";
import { toast } from "sonner";
import { downloadQrLabelPDF } from "@/lib/qrLabelPdf";

const ADMIN_EMAIL = "benyahya.otmane@gmail.com";

export default function AdminOrders() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && (!user || user.email !== ADMIN_EMAIL)) navigate("/");
  }, [user, authLoading, navigate]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("orders")
      .select("*, order_items(*)")
      .in("order_type", ["nfc_card", "printed_qr_free", "shop_product"])
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { if (user?.email === ADMIN_EMAIL) load(); }, [user]);

  const filtered = orders.filter((o) => filter === "all" || o.order_type === filter || o.status === filter);

  const updateStatus = async (id: string, status: string, tracking?: string) => {
    const payload: any = { status, updated_at: new Date().toISOString() };
    if (status === "shipped") payload.shipped_at = new Date().toISOString();
    if (tracking !== undefined) payload.tracking_number = tracking;
    const { error } = await supabase.from("orders").update(payload).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Mis à jour");
    load();
  };

  const downloadPdf = async (o: any) => {
    const url = o.qr_data?.url;
    const name = o.qr_data?.business_name || "Établissement";
    if (!url) { toast.error("Données QR manquantes"); return; }
    try {
      await downloadQrLabelPDF(
        { url, businessName: name, design: o.qr_data?.design, copies: 6 },
        `qr-${name.replace(/\s+/g, "-").toLowerCase()}-${o.id.slice(0, 8)}.pdf`,
      );
      toast.success("PDF téléchargé");
    } catch (e: any) {
      toast.error(e.message || "Erreur PDF");
    }
  };

  if (authLoading || !user) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-7 h-7 text-emerald-600" />
          <h1 className="text-2xl font-bold">Admin — Commandes boutique</h1>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="nfc_card">Cartes NFC</SelectItem>
              <SelectItem value="shop_product">Boutique</SelectItem>
              <SelectItem value="printed_qr_free">QR imprimés gratuits</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="paid">Payées</SelectItem>
              <SelectItem value="shipped">Expédiées</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
        </div>
      </div>

      <Card className="p-4 rounded-2xl">
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Livraison</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Suivi</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucune commande</TableCell></TableRow>
              ) : filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="text-xs">{new Date(o.created_at).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell>
                    <Badge className={
                      o.order_type === "nfc_card" ? "bg-emerald-100 text-emerald-700" :
                      o.order_type === "shop_product" ? "bg-indigo-100 text-indigo-700" :
                      "bg-amber-100 text-amber-700"
                    }>
                      {o.order_type === "nfc_card" ? "NFC" :
                       o.order_type === "shop_product" ? (o.order_items?.[0]?.product_name?.slice(0, 18) || "Boutique") :
                       "QR gratuit"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-semibold">{o.shipping_address?.full_name || o.customer_name || "—"}</div>
                    <div className="text-muted-foreground">{o.customer_email}</div>
                  </TableCell>
                  <TableCell className="text-xs max-w-[200px]">
                    {o.shipping_address ? (
                      <>
                        {o.shipping_address.line1}<br />
                        {o.shipping_address.postal_code} {o.shipping_address.city}<br />
                        <strong>{o.shipping_address.country}</strong>
                      </>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {Number(o.amount).toFixed(2)} €
                    {Number(o.shipping_cost) > 0 && <div className="text-muted-foreground">+ {Number(o.shipping_cost).toFixed(2)} € liv.</div>}
                  </TableCell>
                  <TableCell>
                    <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                      <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="paid">Payée</SelectItem>
                        <SelectItem value="shipped">Expédiée</SelectItem>
                        <SelectItem value="delivered">Livrée</SelectItem>
                        <SelectItem value="failed">Échec</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="N° suivi"
                      defaultValue={o.tracking_number || ""}
                      onBlur={(e) => e.target.value !== (o.tracking_number || "") && updateStatus(o.id, o.status, e.target.value)}
                      className="h-8 text-xs w-32"
                    />
                  </TableCell>
                  <TableCell>
                    {o.order_type === "printed_qr_free" && (
                      <Button size="sm" variant="outline" onClick={() => downloadPdf(o)}>
                        <Download className="w-3 h-3 mr-1" /> PDF
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        💡 Le PDF imprimable contient 6 adhésifs QR par feuille A4. Imprime, découpe, et envoie à l'adresse client.
      </p>
    </div>
  );
}
