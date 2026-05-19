import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Eye, 
  MousePointer, 
  TrendingUp, 
  Globe, 
  Calendar,
  RefreshCw,
  Download,
  Shield,
  BarChart3
} from "lucide-react";
import { Loader2 } from "lucide-react";

const ADMIN_EMAIL = "benyahya.otmane@gmail.com";

interface AnalyticsData {
  stats: {
    uniqueVisitors: number;
    totalPageViews: number;
    days: number;
  };
  pageBreakdown: Record<string, number>;
  utmBreakdown: Record<string, number>;
  referrerBreakdown: Record<string, number>;
  dailyStats: { date: string; views: number; visitors: number }[];
  recentSessions: {
    id: string;
    visitor_id: string;
    page: string;
    referrer: string;
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    created_at: string;
  }[];
}

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("7");

  // Check admin access
  useEffect(() => {
    if (!authLoading && (!user || user.email !== ADMIN_EMAIL)) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  // Load analytics data
  const loadData = async () => {
    if (!user || user.email !== ADMIN_EMAIL) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-analytics', {
        body: null,
        headers: {},
      });

      // Use query params in URL workaround
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-analytics?days=${days}`,
        {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const analyticsData = await response.json();
        setAnalytics(analyticsData);
      } else {
        console.error('Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) {
      loadData();
    }
  }, [user, days]);

  const exportData = () => {
    if (!analytics) return;
    const blob = new Blob([JSON.stringify(analytics, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ranki.ai-analytics-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-24">


      <main className="max-w-6xl mx-auto px-4 py-5 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Analytics</h1>
              <p className="text-sm text-muted-foreground">Toutes les visites (connectés + anonymes)</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">24h</SelectItem>
                <SelectItem value="7">7 jours</SelectItem>
                <SelectItem value="30">30 jours</SelectItem>
                <SelectItem value="90">90 jours</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportData} disabled={!analytics}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : analytics ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Eye className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{analytics.stats.totalPageViews}</p>
                      <p className="text-xs text-muted-foreground">Pages vues</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{analytics.stats.uniqueVisitors}</p>
                      <p className="text-xs text-muted-foreground">Visiteurs uniques</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <MousePointer className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{Object.keys(analytics.pageBreakdown).length}</p>
                      <p className="text-xs text-muted-foreground">Pages visitées</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{Object.keys(analytics.utmBreakdown).length}</p>
                      <p className="text-xs text-muted-foreground">Campagnes UTM</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Daily Stats */}
            {analytics.dailyStats.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Évolution journalière
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.dailyStats.map(day => (
                      <div key={day.date} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{new Date(day.date).toLocaleDateString("fr-FR", { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                        <div className="flex gap-4">
                          <Badge variant="secondary">{day.views} vues</Badge>
                          <Badge variant="outline">{day.visitors} visiteurs</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Page Views Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Pages les plus visitées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(analytics.pageBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 15)
                    .map(([page, count]) => (
                      <div key={page} className="flex items-center justify-between">
                        <code className="text-xs bg-muted px-2 py-1 rounded">{page}</code>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  {Object.keys(analytics.pageBreakdown).length === 0 && (
                    <p className="text-sm text-muted-foreground">Aucune donnée</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* UTM Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Sources UTM (Facebook Ads, etc.)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(analytics.utmBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .map(([source, count]) => (
                      <div key={source} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{source}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  {Object.keys(analytics.utmBreakdown).length === 0 && (
                    <p className="text-sm text-muted-foreground">Aucun UTM tracké - Ajoutez ?utm_source=facebook&utm_medium=cpc à vos URLs</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Referrers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Sources de trafic
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(analytics.referrerBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([ref, count]) => (
                      <div key={ref} className="flex items-center justify-between">
                        <span className="text-sm">{ref}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  {Object.keys(analytics.referrerBreakdown).length === 0 && (
                    <p className="text-sm text-muted-foreground">Aucune donnée</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Sessions récentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {analytics.recentSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between text-xs border-b border-border/50 pb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="bg-muted px-2 py-0.5 rounded">{session.page}</code>
                        {session.utm_source && (
                          <Badge variant="outline" className="text-[10px]">
                            {session.utm_source}/{session.utm_medium || 'direct'}
                          </Badge>
                        )}
                        <span className="text-muted-foreground text-[10px]">
                          {session.visitor_id.substring(0, 10)}...
                        </span>
                      </div>
                      <span className="text-muted-foreground whitespace-nowrap">
                        {new Date(session.created_at).toLocaleString("fr-FR")}
                      </span>
                    </div>
                  ))}
                  {analytics.recentSessions.length === 0 && (
                    <p className="text-sm text-muted-foreground">Aucune session</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Error de chargement des données</p>
            <Button variant="outline" className="mt-4" onClick={loadData}>
              Retry
            </Button>
          </div>
        )}
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default Admin;
