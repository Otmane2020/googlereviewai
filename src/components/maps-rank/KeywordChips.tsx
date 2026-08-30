import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Search, Plus, History, X, TrendingUp, TrendingDown } from "lucide-react";
import { BrandSparkle } from "@/components/BrandSparkle";

interface SavedKeyword {
  id: string;
  keyword: string;
  last_avg_rank: number | null;
  scan_count: number;
  last_scanned_at: string;
}

interface KeywordChipsProps {
  userId: string;
  businessId: string;
  currentKeyword: string;
  onKeywordSelect: (keyword: string) => void;
  businessCategories?: string[];
}

export const KeywordChips = ({
  userId,
  businessId,
  currentKeyword,
  onKeywordSelect,
  businessCategories = [],
}: KeywordChipsProps) => {
  const [savedKeywords, setSavedKeywords] = useState<SavedKeyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPopover, setShowAddPopover] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");

  // Suggested keywords based on business categories
  const getSuggestions = (): string[] => {
    const baseSuggestions: Record<string, string[]> = {
      restaurant: ["restaurant", "dîner", "déjeuner", "menu", "terrasse"],
      italien: ["pizza", "pasta", "trattoria", "italien", "pizzeria"],
      français: ["bistrot", "brasserie", "cuisine française", "gastronomie"],
      japonais: ["sushi", "ramen", "japonais", "maki"],
      café: ["café", "coffee shop", "brunch", "petit-déjeuner"],
      boulangerie: ["boulangerie", "pain", "viennoiserie", "pâtisserie"],
      coiffeur: ["coiffeur", "salon de coiffure", "barbier", "coupe"],
      beauté: ["institut de beauté", "spa", "massage", "soin"],
      garage: ["garage", "mécanicien", "auto", "réparation voiture"],
      dentiste: ["dentiste", "cabinet dentaire", "orthodontiste"],
      médecin: ["médecin", "docteur", "cabinet médical"],
      avocat: ["avocat", "cabinet d'avocat", "juridique"],
      immobilier: ["agence immobilière", "immobilier", "appartement"],
      hotel: ["hôtel", "hébergement", "chambre d'hôte"],
    };

    const suggestions = new Set<string>();
    
    businessCategories.forEach(category => {
      const lowerCategory = category.toLowerCase();
      Object.entries(baseSuggestions).forEach(([key, values]) => {
        if (lowerCategory.includes(key)) {
          values.forEach(v => suggestions.add(v));
        }
      });
    });

    // Filter out already saved keywords
    const savedKeywordTexts = savedKeywords.map(k => k.keyword.toLowerCase());
    return Array.from(suggestions)
      .filter(s => !savedKeywordTexts.includes(s.toLowerCase()))
      .slice(0, 5);
  };

  useEffect(() => {
    const fetchKeywords = async () => {
      if (!userId || !businessId) return;
      
      setLoading(true);
      const { data } = await supabase
        .from("maps_rank_keywords")
        .select("*")
        .eq("user_id", userId)
        .eq("business_id", businessId)
        .order("last_scanned_at", { ascending: false })
        .limit(10);

      if (data) {
        setSavedKeywords(data as SavedKeyword[]);
      }
      setLoading(false);
    };

    fetchKeywords();
  }, [userId, businessId]);

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return;
    
    onKeywordSelect(newKeyword.trim());
    setNewKeyword("");
    setShowAddPopover(false);
  };

  const handleDeleteKeyword = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase
      .from("maps_rank_keywords")
      .delete()
      .eq("id", id);
    
    setSavedKeywords(prev => prev.filter(k => k.id !== id));
  };

  const suggestions = getSuggestions();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="space-y-3">
      {/* Recent Keywords */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <History className="w-3 h-3" />
          <span>Keywords récents</span>
        </div>
        
        {loading ? (
          <div className="flex gap-1.5">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-7 w-20 bg-muted animate-pulse rounded-full" />
            ))}
          </div>
        ) : savedKeywords.length > 0 ? (
          <ScrollArea className="w-full">
            <div className="flex gap-1.5 pb-1">
              {savedKeywords.map((kw) => (
                <Badge
                  key={kw.id}
                  variant={currentKeyword === kw.keyword ? "default" : "secondary"}
                  className="cursor-pointer hover:bg-primary/20 transition-colors group flex items-center gap-1 pr-1"
                  onClick={() => onKeywordSelect(kw.keyword)}
                >
                  <span className="truncate max-w-[100px]">{kw.keyword}</span>
                  {kw.last_avg_rank && (
                    <span className={`text-[10px] ml-1 ${
                      kw.last_avg_rank <= 3 ? "text-green-400" :
                      kw.last_avg_rank <= 7 ? "text-yellow-400" :
                      "text-red-400"
                    }`}>
                      #{kw.last_avg_rank.toFixed(0)}
                    </span>
                  )}
                  <button
                    onClick={(e) => handleDeleteKeyword(kw.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 p-0.5 hover:bg-destructive/20 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Lancez un scan pour sauvegarder vos mots-clés
          </p>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <BrandSparkle className="w-3 h-3" />
            <span>Suggestions</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((suggestion) => (
              <Badge
                key={suggestion}
                variant="outline"
                className="cursor-pointer hover:bg-primary/10 transition-colors text-xs"
                onClick={() => onKeywordSelect(suggestion)}
              >
                <Plus className="w-3 h-3 mr-1" />
                {suggestion}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Add Custom Keyword */}
      <Popover open={showAddPopover} onOpenChange={setShowAddPopover}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-full h-8 text-xs">
            <Plus className="w-3 h-3 mr-1" />
            Ajouter un mot-clé
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Nouveau mot-clé..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                className="pl-7 h-8 text-sm"
              />
            </div>
            <Button 
              size="sm" 
              className="w-full h-8"
              onClick={handleAddKeyword}
              disabled={!newKeyword.trim()}
            >
              Lancer le scan
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
