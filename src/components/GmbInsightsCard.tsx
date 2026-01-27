import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Globe, Phone, MapPin, RefreshCw, Loader2, TrendingUp, MessageSquare, Calendar, UtensilsCrossed } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GmbInsights {
  profileViews: number;
  websiteClicks: number;
  phoneCalls: number;
  directionRequests: number;
  bookings: number;
  conversations: number;
  foodOrders: number;
  period: string;
  businessCount: number;
}

interface GmbInsightsCardProps {
  userId: string;
}

export function GmbInsightsCard({ userId }: GmbInsightsCardProps) {
  const navigate = useNavigate();
  const [insights, setInsights] = useState<GmbInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresReconnect, setRequiresReconnect] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("get-gmb-insights", {
        body: { days: 30 },
      });

      if (fnError) throw fnError;

      if (data?.requires_reconnect) {
        setRequiresReconnect(true);
        setInsights(null);
      } else if (data?.insights) {
        setInsights(data.insights);
        setRequiresReconnect(false);
      } else if (data?.error) {
        setError(data.error);
      }
    } catch (e) {
      console.error("[GmbInsights] Error:", e);
      setError("Impossible de charger les statistiques");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchInsights();
    }
  }, [userId]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const stats = [
    {
      label: "Vues du profil",
      value: insights?.profileViews || 0,
      icon: Eye,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      label: "Clics site web",
      value: insights?.websiteClicks || 0,
      icon: Globe,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Appels",
      value: insights?.phoneCalls || 0,
      icon: Phone,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Itinéraires",
      value: insights?.directionRequests || 0,
      icon: MapPin,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
  ];

  // Additional stats if they exist
  const additionalStats = [
    insights?.bookings && insights.bookings > 0 && {
      label: "Réservations",
      value: insights.bookings,
      icon: Calendar,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    insights?.conversations && insights.conversations > 0 && {
      label: "Messages",
      value: insights.conversations,
      icon: MessageSquare,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
    insights?.foodOrders && insights.foodOrders > 0 && {
      label: "Commandes",
      value: insights.foodOrders,
      icon: UtensilsCrossed,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ].filter(Boolean) as typeof stats;

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Performances Google
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (requiresReconnect) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            Performances Google
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Reconnectez Google pour voir les statistiques.
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate("/settings")}
          >
            Reconnecter
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Performances Google
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchInsights}
            className="mt-2"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Performances Google
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchInsights}
          className="h-8 px-2"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main 4 metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex flex-col items-center p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className={`p-2 rounded-full ${stat.bgColor} mb-2`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span className="text-2xl font-bold">{formatNumber(stat.value)}</span>
                <span className="text-xs text-muted-foreground text-center">{stat.label}</span>
              </div>
            );
          })}
        </div>

        {/* Additional metrics if any */}
        {additionalStats.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {additionalStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                >
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                  <div>
                    <span className="font-semibold">{formatNumber(stat.value)}</span>
                    <span className="text-xs text-muted-foreground ml-1">{stat.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Period indicator */}
        <div className="flex items-center justify-center">
          <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">
            30 derniers jours
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
