import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { downloadProspectionStickerPDF, generateSingleStickerPDFBlob, generateBrandedLabelPDFBlob, generateLetterOnlyPDFBlob, ProspectionClient, PdfLang } from "@/lib/prospectionStickerPdf";
import { downloadStickerImage } from "@/lib/prospectionStickerImage";
import { Search, MapPin, Star, Download, Loader2, Sparkles, FileText, Printer, Send, Plus, Check, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";


interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  photoUrl?: string | null;
}

interface Prediction {
  place_id: string;
  description: string;
}

const COUNTRIES: { value: string; label: string; flag: string; lang: PdfLang }[] = [
  { value: "fr", label: "France", flag: "🇫🇷", lang: "fr" },
  { value: "be", label: "Belgique", flag: "🇧🇪", lang: "fr" },
  { value: "ch", label: "Suisse", flag: "🇨🇭", lang: "fr" },
  { value: "us", label: "United States", flag: "🇺🇸", lang: "en" },
];

const CITIES: Record<string, string[]> = {
  fr: ["Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille", "Rennes", "Reims", "Le Havre", "Saint-Étienne", "Toulon", "Grenoble", "Dijon", "Angers", "Nîmes", "Villeurbanne"],
  be: ["Bruxelles", "Anvers", "Gand", "Charleroi", "Liège", "Bruges", "Namur", "Louvain", "Mons", "Alost"],
  ch: ["Zurich", "Genève", "Bâle", "Lausanne", "Berne", "Winterthour", "Lucerne", "Saint-Gall", "Lugano", "Bienne"],
  us: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"],
};

const TYPES_FR = [
  { value: "restaurant", label: "Restaurants" },
  { value: "hôtel", label: "Hôtels" },
  { value: "café", label: "Cafés" },
  { value: "boulangerie", label: "Boulangeries" },
  { value: "coiffeur", label: "Coiffeurs" },
  { value: "salon de beauté", label: "Salons de beauté" },
  { value: "pharmacie", label: "Pharmacies" },
  { value: "garage automobile", label: "Garages" },
];
const TYPES_EN = [
  { value: "restaurant", label: "Restaurants" },
  { value: "hotel", label: "Hotels" },
  { value: "coffee shop", label: "Coffee shops" },
  { value: "bakery", label: "Bakeries" },
  { value: "hair salon", label: "Hair salons" },
  { value: "beauty salon", label: "Beauty salons" },
  { value: "pharmacy", label: "Pharmacies" },
  { value: "auto repair", label: "Auto repair" },
];

export default function ProspectionStickers() {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [searching, setSearching] = useState(false);

  const [country, setCountry] = useState("fr");
  const [city, setCity] = useState("");
  const [type, setType] = useState("restaurant");
  const [reviewRange, setReviewRange] = useState("all");
  const [tagFilters, setTagFilters] = useState<Record<string, boolean>>({
    lowRating: false,    // note ≤ 4.0
    highVolume: false,   // ≥ 100 avis
  });
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [suggesting, setSuggesting] = useState(false);

  const REVIEW_RANGES: { value: string; label: string; min: number; max: number }[] = [
    { value: "all", label: "Tous", min: 0, max: Infinity },
    { value: "0-10", label: "0 – 10 avis", min: 0, max: 10 },
    { value: "10-50", label: "10 – 50 avis", min: 10, max: 50 },
    { value: "50-100", label: "50 – 100 avis", min: 50, max: 100 },
    { value: "100-500", label: "100 – 500 avis", min: 100, max: 500 },
    { value: "500+", label: "500+ avis", min: 500, max: Infinity },
  ];
  const currentRange = REVIEW_RANGES.find((r) => r.value === reviewRange) || REVIEW_RANGES[0];
  const filteredResults = results.filter((r) => {
    const n = r.user_ratings_total || 0;
    if (!(n >= currentRange.min && n < currentRange.max)) return false;
    if (tagFilters.lowRating && (r.rating === undefined || r.rating > 4.0)) return false;
    if (tagFilters.highVolume && n < 100) return false;
    return true;
  });

  const [selected, setSelected] = useState<Record<string, ProspectionClient>>({});
  const [generating, setGenerating] = useState(false);

  // Print & Ship (Gelato)
  const [shipTarget, setShipTarget] = useState<PlaceResult | null>(null);
  const [shipForm, setShipForm] = useState({
    firstName: "Responsable",
    lastName: "",
    companyName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postCode: "",
    country: "FR",
  });
  const [shipping, setShipping] = useState(false);
  const [labelBlob, setLabelBlob] = useState<Blob | null>(null);
  const [letterBlob, setLetterBlob] = useState<Blob | null>(null);
  const [labelImg, setLabelImg] = useState<string | null>(null);
  const [letterImg, setLetterImg] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Regenerate previews (label + letter) — matches what Gelato will print
  useEffect(() => {
    if (!shipTarget) {
      setLabelBlob(null); setLetterBlob(null);
      setLabelImg(null); setLetterImg(null);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    (async () => {
      try {
        const client = { businessName: shipTarget.name, placeId: shipTarget.place_id, address: shipTarget.formatted_address };
        const [lblBlob, ltrBlob] = await Promise.all([
          generateBrandedLabelPDFBlob(client, currentCountry.lang),
          generateLetterOnlyPDFBlob(client, currentCountry.lang),
        ]);
        if (cancelled) return;
        setLabelBlob(lblBlob);
        setLetterBlob(ltrBlob);

        const pdfjs: any = await import("pdfjs-dist");
        const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
        pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

        const renderFirstPage = async (blob: Blob, scale = 1.5) => {
          const buf = await blob.arrayBuffer();
          const pdf = await pdfjs.getDocument({ data: buf }).promise;
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d")!;
          await page.render({ canvas, canvasContext: ctx, viewport }).promise;
          return canvas.toDataURL("image/jpeg", 0.85);
        };

        const [lblImg, ltrImg] = await Promise.all([
          renderFirstPage(lblBlob, 2),
          renderFirstPage(ltrBlob, 1.3),
        ]);
        if (cancelled) return;
        setLabelImg(lblImg);
        setLetterImg(ltrImg);
      } catch (e) {
        console.error("preview error", e);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipTarget?.place_id]);

  const openBlobBlank = (blob: Blob | null) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };


  const currentCountry = COUNTRIES.find((c) => c.value === country) || COUNTRIES[0];
  const TYPES = currentCountry.lang === "en" ? TYPES_EN : TYPES_FR;

  const toggle = (c: ProspectionClient) => {
    setSelected((s) => {
      const n = { ...s };
      if (n[c.placeId]) {
        delete n[c.placeId];
      } else {
        n[c.placeId] = c;
        // Log "added" entry in history (fire-and-forget)
        (async () => {
          try {
            const { data: u } = await supabase.auth.getUser();
            if (!u?.user) return;
            const cityGuess = (c.address || "").split(",")[1]?.trim().replace(/^\d{4,6}\s+/, "") || null;
            await supabase.from("print_ship_orders").insert({
              user_id: u.user.id,
              type: "added",
              prospect_place_id: c.placeId ?? null,
              prospect_name: c.businessName,
              prospect_address: c.address ?? null,
              prospect_city: cityGuess,
              status: "added",
            });
          } catch (e) { console.warn("add log skipped", e); }
        })();
      }
      return n;
    });
  };

  const handleSearchName = async (val: string) => {
    setQuery(val);
    if (val.length < 3) { setPredictions([]); return; }
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-places", {
        body: { action: "autocomplete", query: val, country },
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
        body: { action: "nearby", city, type, country },
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
        `ranki-prospection-${currentCountry.value}-${clients.length}.pdf`,
        currentCountry.lang,
      );
      try {
        const { data: u } = await supabase.auth.getUser();
        if (u?.user) {
          const rows = clients.map((c) => ({
            user_id: u.user!.id,
            type: "pdf",
            prospect_place_id: c.placeId ?? null,
            prospect_name: c.businessName,
            prospect_address: c.address ?? null,
            status: "downloaded",
          }));
          await supabase.from("print_ship_orders").insert(rows);
        }
      } catch (e) { console.warn("history log skipped", e); }
      toast.success(`PDF généré ✨ (${clients.length} client${clients.length > 1 ? "s" : ""}, ${Math.ceil(clients.length / 2)} page${Math.ceil(clients.length / 2) > 1 ? "s" : ""})`);
    } catch (e) {
      console.error(e);
      toast.error("Erreur de génération PDF");
    } finally { setGenerating(false); }
  };

  // --- Parse a Google Places formatted address into Gelato fields (best effort) ---
  const parseAddress = (full?: string) => {
    if (!full) return { addressLine1: "", city: "", postCode: "", country: "FR" };
    const parts = full.split(",").map((p) => p.trim());
    const addressLine1 = parts[0] || "";
    let city = "", postCode = "", country = "FR";
    if (parts.length >= 2) {
      const cityPart = parts[1] || "";
      const m = cityPart.match(/(\d{4,6})\s+(.+)/);
      if (m) { postCode = m[1]; city = m[2]; }
      else city = cityPart;
    }
    if (parts.length >= 3) {
      const c = parts[parts.length - 1].toLowerCase();
      if (c.includes("france")) country = "FR";
      else if (c.includes("belg")) country = "BE";
      else if (c.includes("suisse") || c.includes("switzer")) country = "CH";
      else if (c.includes("united states") || c.includes("usa")) country = "US";
    }
    return { addressLine1, city, postCode, country };
  };

  const openShipDialog = (r: PlaceResult) => {
    const parsed = parseAddress(r.formatted_address);
    setShipForm({
      firstName: "Responsable",
      lastName: "",
      companyName: r.name,
      addressLine1: parsed.addressLine1,
      addressLine2: "",
      city: parsed.city,
      postCode: parsed.postCode,
      country: parsed.country,
    });
    setShipTarget(r);
  };

  const handleShip = async () => {
    if (!shipTarget) return;
    if (!shipForm.addressLine1 || !shipForm.city || !shipForm.postCode) {
      toast.error("Adresse incomplète"); return;
    }
    setShipping(true);
    try {
      const client = { businessName: shipTarget.name, placeId: shipTarget.place_id, address: shipTarget.formatted_address };
      // 1. Generate both PDFs: Branded Label sticker + A4 letter
      const [labelBlob, letterBlob] = await Promise.all([
        generateBrandedLabelPDFBlob(client, currentCountry.lang),
        generateLetterOnlyPDFBlob(client, currentCountry.lang),
      ]);
      // 2. Upload both to storage + signed URLs
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) throw new Error("Non authentifié");
      const ts = Date.now();
      const labelPath = `${u.user.id}/${shipTarget.place_id}-${ts}-label.pdf`;
      const letterPath = `${u.user.id}/${shipTarget.place_id}-${ts}-letter.pdf`;
      const [upL, upLet] = await Promise.all([
        supabase.storage.from("prospection-stickers").upload(labelPath, labelBlob, { contentType: "application/pdf", upsert: true }),
        supabase.storage.from("prospection-stickers").upload(letterPath, letterBlob, { contentType: "application/pdf", upsert: true }),
      ]);
      if (upL.error) throw upL.error;
      if (upLet.error) throw upLet.error;
      const [sigL, sigLet] = await Promise.all([
        supabase.storage.from("prospection-stickers").createSignedUrl(labelPath, 60 * 60 * 24 * 7),
        supabase.storage.from("prospection-stickers").createSignedUrl(letterPath, 60 * 60 * 24 * 7),
      ]);
      if (!sigL.data?.signedUrl || !sigLet.data?.signedUrl) throw new Error("Signed URL failed");
      // 3. Call edge function with 2 Gelato items
      const { data, error } = await supabase.functions.invoke("gelato-print-ship", {
        body: {
          businessName: shipTarget.name,
          placeId: shipTarget.place_id,
          address: shipTarget.formatted_address,
          recipient: { ...shipForm },
          items: [
            { fileUrl: sigL.data.signedUrl, productUid: "branded_sticker_101x76-mm-4x3-inch-label_bopp-white-gloss-perm-60-micron_external-application_4-0_ver", quantity: 1 },
            { fileUrl: sigLet.data.signedUrl, productUid: "branded_insert_101x152-mm-4x6-inch_170-gsm-65lb-uncoated_insert_4-0_ver", quantity: 1 },
          ],
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Commande Gelato créée ✨ (réf. ${data?.orderReferenceId})`);
      setShipTarget(null);
    } catch (e: any) {
      console.error(e);
      toast.error(`Erreur Print & Ship : ${e?.message || "inconnue"}`);
    } finally {
      setShipping(false);
    }
  };

  const selCount = Object.keys(selected).length;

  return (
    <div className="container max-w-5xl py-6 space-y-6 pb-32">
      <div className="flex items-start justify-between gap-3 flex-wrap">
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
        <a href="/prospection-historique" className="text-sm text-emerald-700 underline shrink-0">
          📜 Historique des envois →
        </a>
      </div>

      <Card className="p-4">
        <Label>Pays cible</Label>
        <Select value={country} onValueChange={(v) => { setCountry(v); setResults([]); setPredictions([]); }}>
          <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                <span className="mr-2">{c.flag}</span>{c.label}
                <span className="ml-2 text-xs text-muted-foreground">· PDF {c.lang.toUpperCase()}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-2">
          {currentCountry.lang === "fr"
            ? "PDF généré en français (France, Belgique, Suisse)."
            : "PDF will be generated in English."}
        </p>
      </Card>

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
              const rest = p.description.substring(name.length + 2);
              const checked = !!selected[p.place_id];
              const client: ProspectionClient = { businessName: name, placeId: p.place_id, address: p.description };
              return (
                <Card key={p.place_id} className="p-3 flex items-center gap-2 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{name}</div>
                    <div className="text-xs text-muted-foreground truncate">{rest || p.description}</div>
                  </div>
                  <Button
                    size="sm"
                    variant={checked ? "default" : "outline"}
                    className={checked ? "shrink-0 bg-emerald-600 hover:bg-emerald-700" : "shrink-0 border-emerald-300 text-emerald-700 hover:bg-emerald-50"}
                    onClick={() => toggle(client)}
                  >
                    {checked ? <><Check className="h-3.5 w-3.5 mr-1" />Ajouté</> : <><Plus className="h-3.5 w-3.5 mr-1" />Ajouter</>}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={async () => {
                      try {
                        await downloadProspectionStickerPDF([client], `ranki-${name.replace(/[^a-z0-9]/gi, "_").slice(0, 30)}.pdf`, currentCountry.lang);
                        toast.success("PDF téléchargé ✨ (envoi manuel)");
                      } catch { toast.error("Erreur PDF"); }
                    }}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" /> PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-50"
                    onClick={async () => {
                      try {
                        await downloadStickerImage(p.place_id, name, currentCountry.lang);
                        toast.success("Image PNG téléchargée ✨");
                      } catch { toast.error("Erreur image"); }
                    }}
                  >
                    <ImageIcon className="h-3.5 w-3.5 mr-1" /> Image
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    onClick={(e) => { e.stopPropagation(); openShipDialog({ place_id: p.place_id, name, formatted_address: p.description }); }}
                  >
                    <Printer className="h-3.5 w-3.5 mr-1" /> Print & Ship
                  </Button>
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
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="mt-2"><SelectValue placeholder="Choisir une ville" /></SelectTrigger>
                  <SelectContent>
                    {CITIES[country]?.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <div>
              <Label>Filtre par nombre d'avis Google</Label>
              <Select value={reviewRange} onValueChange={setReviewRange}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REVIEW_RANGES.map((r) => {
                    const count = results.filter((res) => {
                      const n = res.user_ratings_total || 0;
                      return n >= r.min && n < r.max;
                    }).length;
                    return (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label} {results.length > 0 && <span className="text-xs text-muted-foreground ml-1">({count})</span>}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                💡 Cible les établissements avec beaucoup d'avis pour un meilleur ROI. Résultats triés du plus petit au plus grand.
              </p>
            </div>
            <div>
              <Label className="text-xs">Filtres rapides</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge
                  variant={tagFilters.lowRating ? "default" : "outline"}
                  className={`cursor-pointer text-xs ${tagFilters.lowRating ? "bg-amber-600 hover:bg-amber-700" : "hover:bg-amber-50"}`}
                  onClick={() => setTagFilters((f) => ({ ...f, lowRating: !f.lowRating }))}
                >
                  ⭐ Note ≤ 4.0
                </Badge>
                <Badge
                  variant={tagFilters.highVolume ? "default" : "outline"}
                  className={`cursor-pointer text-xs ${tagFilters.highVolume ? "bg-emerald-600 hover:bg-emerald-700" : "hover:bg-emerald-50"}`}
                  onClick={() => setTagFilters((f) => ({ ...f, highVolume: !f.highVolume }))}
                >
                  🔥 100+ avis (gros volume)
                </Badge>
                {(tagFilters.lowRating || tagFilters.highVolume) && (
                  <Badge
                    variant="outline"
                    className="cursor-pointer text-xs text-muted-foreground hover:bg-gray-100"
                    onClick={() => setTagFilters({ lowRating: false, highVolume: false })}
                  >
                    ✕ Réinitialiser
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                💡 <strong>Note ≤ 4.0</strong> = commerce mal noté, gros besoin de réponses IA. <strong>100+ avis</strong> = forte exposition, fort ROI.
              </p>
            </div>
            <Button onClick={handleSuggest} disabled={suggesting} className="w-full">
              {suggesting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Recherche…</>
                : <><Search className="h-4 w-4 mr-2" /> Suggérer des prospects</>}
            </Button>
          </Card>

          {results.length > 0 && (
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                {filteredResults.length} / {results.length} résultat{results.length > 1 ? "s" : ""}
                {reviewRange !== "all" && ` · filtre ${currentRange.label}`}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const all: Record<string, ProspectionClient> = { ...selected };
                    filteredResults.forEach((r) => {
                      all[r.place_id] = { businessName: r.name, placeId: r.place_id, address: r.formatted_address };
                    });
                    setSelected(all);
                  }}
                >Tout sélectionner</Button>
                <Button size="sm" variant="ghost" onClick={() => setSelected({})}>Vider</Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {filteredResults.map((r) => {
              const checked = !!selected[r.place_id];
              const reviewCount = r.user_ratings_total || 0;
              const client: ProspectionClient = { businessName: r.name, placeId: r.place_id, address: r.formatted_address };
              return (
                <Card key={r.place_id} className="p-3 flex items-center gap-3 flex-wrap">
                  {r.photoUrl ? (
                    <img
                      src={r.photoUrl}
                      alt={r.name}
                      className="w-16 h-16 rounded-lg object-cover shrink-0 bg-muted"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <MapPin className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{r.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{r.formatted_address}</div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {r.rating !== undefined && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                          {r.rating}
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          reviewCount >= 100 ? "border-emerald-500 text-emerald-700 bg-emerald-50" :
                          reviewCount >= 50 ? "border-blue-500 text-blue-700 bg-blue-50" :
                          reviewCount >= 10 ? "border-amber-500 text-amber-700 bg-amber-50" :
                          "border-gray-300 text-gray-600"
                        }`}
                      >
                        {reviewCount} avis
                      </Badge>
                      {r.business_status && r.business_status !== "OPERATIONAL" && (
                        <Badge variant="destructive" className="text-xs">{r.business_status}</Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={checked ? "default" : "outline"}
                    className={checked ? "shrink-0 bg-emerald-600 hover:bg-emerald-700" : "shrink-0 border-emerald-300 text-emerald-700 hover:bg-emerald-50"}
                    onClick={(e) => { e.stopPropagation(); toggle(client); }}
                  >
                    {checked ? <><Check className="h-3.5 w-3.5 mr-1" />Ajouté</> : <><Plus className="h-3.5 w-3.5 mr-1" />Ajouter</>}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={async () => {
                      try {
                        await downloadProspectionStickerPDF([client], `ranki-${r.name.replace(/[^a-z0-9]/gi, "_").slice(0, 30)}.pdf`, currentCountry.lang);
                        toast.success("PDF téléchargé ✨ (envoi manuel)");
                      } catch { toast.error("Erreur PDF"); }
                    }}
                  >
                    <Download className="h-3.5 w-3.5 mr-1" /> PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-50"
                    onClick={async () => {
                      try {
                        await downloadStickerImage(r.place_id, r.name, currentCountry.lang);
                        toast.success("Image PNG téléchargée ✨");
                      } catch { toast.error("Erreur image"); }
                    }}
                  >
                    <ImageIcon className="h-3.5 w-3.5 mr-1" /> Image
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    onClick={(e) => { e.stopPropagation(); openShipDialog(r); }}
                  >
                    <Printer className="h-3.5 w-3.5 mr-1" /> Print & Ship
                  </Button>
                </Card>
              );
            })}
            {results.length > 0 && filteredResults.length === 0 && (
              <p className="text-sm text-center text-muted-foreground py-4">
                Aucun résultat avec ce filtre. Essaie une autre tranche d'avis.
              </p>
            )}
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

      {/* Print & Ship Dialog (Gelato) */}
      <Dialog open={!!shipTarget} onOpenChange={(o) => !o && setShipTarget(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-emerald-600" />
              Print & Ship — {shipTarget?.name}
            </DialogTitle>
            <DialogDescription>
              Aperçu du courrier A4 + adresse d'envoi. Vérifie avant d'imprimer via Gelato.
            </DialogDescription>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Preview pane */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" /> Sticker — Branded Label 7.62×10.16 cm
                </Label>
                <div className="border rounded-lg bg-slate-50 overflow-hidden h-[260px] flex items-center justify-center p-2">
                  {previewLoading && !labelImg ? (
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  ) : labelImg ? (
                    <img src={labelImg} alt="Aperçu sticker" className="max-h-full max-w-full object-contain shadow-sm" />
                  ) : (
                    <span className="text-xs text-muted-foreground">Aucun aperçu</span>
                  )}
                </div>
                {labelBlob && (
                  <button type="button" onClick={() => openBlobBlank(labelBlob)} className="text-xs text-emerald-700 underline">
                    Ouvrir le sticker ↗
                  </button>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" /> Lettre A4
                </Label>
                <div className="border rounded-lg bg-slate-50 overflow-hidden h-[260px] flex items-center justify-center p-2">
                  {previewLoading && !letterImg ? (
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                  ) : letterImg ? (
                    <img src={letterImg} alt="Aperçu lettre" className="max-h-full max-w-full object-contain shadow-sm" />
                  ) : (
                    <span className="text-xs text-muted-foreground">Aucun aperçu</span>
                  )}
                </div>
                {letterBlob && (
                  <button type="button" onClick={() => openBlobBlank(letterBlob)} className="text-xs text-emerald-700 underline">
                    Ouvrir la lettre ↗
                  </button>
                )}
              </div>
            </div>

            {/* Form pane */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Prénom destinataire</Label>
                  <Input value={shipForm.firstName} onChange={(e) => setShipForm({ ...shipForm, firstName: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Nom</Label>
                  <Input value={shipForm.lastName} onChange={(e) => setShipForm({ ...shipForm, lastName: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Société</Label>
                <Input value={shipForm.companyName} onChange={(e) => setShipForm({ ...shipForm, companyName: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Adresse</Label>
                <Input value={shipForm.addressLine1} onChange={(e) => setShipForm({ ...shipForm, addressLine1: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Complément</Label>
                <Input value={shipForm.addressLine2} onChange={(e) => setShipForm({ ...shipForm, addressLine2: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Code postal</Label>
                  <Input value={shipForm.postCode} onChange={(e) => setShipForm({ ...shipForm, postCode: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Ville</Label>
                  <Input value={shipForm.city} onChange={(e) => setShipForm({ ...shipForm, city: e.target.value })} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Pays</Label>
                <Select value={shipForm.country} onValueChange={(v) => setShipForm({ ...shipForm, country: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FR">🇫🇷 France</SelectItem>
                    <SelectItem value="BE">🇧🇪 Belgique</SelectItem>
                    <SelectItem value="CH">🇨🇭 Suisse</SelectItem>
                    <SelectItem value="US">🇺🇸 United States</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded p-2">
                💡 Vérifie l'adresse (auto-remplie depuis Google). Coût ~0,50€ + port, facturé sur ton compte Gelato.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShipTarget(null)} disabled={shipping}>Annuler</Button>
            <Button
              onClick={handleShip}
              disabled={shipping || previewLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {shipping ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Envoi…</>
                : <><Send className="h-4 w-4 mr-2" /> Imprimer & Envoyer</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

