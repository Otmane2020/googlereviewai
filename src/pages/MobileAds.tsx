import { useState, useEffect, useCallback } from "react";
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
  ChevronLeft
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { StarlinkoLogo } from "@/components/StarlinkoLogo";

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
        title: "Réponse générée !",
        description: "L'IA a créé une réponse personnalisée.",
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
    // Redirect to checkout with demo context
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

  // Search View
  if (view === "search") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
          <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-center">
            <StarlinkoLogo className="h-7" />
          </div>
        </header>

        <main className="container max-w-lg mx-auto px-4 py-8">
          {/* Hero */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary/30">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Trouvez votre établissement
            </h1>
            <p className="text-muted-foreground">
              Recherchez votre business et découvrez comment l'IA peut répondre à vos avis Google
            </p>
          </div>

          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Nom de l'établissement, ville..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-base rounded-2xl border-2 focus:border-primary"
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-primary" />
            )}
          </div>

          {/* Loading Details */}
          {isLoadingDetails && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
            </Card>
          )}

          {/* Predictions */}
          {predictions.length > 0 && (
            <Card className="overflow-hidden divide-y divide-border">
              {predictions.map((prediction) => (
                <button
                  key={prediction.place_id}
                  onClick={() => handleSelectPlace(prediction.place_id)}
                  className="w-full px-4 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {prediction.structured_formatting?.main_text || prediction.description}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {prediction.structured_formatting?.secondary_text || ""}
                    </p>
                  </div>
                </button>
              ))}
            </Card>
          )}

          {/* Empty State */}
          {searchQuery.length < 3 && !isLoadingDetails && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Commencez à taper pour rechercher</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Reviews View
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground truncate">
              {selectedPlace?.name}
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              {selectedPlace?.formatted_address}
            </p>
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6 pb-32">
        {/* Business Card */}
        {selectedPlace && (
          <Card className="p-4 mb-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <div className="flex items-center gap-4">
              {selectedPlace.photoUrl ? (
                <img 
                  src={selectedPlace.photoUrl} 
                  alt={selectedPlace.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-foreground truncate">{selectedPlace.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex">{renderStars(Math.round(selectedPlace.rating || 0))}</div>
                  <span className="text-sm font-medium">{selectedPlace.rating?.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">
                    ({selectedPlace.user_ratings_total} avis)
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Reviews */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            Derniers avis
          </h3>

          {selectedPlace?.reviews?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucun avis disponible</p>
            </div>
          )}

          {selectedPlace?.reviews?.map((review, index) => (
            <Card key={index} className="p-4 space-y-3">
              {/* Review Header */}
              <div className="flex items-start gap-3">
                {review.profile_photo_url ? (
                  <img 
                    src={review.profile_photo_url} 
                    alt={review.author_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {review.author_name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{review.author_name}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex">{renderStars(review.rating)}</div>
                    <span className="text-xs text-muted-foreground">
                      {review.relative_time_description}
                    </span>
                  </div>
                </div>
              </div>

              {/* Review Text */}
              {review.text && (
                <p className="text-sm text-foreground/80 line-clamp-3">{review.text}</p>
              )}

              {/* AI Response */}
              {aiResponses[index] ? (
                <div className="bg-primary/5 rounded-xl p-3 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-primary">Réponse IA</span>
                  </div>
                  <p className="text-sm text-foreground">{aiResponses[index]}</p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(aiResponses[index], index)}
                      className="flex-1"
                    >
                      {copiedId === index ? (
                        <Check className="w-4 h-4 mr-2" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      {copiedId === index ? "Copié" : "Copier"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handlePublish}
                      className="flex-1"
                    >
                      Publier
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateResponse(review, index)}
                  disabled={generatingReviewId !== null}
                  className="w-full"
                >
                  {generatingReviewId === index ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Générer une réponse IA
                    </>
                  )}
                </Button>
              )}
            </Card>
          ))}
        </div>
      </main>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border p-4">
        <div className="container max-w-lg mx-auto">
          <Button onClick={handlePublish} className="w-full h-14 text-base rounded-2xl" size="lg">
            <Sparkles className="w-5 h-5 mr-2" />
            Automatiser mes réponses
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Essai gratuit • Sans engagement
          </p>
        </div>
      </div>
    </div>
  );
};

export default MobileAds;
