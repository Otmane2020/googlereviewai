import { useNavigate } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
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
  const { i18n } = useTranslation();
  const tr = (fr: string, en: string) => i18n.language?.startsWith("fr") ? fr : en;

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
        title: tr(`Absent de ${Math.round((notFoundCount / totalPoints) * 100)} % des zones`, `Not found in ${Math.round((notFoundCount / totalPoints) * 100)}% of areas`),
        description: tr(`Votre établissement n'apparaît pas dans ${notFoundCount} zones sur ${totalPoints}. Créez des FAQ GEO pour améliorer votre visibilité.`, `Your business is absent from ${notFoundCount} of ${totalPoints} areas. Build helpful GEO FAQs to improve visibility.`),
        action: {
          label: tr("Créer une FAQ GEO", "Create a GEO FAQ"),
          path: "/geo-rank",
          params: { keyword, business_id: businessId },
        },
      });
    }

    // 2. Low rank average
    if (avgRank > 5 && rankedPoints.length > 0) {
      recommendations.push({
        type: "improvement",
        icon: <TrendingUp className="w-4 h-4" />,
        title: tr(`Position moyenne ${avgRank.toFixed(1)} à améliorer`, `Average rank #${avgRank.toFixed(1)} needs improvement`),
        description: tr(`Une position moyenne au-delà de 5 réduit votre visibilité. Publiez du contenu SEO pour « ${keyword} ».`, `An average rank above 5 reduces visibility. Publish SEO content for "${keyword}".`),
        action: {
          label: tr("Créer un article SEO", "Create SEO content"),
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
        title: tr(`Zone à améliorer : ${dominantWeakZone[0]}`, `Weak area: ${dominantWeakZone[0]}`),
        description: tr(`Votre classement est faible vers ${dominantWeakZone[0]}. Ciblez cette zone dans vos contenus.`, `Your ranking is weak toward ${dominantWeakZone[0]}. Target the area in your content.`),
        action: {
          label: tr("Améliorer la zone", "Improve this area"),
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
        title: tr("Bonne performance !", "Strong performance!"),
        description: tr(`Vous figurez dans le top 3 de ${Math.round((top3Count / totalPoints) * 100)} % des zones. Continuez à publier régulièrement.`, `You rank in the top 3 in ${Math.round((top3Count / totalPoints) * 100)}% of areas. Keep publishing useful content.`),
      });
    }

    // 5. Keyword optimization opportunity
    if (recommendations.length < 3 && rankedPoints.length > 0) {
      recommendations.push({
        type: "improvement",
        icon: <Lightbulb className="w-4 h-4" />,
        title: tr("Optimisez votre fiche Google", "Optimize your Google listing"),
        description: tr(`Utilisez « ${keyword} » naturellement dans votre description et vos contenus.`, `Use "${keyword}" naturally in your business description and posts.`),
        action: {
          label: tr("Créer du contenu", "Create content"),
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
          {tr("Recommandations", "Recommendations")}
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
