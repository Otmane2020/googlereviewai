import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Star, Download, Loader2, ArrowLeft, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { downloadProspectionPDF } from "@/lib/prospectionPdf";

interface Prediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  url?: string;
  types?: string[];
}

const GMBProspection = () => {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<Record<string, PlaceDetails>>({});
  const [loadingPdf, setLoadingPdf] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.length < 3) {
      toast.error("Tapez au moins 3 caractères");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-places", {
        body: { action: "autocomplete", query },
      });
      if (error) throw error;
      setPredictions(data?.predictions || []);
      if (!data?.predictions?.length) {
        toast.info("Aucun établissement trouvé");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la recherche");
    } finally {
      setLoading(false);
    }
  };

  const loadDetails = async (placeId: string): Promise<PlaceDetails | null> => {
    if (details[placeId]) return details[placeId];
    try {
      const { data, error } = await supabase.functions.invoke("search-places", {
        body: { action: "details", placeId },
      });
      if (error) throw error;
      const place: PlaceDetails = { place_id: placeId, ...data.place };
      setDetails((p) => ({ ...p, [placeId]: place }));
      return place;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const handleDownload = async (p: Prediction) => {
    setLoadingPdf(p.place_id);
    try {
      const det = await loadDetails(p.place_id);
      const businessName =
        det?.name || p.structured_formatting?.main_text || p.description;
      const address =
        det?.formatted_address || p.structured_formatting?.secondary_text;
      const reviewUrl = `https://search.google.com/local/writereview?placeid=${p.place_id}`;
      await downloadProspectionPDF({ businessName, address, reviewUrl });
      toast.success("PDF téléchargé");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setLoadingPdf(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
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
            Trouvez vos prospects et envoyez-leur une carte offerte
          </h1>
          <p className="text-muted-foreground mt-2">
            Recherchez un établissement, téléchargez une lettre PDF
            personnalisée avec sa carte NFC/QR à imprimer et glisser dans une
            enveloppe.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Restaurant Le Bistrot, Paris..."
              className="pl-9 h-11"
            />
          </div>
          <Button type="submit" disabled={loading} className="h-11">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Rechercher"
            )}
          </Button>
        </form>

        <div className="space-y-3">
          {predictions.map((p) => {
            const det = details[p.place_id];
            return (
              <Card key={p.place_id} className="p-4 hover:shadow-md transition">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {p.structured_formatting?.main_text || p.description}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {p.structured_formatting?.secondary_text}
                    </p>
                    {det && (
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        {det.rating && (
                          <Badge variant="secondary" className="gap-1">
                            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                            {det.rating} ({det.user_ratings_total || 0})
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(p)}
                    disabled={loadingPdf === p.place_id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {loadingPdf === p.place_id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-1.5" />
                        PDF
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}

          {!loading && predictions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Lancez une recherche pour voir des prospects à démarcher.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GMBProspection;
