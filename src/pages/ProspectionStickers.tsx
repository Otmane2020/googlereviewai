import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { downloadProspectionStickerPDF } from "@/lib/prospectionStickerPdf";
import { Search, MapPin, Star, Download, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
}

interface Prediction {
  place_id: string;
  description: string;
}

const TYPES = [
  { value: "restaurant", label: "Restaurants" },
  { value: "hôtel", label: "Hôtels" },
  { value: "café", label: "Cafés" },
  { value: "boulangerie", label: "Boulangeries" },
  { value: "coiffeur", label: "Coiffeurs" },
  { value: "salon de beauté", label: "Salons de beauté" },
  { value: "pharmacie", label: "Pharmacies" },
  { value: "garage automobile", label: "Garages" },
];

export default function ProspectionStickers() {
  // Search by name
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [searching, setSearching] = useState(false);

  // Suggestions by city
  const [city, setCity] = useState("");
  const [type, setType] = useState("restaurant");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [suggesting, setSuggesting] = useState(false);

  // PDF generation
  const [generating, setGenerating] = useState<string | null>(null);
  const [copies, setCopies] = useState<number>(4);

  const handleSearchName = async (val: string) => {
    setQuery(val);
    if (val.length < 3) {
      setPredictions([]);
      return;
    }
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-places", {
        body: { action: "autocomplete", query: val },
      });
      if (error) throw error;
      setPredictions(data?.predictions || []);
    } catch (e) {
      toast.error("Erreur de recherche");
    } finally {
      setSearching(false);
    }
  };

  const handleSuggest = async () => {
    if (!city.trim()) {
      toast.error("Indique une ville");
      return;
    }
    setSuggesting(true);
    setResults([]);
    try {
      const { data, error } = await supabase.functions.invoke("search-places", {
        body: { action: "nearby", city, type },
      });
      if (error) throw error;
      const list: PlaceResult[] = data?.results || [];
      setResults(list);
      if (list.length === 0) toast.info("Aucun résultat");
    } catch (e) {
      toast.error("Erreur de suggestion");
    } finally {
      setSuggesting(false);
    }
  };

  const handleGenerate = async (placeId: string, name: string) => {
    setGenerating(placeId);
    try {
      const filename = `sticker-${name.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 40)}.pdf`;
      await downloadProspectionStickerPDF(
        { businessName: name, placeId, copies },
        filename,
      );
      toast.success("PDF généré ✨");
    } catch (e) {
      console.error(e);
      toast.error("Erreur de génération PDF");
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-emerald-600" />
          Stickers prospection
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Génère un PDF prêt à imprimer sur papier adhésif et à envoyer par la poste.
          Cherche une fiche Google Business par nom ou découvre des prospects par ville.
        </p>
      </div>

      <Card className="p-4 space-y-3">
        <Label>Nombre de stickers par feuille A4</Label>
        <Select value={String(copies)} onValueChange={(v) => setCopies(Number(v))}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 grand sticker</SelectItem>
            <SelectItem value="2">2 stickers</SelectItem>
            <SelectItem value="4">4 stickers (recommandé)</SelectItem>
          </SelectContent>
        </Select>
      </Card>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">
            <Search className="h-4 w-4 mr-2" />
            Chercher par nom
          </TabsTrigger>
          <TabsTrigger value="suggest">
            <MapPin className="h-4 w-4 mr-2" />
            Suggérer par ville
          </TabsTrigger>
        </TabsList>

        {/* Search by name */}
        <TabsContent value="search" className="space-y-3">
          <Card className="p-4">
            <Label>Nom de l'établissement</Label>
            <Input
              placeholder="Ex: Le Bistrot du Coin Paris"
              value={query}
              onChange={(e) => handleSearchName(e.target.value)}
              className="mt-2"
            />
            {searching && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Recherche…
              </p>
            )}
          </Card>

          <div className="space-y-2">
            {predictions.map((p) => (
              <Card key={p.place_id} className="p-3 flex items-center justify-between gap-3">
                <div className="text-sm">{p.description}</div>
                <Button
                  size="sm"
                  onClick={() => handleGenerate(p.place_id, p.description.split(",")[0])}
                  disabled={generating === p.place_id}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {generating === p.place_id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-1" /> PDF
                    </>
                  )}
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Suggest by city */}
        <TabsContent value="suggest" className="space-y-3">
          <Card className="p-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Ville</Label>
                <Input
                  placeholder="Ex: Lyon"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-2"
                  onKeyDown={(e) => e.key === "Enter" && handleSuggest()}
                />
              </div>
              <div>
                <Label>Type d'établissement</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSuggest} disabled={suggesting} className="w-full">
              {suggesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Recherche…
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" /> Suggérer des prospects
                </>
              )}
            </Button>
          </Card>

          <div className="space-y-2">
            {results.map((r) => (
              <Card key={r.place_id} className="p-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{r.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {r.formatted_address}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {r.rating !== undefined && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                        {r.rating} ({r.user_ratings_total || 0})
                      </Badge>
                    )}
                    {r.business_status && r.business_status !== "OPERATIONAL" && (
                      <Badge variant="destructive" className="text-xs">
                        {r.business_status}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleGenerate(r.place_id, r.name)}
                  disabled={generating === r.place_id}
                  className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
                >
                  {generating === r.place_id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-1" /> PDF
                    </>
                  )}
                </Button>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Card className="p-4 bg-emerald-50 border-emerald-200">
        <p className="text-xs text-emerald-900">
          💡 <strong>Astuce</strong> : imprime sur papier adhésif rond Ø 90 mm,
          découpe et glisse dans une enveloppe avec un mot personnalisé. Le QR
          renvoie directement vers le formulaire d'avis Google de la fiche
          choisie.
        </p>
      </Card>
    </div>
  );
}
