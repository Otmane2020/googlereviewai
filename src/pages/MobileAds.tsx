import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
  Shield,
  MessageSquare
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

  // Search View - Redesigned for Facebook Ads
  if (view === "search") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-blue-700">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/10 backdrop-blur-lg border-b border-white/10">
          <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-center">
            <StarlinkoLogo className="h-7" />
          </div>
        </header>

        <main className="container max-w-lg mx-auto px-4 py-6">
          {/* Hero Section - Attention Grabbing */}
          <div className="text-center mb-6">
            {/* Animated Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-4 animate-pulse">
              <Zap className="w-4 h-4" />
              <span>+2000 entreprises nous font confiance</span>
            </div>
            
            <h1 className="text-3xl font-extrabold text-white mb-3 leading-tight">
              Répondez à vos avis Google en <span className="text-yellow-300">2 secondes</span> ⚡
            </h1>
            
            <p className="text-white/90 text-lg mb-2">
              L'IA qui répond à vos clients <span className="font-semibold">à votre place</span>
            </p>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-4 text-white/70 text-xs mt-4">
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>100% Gratuit</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>30 sec</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>+40% visibilité</span>
              </div>
            </div>
          </div>

          {/* Search Card - Premium Look */}
          <Card className="p-5 bg-white/95 backdrop-blur-lg shadow-2xl border-0 rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">Testez gratuitement</h2>
                <p className="text-xs text-muted-foreground">Trouvez votre établissement Google</p>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Ex: Restaurant Le Petit Bistrot, Paris..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-base rounded-2xl border-2 border-primary/20 focus:border-primary bg-muted/30"
                autoFocus
              />
              {isSearching && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-primary" />
              )}
            </div>

            {/* Loading Details */}
            {isLoadingDetails && (
              <div className="space-y-3 py-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-14 h-14 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </div>
            )}

            {/* Predictions */}
            {predictions.length > 0 && (
              <div className="divide-y divide-border rounded-xl overflow-hidden border">
                {predictions.map((prediction) => (
                  <button
                    key={prediction.place_id}
                    onClick={() => handleSelectPlace(prediction.place_id)}
                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-primary/5 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
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
              </div>
            )}

            {/* Empty State - More Engaging */}
            {searchQuery.length < 3 && !isLoadingDetails && (
              <div className="text-center py-4">
                <div className="flex items-center justify-center gap-3 text-muted-foreground mb-2">
                  <Search className="w-5 h-5" />
                  <ArrowRight className="w-4 h-4" />
                  <MessageSquare className="w-5 h-5" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Tapez le nom de votre établissement pour commencer
                </p>
              </div>
            )}
          </Card>

          {/* Social Proof */}
          <div className="mt-6 text-center">
            <p className="text-white/60 text-xs mb-3">Ils ont automatisé leurs réponses :</p>
            <div className="flex items-center justify-center gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold"
                  style={{ marginLeft: i > 1 ? '-8px' : '0' }}
                >
                  {['JD', 'ML', 'SA', 'PR', 'LC'][i-1]}
                </div>
              ))}
              <span className="text-white/80 text-sm font-medium ml-2">+2,847</span>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-8 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
              </div>
              <p className="text-white text-sm font-medium">
                "Gain de temps incroyable, mes clients sont ravis !"
              </p>
              <p className="text-white/60 text-xs mt-1">— Marie L., Restaurant Paris 11e</p>
            </div>
          </div>
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
        {/* Success Banner */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl p-4 mb-6 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold">Établissement trouvé !</p>
              <p className="text-sm text-white/90">Découvrez la magie de l'IA ci-dessous 👇</p>
            </div>
          </div>
        </div>

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
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              Vos derniers avis
            </h3>
            <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-full">
              Cliquez pour tester l'IA
            </span>
          </div>

          {selectedPlace?.reviews?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucun avis disponible</p>
            </div>
          )}

          {selectedPlace?.reviews?.map((review, index) => (
            <Card key={index} className="p-4 space-y-3 hover:shadow-md transition-shadow">
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
                <div className="bg-gradient-to-br from-primary/10 to-emerald-500/10 rounded-xl p-4 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-primary">Réponse IA générée ✨</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{aiResponses[index]}</p>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(aiResponses[index], index)}
                      className="flex-1 rounded-xl"
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
                      className="flex-1 rounded-xl bg-gradient-to-r from-primary to-blue-600"
                    >
                      Publier sur Google
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
                  className="w-full rounded-xl border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 h-12"
                >
                  {generatingReviewId === index ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      L'IA écrit...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 text-primary" />
                      <span className="text-primary font-medium">Tester l'IA sur cet avis</span>
                    </>
                  )}
                </Button>
              )}
            </Card>
          ))}
        </div>
      </main>

      {/* Fixed CTA - More Compelling */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-8 pb-4 px-4">
        <div className="container max-w-lg mx-auto">
          <Button 
            onClick={handlePublish} 
            className="w-full h-14 text-base rounded-2xl bg-gradient-to-r from-primary via-blue-600 to-primary shadow-xl shadow-primary/30" 
            size="lg"
          >
            <Zap className="w-5 h-5 mr-2" />
            Automatiser toutes mes réponses
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <div className="flex items-center justify-center gap-4 mt-3">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-500" />
              3 jours gratuits
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-500" />
              Sans CB
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-500" />
              Annulation facile
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileAds;
