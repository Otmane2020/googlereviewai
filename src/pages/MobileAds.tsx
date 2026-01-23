import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Star, 
  MapPin, 
  Sparkles, 
  Loader2, 
  ArrowRight,
  Copy,
  Check,
  Building2,
  ChevronLeft,
  Zap,
  Clock,
  TrendingUp,
  MessageSquare,
  Shield
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

interface PlaceReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  profile_photo_url?: string;
  relative_time_description?: string;
}

interface PlaceDetails {
  name: string;
  formatted_address: string;
  rating: number;
  user_ratings_total: number;
  reviews?: PlaceReview[];
  photoUrl?: string;
  types?: string[];
}

type ViewState = "search" | "reviews";

const MobileAds = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [generatingReviewId, setGeneratingReviewId] = useState<number | null>(null);
  const [aiResponses, setAiResponses] = useState<Record<number, string>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 3) {
        setIsSearching(true);
        try {
          const { data, error } = await supabase.functions.invoke("search-places", {
            body: { action: "autocomplete", query: searchQuery },
          });
          if (error) throw error;
          setPredictions(data.predictions || []);
        } catch (error) {
          console.error("Search error:", error);
          setPredictions([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setPredictions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectPlace = async (placeId: string) => {
    setIsLoadingDetails(true);
    setPredictions([]);
    setSearchQuery("");

    try {
      const { data, error } = await supabase.functions.invoke("search-places", {
        body: { action: "details", placeId },
      });
      
      if (error) throw error;
      
      setSelectedPlace(data.place);
      setView("reviews");
    } catch (error) {
      console.error("Details error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de l'établissement.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleGenerateResponse = async (review: PlaceReview, index: number) => {
    if (!selectedPlace) return;
    
    setGeneratingReviewId(index);
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-demo-response", {
        body: { 
          review: {
            author_name: review.author_name,
            rating: review.rating,
            text: review.text,
          },
          businessName: selectedPlace.name,
        },
      });
      
      if (error) throw error;
      
      setAiResponses(prev => ({ ...prev, [index]: data.response }));
      
      toast({
        title: "🎉 Réponse générée !",
        description: "Voyez la puissance de l'IA pour vos avis.",
      });
    } catch (error) {
      console.error("Generate error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer la réponse.",
        variant: "destructive",
      });
    } finally {
      setGeneratingReviewId(null);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(index);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copié !" });
  };

  const handlePublish = () => {
    navigate("/auth?redirect=/choose-plan&from=demo");
  };

  const handleBack = () => {
    setView("search");
    setSelectedPlace(null);
    setAiResponses({});
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"
        }`}
      />
    ));
  };

  // Search View - SUPER CATCHY for FB Ads
  if (view === "search") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>

        <main className="relative z-10 container max-w-lg mx-auto px-4 py-6 min-h-screen flex flex-col">
          {/* Trust badges */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Badge className="bg-white/20 text-white border-white/30 text-xs">
              <Shield className="w-3 h-3 mr-1" />
              100% Gratuit
            </Badge>
            <Badge className="bg-white/20 text-white border-white/30 text-xs">
              <Zap className="w-3 h-3 mr-1" />
              Résultat en 3 sec
            </Badge>
          </div>

          {/* Hero - Emotional hook */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold px-4 py-2 rounded-full text-sm mb-4 animate-bounce">
              <Sparkles className="w-4 h-4" />
              DÉMO GRATUITE
            </div>
            
            <h1 className="text-3xl font-extrabold text-white mb-3 leading-tight">
              Voyez comment l'IA<br />
              <span className="text-yellow-400">répond à VOS avis</span>
            </h1>
            
            <p className="text-blue-100 text-lg">
              Trouvez votre établissement et testez<br />
              <span className="font-semibold text-white">la magie en 1 clic</span> 👇
            </p>
          </div>

          {/* Search Card */}
          <Card className="p-4 bg-white/95 backdrop-blur-sm shadow-2xl border-0 rounded-3xl mb-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600" />
              <Input
                type="text"
                placeholder="Votre restaurant, hôtel, boutique..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-base rounded-2xl border-2 border-blue-100 focus:border-blue-500 bg-blue-50/50"
                autoFocus
              />
              {isSearching && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-blue-600" />
              )}
            </div>

            {/* Predictions */}
            {predictions.length > 0 && (
              <div className="mt-3 divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {predictions.map((prediction) => (
                  <button
                    key={prediction.place_id}
                    onClick={() => handleSelectPlace(prediction.place_id)}
                    className="w-full px-3 py-3 flex items-start gap-3 hover:bg-blue-50 transition-colors text-left rounded-xl"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate">
                        {prediction.structured_formatting?.main_text || prediction.description}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {prediction.structured_formatting?.secondary_text || ""}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-blue-500 mt-2 shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* Loading Details */}
            {isLoadingDetails && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Social proof */}
          <div className="text-center text-white/80 text-sm mb-8">
            <span className="inline-flex items-center gap-1">
              <div className="flex -space-x-2">
                {["🇫🇷", "🇧🇪", "🇨🇭"].map((flag, i) => (
                  <span key={i} className="text-lg">{flag}</span>
                ))}
              </div>
              <span className="ml-2">+2,500 établissements utilisent Starlinko</span>
            </span>
          </div>

          {/* Benefits - Sticky bottom style */}
          <div className="mt-auto space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
                <Clock className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                <p className="text-white font-semibold text-sm">Gagnez 5h/sem</p>
                <p className="text-blue-200 text-xs">Réponses auto</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
                <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-1" />
                <p className="text-white font-semibold text-sm">+40% d'avis</p>
                <p className="text-blue-200 text-xs">En 30 jours</p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-white shrink-0" />
              <div>
                <p className="text-white font-semibold text-sm">Réponses personnalisées par IA</p>
                <p className="text-blue-200 text-xs">Adaptées à chaque avis client</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Reviews View - Show the magic
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0 -ml-2">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 truncate">
              {selectedPlace?.name}
            </h1>
            <div className="flex items-center gap-1">
              <div className="flex">{renderStars(Math.round(selectedPlace?.rating || 0))}</div>
              <span className="text-sm text-gray-600">{selectedPlace?.rating?.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-4 pb-36">
        {/* Magic CTA */}
        <Card className="p-4 mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 border-0 text-white rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h2 className="font-bold">Testez la magie ✨</h2>
              <p className="text-blue-100 text-sm">Cliquez sur un avis pour voir l'IA en action</p>
            </div>
          </div>
        </Card>

        {/* Reviews */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            Vos derniers avis Google
          </h3>

          {selectedPlace?.reviews?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Aucun avis disponible</p>
            </div>
          )}

          {selectedPlace?.reviews?.map((review, index) => (
            <Card key={index} className="overflow-hidden border-gray-200 shadow-md rounded-2xl">
              {/* Review Header */}
              <div className="p-4 pb-3">
                <div className="flex items-start gap-3">
                  {review.profile_photo_url ? (
                    <img 
                      src={review.profile_photo_url} 
                      alt={review.author_name}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-100"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                      {review.author_name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{review.author_name}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex">{renderStars(review.rating)}</div>
                      <span className="text-xs text-gray-500">
                        {review.relative_time_description}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Review Text */}
                {review.text && (
                  <p className="text-sm text-gray-700 mt-3 line-clamp-3">{review.text}</p>
                )}
              </div>

              {/* AI Response Section */}
              <div className="border-t border-gray-100">
                {aiResponses[index] ? (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-sm font-bold text-green-700">Réponse IA générée ✓</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{aiResponses[index]}</p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(aiResponses[index], index)}
                        className="flex-1 border-green-300 text-green-700 hover:bg-green-100"
                      >
                        {copiedId === index ? (
                          <Check className="w-4 h-4 mr-1.5" />
                        ) : (
                          <Copy className="w-4 h-4 mr-1.5" />
                        )}
                        {copiedId === index ? "Copié !" : "Copier"}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handlePublish}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                      >
                        Automatiser
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50">
                    <Button
                      onClick={() => handleGenerateResponse(review, index)}
                      disabled={generatingReviewId !== null}
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30"
                    >
                      {generatingReviewId === index ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Génération en cours...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Générer la réponse IA 🪄
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </main>

      {/* Fixed CTA - Premium style */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl">
        <div className="container max-w-lg mx-auto p-4">
          <Button 
            onClick={handlePublish} 
            className="w-full h-14 text-base font-bold rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-xl shadow-blue-500/30" 
            size="lg"
          >
            <Zap className="w-5 h-5 mr-2" />
            Automatiser TOUTES mes réponses
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-green-500" />
              Essai 3 jours gratuit
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-green-500" />
              Sans engagement
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileAds;
