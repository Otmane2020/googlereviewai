import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  Star,
  Download,
  Loader2,
  ArrowLeft,
  Gift,
  Sparkles,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { downloadProspectionPDF, ProspectClient } from "@/lib/prospectionPdf";

interface Prospect {
  place_id: string;
  name: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
}

const GMBProspection = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingSingle, setLoadingSingle] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.length < 3) {
      toast.error("Tapez au moins 3 caractères (ex: restaurant Paris)");
      return;
    }
    setLoading(true);
    setSelected(new Set());
    try {
      const { data, error } = await supabase.functions.invoke("search-places", {
        body: { action: "textsearch", query },
      });
      if (error) throw error;
      setResults(data?.results || []);
      if (!data?.results?.length) toast.info("Aucun prospect trouvé");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la recherche");
    } finally {
      setLoading(false);
    }
  };

  const toClient = (p: Prospect): ProspectClient => ({
    businessName: p.name,
    address: p.formatted_address,
    rating: p.rating,
    reviewsCount: p.user_ratings_total,
    reviewUrl: `https://search.google.com/local/writereview?placeid=${p.place_id}`,
  });

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 2) next.add(id);
      else {
        toast.info("2 prospects max par PDF (1 en haut, 1 en bas)");
        return prev;
      }
      return next;
    });
  };

  const handleDownloadSingle = async (p: Prospect) => {
    setLoadingSingle(p.place_id);
    try {
      await downloadProspectionPDF([toClient(p)]);
      toast.success("PDF téléchargé");
    } catch (err) {
      console.error(err);
      toast.error("Erreur PDF");
    } finally {
      setLoadingSingle(null);
    }
  };

  const handleDownloadSelected = async () => {
    const list = results.filter((r) => selected.has(r.place_id)).map(toClient);
    if (!list.length) return;
    setLoadingPdf(true);
    try {
      await downloadProspectionPDF(list);
      toast.success(`PDF (${list.length} fiche${list.length > 1 ? "s" : ""}) téléchargé`);
    } catch (err) {
      console.error(err);
      toast.error("Erreur PDF");
    } finally {
      setLoadingPdf(false);
    }
  };

  // tag de qualité prospect
  const qualityTag = (p: Prospect) => {
    const r = p.rating || 0;
    const n = p.user_ratings_total || 0;
    if (r >= 3.8 && r <= 4.7 && n >= 50)
      return { label: "🔥 Hot prospect", color: "bg-emerald-100 text-emerald-700" };
    if (r >= 4.8) return { label: "⭐ Top noté", color: "bg-amber-100 text-amber-700" };
    if (n >= 100) return { label: "📈 Très actif", color: "bg-blue-100 text-blue-700" };
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-3">
            <Gift className="w-3.5 h-3.5" /> PROSPECTION GMB
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Trouvez les meilleurs prospects à démarcher
          </h1>
          <p className="text-muted-foreground mt-2">
            Recherchez par activité ou ville. On classe automatiquement les
            établissements avec une marge de progression (note 3,8–4,7), beaucoup
            d'avis, et structure active. Sélectionnez-en 2 pour générer un PDF A4
            avec 2 fiches (haut/bas) — sticker rond personnalisé + lettre.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex : restaurants Lyon, garage Marseille, coiffeur Bordeaux…"
              className="pl-9 h-11"
            />
          </div>
          <Button type="submit" disabled={loading} className="h-11">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Rechercher"}
          </Button>
        </form>

        {/* Suggestions de catégories (pas juste villes) */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-xs text-muted-foreground self-center mr-1">
            Idées de prospects intéressés :
          </span>
          {[
            "Restaurants Paris",
            "Hôtels Lyon",
            "Coiffeurs Marseille",
            "Garages Toulouse",
            "Dentistes Bordeaux",
            "Salons de beauté Nice",
            "Pizzerias Nantes",
            "Auto-écoles Lille",
          ].map((s) => (
            <button
              key={s}
              type="button"
              onClick={async () => {
                setQuery(s);
                // déclenche la recherche directement avec la valeur
                setLoading(true);
                setSelected(new Set());
                try {
                  const { data, error } = await supabase.functions.invoke(
                    "search-places",
                    { body: { action: "textsearch", query: s } },
                  );
                  if (error) throw error;
                  setResults(data?.results || []);
                } catch (err) {
                  console.error(err);
                  toast.error("Erreur lors de la recherche");
                } finally {
                  setLoading(false);
                }
              }}
              className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition font-medium"
            >
              {s}
            </button>
          ))}
        </div>

        {selected.size > 0 && (
          <div className="sticky top-2 z-10 mb-4 flex items-center justify-between bg-emerald-600 text-white rounded-xl px-4 py-3 shadow-lg">
            <span className="text-sm font-medium">
              {selected.size} prospect{selected.size > 1 ? "s" : ""} sélectionné
              {selected.size > 1 ? "s" : ""} · PDF A4 (haut/bas)
            </span>
            <Button
              size="sm"
              onClick={handleDownloadSelected}
              disabled={loadingPdf}
              variant="secondary"
              className="bg-white text-emerald-700 hover:bg-emerald-50"
            >
              {loadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Download className="w-4 h-4 mr-1.5" /> Télécharger
                </>
              )}
            </Button>
          </div>
        )}

        <div className="grid gap-3">
          {results.map((p) => {
            const tag = qualityTag(p);
            const isSel = selected.has(p.place_id);
            return (
              <Card
                key={p.place_id}
                className={`p-4 transition cursor-pointer ${
                  isSel ? "ring-2 ring-emerald-500 bg-emerald-50/40" : "hover:shadow-md"
                }`}
                onClick={() => toggle(p.place_id)}
              >
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={isSel}
                    onCheckedChange={() => toggle(p.place_id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1"
                  />
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{p.name}</h3>
                      {tag && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tag.color}`}
                        >
                          {tag.label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {p.formatted_address}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs flex-wrap">
                      {p.rating && (
                        <Badge variant="secondary" className="gap-1">
                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                          {p.rating} ({p.user_ratings_total || 0})
                        </Badge>
                      )}
                      {(p.user_ratings_total || 0) >= 200 && (
                        <Badge variant="outline" className="gap-1">
                          <TrendingUp className="w-3 h-3" /> Forte audience
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadSingle(p);
                    }}
                    disabled={loadingSingle === p.place_id}
                  >
                    {loadingSingle === p.place_id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-1.5" /> PDF
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}

          {!loading && results.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Sparkles className="w-10 h-10 mx-auto mb-3 text-emerald-500" />
              <p className="text-sm">
                Lancez une recherche pour voir les meilleurs prospects classés
                automatiquement.
              </p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <p className="text-center text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Cochez jusqu'à
              2 prospects pour générer un PDF A4 (1 fiche en haut + 1 en bas).
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GMBProspection;
