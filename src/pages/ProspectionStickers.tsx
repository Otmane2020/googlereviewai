import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { downloadProspectionStickerPDF, ProspectionClient, PdfLang } from "@/lib/prospectionStickerPdf";
import { Search, MapPin, Star, Download, Loader2, Sparkles, FileText } from "lucide-react";
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
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [searching, setSearching] = useState(false);

  const [city, setCity] = useState("");
  const [type, setType] = useState("restaurant");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [suggesting, setSuggesting] = useState(false);

  const [selected, setSelected] = useState<Record<string, ProspectionClient>>({});
  const [generating, setGenerating] = useState(false);

  const toggle = (c: ProspectionClient) => {
    setSelected((s) => {
      const n = { ...s };
      if (n[c.placeId]) delete n[c.placeId];
      else n[c.placeId] = c;
      return n;
    });
  };

  const handleSearchName = async (val: string) => {
    setQuery(val);
    if (val.length < 3) { setPredictions([]); return; }
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-places", {
        body: { action: "autocomplete", query: val },
      });
      if (error) throw error;
      setPredictions(data?.predictions || []);
    } catch { toast.error("Erreur de recherche"); }
    finally { setSearching(false); }
  };

  const handleSuggest = async () => {
    if (!city.trim()) { toast.error("Indique une ville"); return; }
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
    } catch { toast.error("Erreur de suggestion"); }
    finally { setSuggesting(false); }
  };

  const handleGenerate = async () => {
    const clients = Object.values(selected);
    if (clients.length === 0) { toast.error("Sélectionne au moins un client"); return; }
    setGenerating(true);
    try {
      await downloadProspectionStickerPDF(
        clients,
        `ranki-prospection-${clients.length}.pdf`,
      );
      toast.success(`PDF généré ✨ (${clients.length} client${clients.length > 1 ? "s" : ""}, ${Math.ceil(clients.length / 2)} page${Math.ceil(clients.length / 2) > 1 ? "s" : ""})`);
    } catch (e) {
      console.error(e);
      toast.error("Erreur de génération PDF");
    } finally { setGenerating(false); }
  };

  const selCount = Object.keys(selected).length;

  return (
    <div className="container max-w-5xl py-6 space-y-6 pb-32">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-emerald-600" />
          Stickers prospection
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Chaque page A4 contient <strong>2 clients</strong> : un sticker Google rond à découper +
          une lettre personnalisée à envoyer par la poste.
        </p>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search"><Search className="h-4 w-4 mr-2" />Chercher par nom</TabsTrigger>
          <TabsTrigger value="suggest"><MapPin className="h-4 w-4 mr-2" />Suggérer par ville</TabsTrigger>
        </TabsList>

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
            {predictions.map((p) => {
              const name = p.description.split(",")[0];
              const checked = !!selected[p.place_id];
              return (
                <Card key={p.place_id} className="p-3 flex items-center gap-3">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle({ businessName: name, placeId: p.place_id, address: p.description })}
                  />
                  <div className="text-sm flex-1 min-w-0 truncate">{p.description}</div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

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
                  <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSuggest} disabled={suggesting} className="w-full">
              {suggesting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Recherche…</>
                : <><Search className="h-4 w-4 mr-2" /> Suggérer des prospects</>}
            </Button>
          </Card>

          {results.length > 0 && (
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const all: Record<string, ProspectionClient> = { ...selected };
                  results.forEach((r) => {
                    all[r.place_id] = { businessName: r.name, placeId: r.place_id, address: r.formatted_address };
                  });
                  setSelected(all);
                }}
              >Tout sélectionner</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected({})}>Vider</Button>
            </div>
          )}

          <div className="space-y-2">
            {results.map((r) => {
              const checked = !!selected[r.place_id];
              return (
                <Card key={r.place_id} className="p-3 flex items-center gap-3">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle({ businessName: r.name, placeId: r.place_id, address: r.formatted_address })}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{r.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{r.formatted_address}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {r.rating !== undefined && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                          {r.rating} ({r.user_ratings_total || 0})
                        </Badge>
                      )}
                      {r.business_status && r.business_status !== "OPERATIONAL" && (
                        <Badge variant="destructive" className="text-xs">{r.business_status}</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Card className="p-4 bg-emerald-50 border-emerald-200">
        <p className="text-xs text-emerald-900">
          💡 <strong>Astuce</strong> : imprime sur papier adhésif rond Ø ~110 mm + papier normal pour les
          lettres. Découpe chaque sticker, plie la lettre, glisse-les dans une enveloppe avec le nom du
          commerce et envoie par la poste.
        </p>
      </Card>

      {/* Sticky bottom bar */}
      {selCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-3 z-50">
          <div className="container max-w-5xl flex items-center justify-between gap-3">
            <div className="text-sm">
              <strong>{selCount}</strong> client{selCount > 1 ? "s" : ""} sélectionné{selCount > 1 ? "s" : ""}
              <span className="text-muted-foreground"> · {Math.ceil(selCount / 2)} page{Math.ceil(selCount / 2) > 1 ? "s" : ""} A4</span>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelected({})}>Vider</Button>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Génération…</>
                  : <><FileText className="h-4 w-4 mr-2" /> Générer PDF</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
