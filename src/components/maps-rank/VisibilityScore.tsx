import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface VisibilityScoreProps {
  points: {
    rank_position: number | null;
    total_results: number;
  }[];
  keyword: string;
  previousAvgRank?: number | null;
}

export const VisibilityScore = ({ points, keyword, previousAvgRank }: VisibilityScoreProps) => {
  // Calculate visibility score (% in Top 10)
  const pointsWithRank = points.filter(p => p.rank_position !== null);
  const top10Count = pointsWithRank.filter(p => p.rank_position !== null && p.rank_position <= 10).length;
  const top3Count = pointsWithRank.filter(p => p.rank_position !== null && p.rank_position <= 3).length;
  
  const visibilityScore = points.length > 0 
    ? Math.round((top10Count / points.length) * 100) 
    : 0;
  
  const top3Percentage = points.length > 0 
    ? Math.round((top3Count / points.length) * 100) 
    : 0;

  // Calculate average rank
  const avgRank = pointsWithRank.length > 0
    ? pointsWithRank.reduce((sum, p) => sum + (p.rank_position || 0), 0) / pointsWithRank.length
    : 0;

  // Determine trend
  const getTrend = () => {
    if (previousAvgRank === null || previousAvgRank === undefined) return null;
    const diff = previousAvgRank - avgRank;
    if (Math.abs(diff) < 0.5) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  const trend = getTrend();

  // Get score color
  const getScoreColor = () => {
    if (visibilityScore >= 70) return "text-green-500";
    if (visibilityScore >= 40) return "text-yellow-500";
    if (visibilityScore >= 20) return "text-orange-500";
    return "text-red-500";
  };

  const getProgressColor = () => {
    if (visibilityScore >= 70) return "bg-green-500";
    if (visibilityScore >= 40) return "bg-yellow-500";
    if (visibilityScore >= 20) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <span className="font-medium text-sm">Score de Visibilité</span>
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs ${
              trend === 'up' ? 'text-green-500' : 
              trend === 'down' ? 'text-red-500' : 
              'text-muted-foreground'
            }`}>
              {trend === 'up' && <TrendingUp className="w-3 h-3" />}
              {trend === 'down' && <TrendingDown className="w-3 h-3" />}
              {trend === 'stable' && <Minus className="w-3 h-3" />}
              <span>{trend === 'up' ? 'Amélioration' : trend === 'down' ? 'Baisse' : 'Stable'}</span>
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className={`text-4xl font-bold ${getScoreColor()}`}>
            {visibilityScore}%
          </span>
          <span className="text-sm text-muted-foreground">visible en Top 10</span>
        </div>

        <div className="relative h-2 rounded-full bg-muted overflow-hidden mb-3">
          <div 
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: `${visibilityScore}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-background/50 rounded-lg p-2">
            <div className="text-lg font-bold text-green-500">{top3Percentage}%</div>
            <div className="text-[10px] text-muted-foreground">Top 3</div>
          </div>
          <div className="bg-background/50 rounded-lg p-2">
            <div className="text-lg font-bold text-primary">
              {avgRank > 0 ? `#${avgRank.toFixed(1)}` : "–"}
            </div>
            <div className="text-[10px] text-muted-foreground">Rang moyen</div>
          </div>
          <div className="bg-background/50 rounded-lg p-2">
            <div className="text-lg font-bold text-muted-foreground">
              {points.length - pointsWithRank.length}
            </div>
            <div className="text-[10px] text-muted-foreground">Absents</div>
          </div>
        </div>

        {keyword && (
          <div className="mt-3 pt-3 border-t border-primary/20">
            <div className="text-xs text-muted-foreground">
              Keyword analysé : <span className="font-medium text-foreground">"{keyword}"</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
