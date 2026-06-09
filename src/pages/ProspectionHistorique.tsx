import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCcw, Download, ExternalLink, History, Send, FileText, Printer, Plus } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface OrderRow {
  id: string;
  created_at: string;
  type: string;
  prospect_name: string;
  prospect_address: string | null;
  prospect_city: string | null;
  status: string;
  gelato_order_id: string | null;
  gelato_reference_id: string | null;
  tracking_url: string | null;
  tracking_code: string | null;
  cost: number | null;
  currency: string | null;
  recipient: any;
  file_url: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  added: "bg-emerald-50 text-emerald-700",
  downloaded: "bg-slate-100 text-slate-700",
  created: "bg-blue-100 text-blue-700",
  passed: "bg-blue-100 text-blue-700",
  in_production: "bg-amber-100 text-amber-700",
  printed: "bg-amber-100 text-amber-700",
  shipped: "bg-emerald-100 text-emerald-700",
  in_transit: "bg-emerald-100 text-emerald-700",
  delivered: "bg-emerald-200 text-emerald-800",
  canceled: "bg-red-100 text-red-700",
  failed: "bg-red-100 text-red-700",
};

export default function ProspectionHistorique() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("print_ship_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error("Erreur de chargement");
    setRows((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const refreshStatuses = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke("gelato-order-status", { body: {} });
      if (error) throw error;
      toast.success(`${data?.updated ?? 0} commande(s) mise(s) à jour`);
      await load();
    } catch (e: any) {
      toast.error(`Erreur : ${e?.message || "inconnue"}`);
    } finally { setRefreshing(false); }
  };

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (cityFilter && !(r.prospect_city || "").toLowerCase().includes(cityFilter.toLowerCase())) return false;
      if (search && !`${r.prospect_name} ${r.prospect_address ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [rows, typeFilter, statusFilter, cityFilter, search]);

  const allStatuses = useMemo(() => Array.from(new Set(rows.map((r) => r.status))).sort(), [rows]);

  const exportCsv = () => {
    const headers = ["Date", "Type", "Prospect", "Adresse", "Ville", "Statut", "Gelato Ref", "Tracking", "Coût"];
    const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [headers.join(",")];
    filtered.forEach((r) => {
      lines.push([
        new Date(r.created_at).toLocaleString("fr-FR"),
        r.type,
        r.prospect_name,
        r.prospect_address ?? "",
        r.prospect_city ?? "",
        r.status,
        r.gelato_reference_id ?? "",
        r.tracking_url ?? r.tracking_code ?? "",
        r.cost ? `${r.cost} ${r.currency ?? "EUR"}` : "",
      ].map(escape).join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prospection-historique-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = useMemo(() => ({
    total: rows.length,
    shipped: rows.filter((r) => ["shipped", "in_transit", "delivered"].includes(r.status)).length,
    pending: rows.filter((r) => ["created", "passed", "in_production", "printed"].includes(r.status)).length,
    cost: rows.reduce((s, r) => s + (r.cost ?? 0), 0),
  }), [rows]);

  return (
    <div className="container max-w-6xl py-6 space-y-6 pb-32">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6 text-emerald-600" />
            Historique prospection
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Suivi de tes envois Print &amp; Ship et téléchargements PDF.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/prospection-stickers"><Send className="h-4 w-4 mr-1" /> Nouvelle prospection</Link>
          </Button>
          <Button onClick={refreshStatuses} disabled={refreshing} size="sm" variant="outline">
            {refreshing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-1" />}
            Rafraîchir statuts
          </Button>
          <Button onClick={exportCsv} size="sm" variant="outline">
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Total</div><div className="text-2xl font-bold">{stats.total}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">En cours</div><div className="text-2xl font-bold text-amber-600">{stats.pending}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Expédiés</div><div className="text-2xl font-bold text-emerald-600">{stats.shipped}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Coût total</div><div className="text-2xl font-bold">{stats.cost.toFixed(2)} €</div></Card>
      </div>

      <Card className="p-4 space-y-3">
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Type</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="added">Ajoutés à la liste</SelectItem>
                <SelectItem value="pdf">PDF téléchargé</SelectItem>
                <SelectItem value="print_ship">Print &amp; Ship</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Statut</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {allStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Ville</label>
            <Input value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} placeholder="Paris, Lyon…" className="mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Recherche</label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, adresse…" className="mt-1" />
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          Aucun envoi pour le moment. <Link to="/prospection-stickers" className="text-emerald-600 underline">Lance une prospection.</Link>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <Card key={r.id} className="p-3 flex items-start gap-3">
              <div className="shrink-0 mt-1">
                {r.type === "print_ship" ? (
                  <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center"><Printer className="h-4 w-4 text-emerald-700" /></div>
                ) : r.type === "added" ? (
                  <div className="h-9 w-9 rounded-full bg-emerald-50 flex items-center justify-center"><Plus className="h-4 w-4 text-emerald-600" /></div>
                ) : (
                  <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center"><FileText className="h-4 w-4 text-slate-600" /></div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{r.prospect_name}</span>
                  <Badge className={`text-xs ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-700"}`} variant="secondary">
                    {r.status}
                  </Badge>
                  {r.cost != null && <Badge variant="outline" className="text-xs">{r.cost.toFixed(2)} {r.currency ?? "EUR"}</Badge>}
                </div>
                <div className="text-xs text-muted-foreground truncate">{r.prospect_address}</div>
                <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  <span>{new Date(r.created_at).toLocaleString("fr-FR")}</span>
                  {r.gelato_reference_id && <span>Réf. {r.gelato_reference_id}</span>}
                  {r.tracking_code && <span>Tracking : {r.tracking_code}</span>}
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {r.tracking_url && (
                  <Button asChild size="sm" variant="outline">
                    <a href={r.tracking_url} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3.5 w-3.5 mr-1" /> Suivi
                    </a>
                  </Button>
                )}
                <Button asChild size="sm" variant="ghost">
                  <Link to="/prospection-stickers">Relancer</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
