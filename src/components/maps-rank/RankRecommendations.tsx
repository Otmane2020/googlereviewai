import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Lightbulb, 
  MessageSquare, 
  FileText, 
  AlertTriangle, 
  TrendingUp,
  MapPin,
  ArrowRight 
} from "lucide-react";

interface ScanPoint {
  label: string;
  lat: number;
  lng: number;
  rank_position: number | null;
  total_results: number;
  competitors: { name: string; placeId: string; address: string; rating: number | null }[];
  direction?: string;
  distance?: number;
}

interface RankRecommendationsProps {
  points: ScanPoint[];
  keyword: string;
  businessId: string;
}

interface Recommendation {
  type: "warning" | "improvement" | "success";
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    path: string;
    params?: Record<string, string>;
  };
}

export const RankRecommendations = ({ points, keyword, businessId }: RankRecommendationsProps) => {
  const navigate = useNavigate();

  const generateRecommendations = (): Recommendation[] => {
    const recommendations: Recommendation[] = [];
    const totalPoints = points.length;
    
    // Count ranks
    const rankedPoints = points.filter(p => p.rank_position !== null);
    const top3Count = rankedPoints.filter(p => p.rank_position! <= 3).length;
    const notFoundCount = points.filter(p => p.rank_position === null).length;
    const lowRankPoints = rankedPoints.filter(p => p.rank_position! > 7);
    
    // Avg rank
    const avgRank = rankedPoints.length > 0
      ? rankedPoints.reduce((sum, p) => sum + (p.rank_position || 0), 0) / rankedPoints.length
      : 0;

    // Find weak zones (grouped by direction)
    const weakZones = points
      .filter(p => p.rank_position === null || p.rank_position > 7)
      .map(p => p.direction)
      .filter(Boolean);
    
    const weakZoneCount: Record<string, number> = {};
    weakZones.forEach(zone => {
      if (zone) {
        weakZoneCount[zone] = (weakZoneCount[zone] || 0) + 1;
      }
    });

    const dominantWeakZone = Object.entries(weakZoneCount)
      .sort(([, a], [, b]) => b - a)[0];

    // Generate recommendations based on analysis
    
    // 1. High not found rate
    if (notFoundCount / totalPoints > 0.4) {
      recommendations.push({
        type: "warning",
        icon: <AlertTriangle className="w-4 h-4" />,
        title: `Absent de ${Math.round((notFoundCount / totalPoints) * 100)}% des zones`,
        description: `Votre établissement n'apparaît pas dans ${notFoundCount} zones sur ${totalPoints}. Créez du contenu Q&A pour améliorer votre visibilité.`,
        action: {
          label: "Créer Q&A AEO",
          path: "/aeo-rank",
          params: { keyword, business_id: businessId },
        },
      });
    }

    // 2. Low rank average
    if (avgRank > 5 && rankedPoints.length > 0) {
      recommendations.push({
        type: "improvement",
        icon: <TrendingUp className="w-4 h-4" />,
        title: `Rang moyen #${avgRank.toFixed(1)} à améliorer`,
        description: `Un rang moyen supérieur à 5 réduit vos chances d'être vu. Publiez du contenu SEO optimisé pour "${keyword}".`,
        action: {
          label: "Créer post SEO",
          path: "/seo-auto-post",
          params: { keyword, business_id: businessId },
        },
      });
    }

    // 3. Weak in specific direction
    if (dominantWeakZone && dominantWeakZone[1] >= 2) {
      recommendations.push({
        type: "warning",
        icon: <MapPin className="w-4 h-4" />,
        title: `Zone faible : ${dominantWeakZone[0]}`,
        description: `Vous êtes mal positionné vers le ${dominantWeakZone[0]}. Ciblez cette zone dans vos publications.`,
        action: {
          label: "Améliorer zone",
          path: "/seo-auto-post",
          params: { keyword: `${keyword} ${dominantWeakZone[0].toLowerCase()}`, business_id: businessId },
        },
      });
    }

    // 4. Good performance
    if (top3Count / totalPoints > 0.5) {
      recommendations.push({
        type: "success",
        icon: <TrendingUp className="w-4 h-4" />,
        title: "Bonne performance !",
        description: `Vous êtes dans le Top 3 sur ${Math.round((top3Count / totalPoints) * 100)}% des zones. Maintenez votre visibilité avec du contenu régulier.`,
      });
    }

    // 5. Keyword optimization opportunity
    if (recommendations.length < 3 && rankedPoints.length > 0) {
      recommendations.push({
        type: "improvement",
        icon: <Lightbulb className="w-4 h-4" />,
        title: "Optimisez votre profil Google",
        description: `Ajoutez "${keyword}" dans votre description et vos posts pour améliorer votre classement.`,
        action: {
          label: "Generate du contenu",
          path: "/seo-auto-post",
          params: { keyword, business_id: businessId },
        },
      });
    }

    return recommendations;
  };

  const recommendations = generateRecommendations();

  const handleAction = (action: Recommendation["action"]) => {
    if (!action) return;
    
    const params = new URLSearchParams(action.params || {});
    navigate(`${action.path}?${params.toString()}`);
  };

  const getTypeStyles = (type: Recommendation["type"]) => {
    switch (type) {
      case "warning":
        return {
          bg: "bg-orange-500/10",
          border: "border-orange-500/20",
          badge: "bg-orange-500/20 text-orange-600",
        };
      case "improvement":
        return {
          bg: "bg-blue-500/10",
          border: "border-blue-500/20",
          badge: "bg-blue-500/20 text-blue-600",
        };
      case "success":
        return {
          bg: "bg-green-500/10",
          border: "border-green-500/20",
          badge: "bg-green-500/20 text-green-600",
        };
    }
  };

  if (recommendations.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          Recommandations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-auto max-h-64">
          <div className="space-y-3">
            {recommendations.map((rec, i) => {
              const styles = getTypeStyles(rec.type);
              return (
                <div
                  key={i}
                  className={`p-3 rounded-lg border ${styles.bg} ${styles.border}`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`p-1.5 rounded ${styles.badge}`}>
                      {rec.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{rec.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {rec.description}
                      </p>
                      {rec.action && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 mt-2 text-xs"
                          onClick={() => handleAction(rec.action)}
                        >
                          {rec.action.label}
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
