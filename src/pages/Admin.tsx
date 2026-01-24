import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Eye, 
  MousePointer, 
  TrendingUp, 
  Globe, 
  Calendar,
  RefreshCw,
  Trash2,
  Download,
  Shield
} from "lucide-react";
import { Loader2 } from "lucide-react";

const ADMIN_EMAIL = "benyahya.otmane@gmail.com";

interface VisitSession {
  date: string;
  page: string;
  referrer: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

interface VisitorData {
  visitorId: string;
  firstVisit: string;
  lastVisit: string;
  visitCount: number;
  pageViews: number;
  sessions: VisitSession[];
  utmHistory: {
    source: string;
    medium: string;
    campaign: string;
    date: string;
  }[];
}

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [visitorData, setVisitorData] = useState<VisitorData | null>(null);
  const [allVisitors, setAllVisitors] = useState<VisitorData[]>([]);

  // Check admin access
  useEffect(() => {
    if (!authLoading && (!user || user.email !== ADMIN_EMAIL)) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  // Load visitor data
  const loadData = () => {
    // Current visitor data
    const currentVisitor = localStorage.getItem("starlinko_visitor");
    if (currentVisitor) {
      setVisitorData(JSON.parse(currentVisitor));
    }

    // Collect all visitor keys (for demo, we only have current visitor in localStorage)
    const visitors: VisitorData[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("starlinko_visitor")) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || "");
          visitors.push(data);
        } catch {}
      }
    }
    setAllVisitors(visitors);
  };

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) {
      loadData();
    }
  }, [user]);

  const clearData = () => {
    if (confirm("Supprimer toutes les données de tracking ?")) {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith("starlinko_visitor") || key?.startsWith("starlinko_session")) {
          localStorage.removeItem(key);
        }
      }
      loadData();
    }
  };

  const exportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      visitors: allVisitors,
      currentVisitor: visitorData
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `starlinko-analytics-${new Date().toISOString().split("T")[0]}.json`;
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

  // Calculate stats
  const totalPageViews = visitorData?.pageViews || 0;
  const totalVisits = visitorData?.visitCount || 0;
  const uniquePages = [...new Set(visitorData?.sessions.map(s => s.page) || [])];
  const utmSources = visitorData?.utmHistory || [];
  
  // Page view breakdown
  const pageBreakdown: Record<string, number> = {};
  visitorData?.sessions.forEach(s => {
    pageBreakdown[s.page] = (pageBreakdown[s.page] || 0) + 1;
  });

  // UTM breakdown
  const utmBreakdown: Record<string, number> = {};
  visitorData?.sessions.forEach(s => {
    if (s.utmSource) {
      const key = `${s.utmSource}/${s.utmMedium || "direct"}`;
      utmBreakdown[key] = (utmBreakdown[key] || 0) + 1;
    }
  });

  // Referrer breakdown
  const referrerBreakdown: Record<string, number> = {};
  visitorData?.sessions.forEach(s => {
    const ref = s.referrer || "direct";
    const domain = ref === "direct" ? "Direct" : new URL(ref).hostname;
    referrerBreakdown[domain] = (referrerBreakdown[domain] || 0) + 1;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-24">
      <DashboardHeader />

      <main className="max-w-6xl mx-auto px-4 py-5 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Analytics</h1>
              <p className="text-sm text-muted-foreground">Statistiques de visite</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportData}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button variant="destructive" size="sm" onClick={clearData}>
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalPageViews}</p>
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
                  <p className="text-2xl font-bold">{totalVisits}</p>
                  <p className="text-xs text-muted-foreground">Sessions</p>
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
                  <p className="text-2xl font-bold">{uniquePages.length}</p>
                  <p className="text-xs text-muted-foreground">Pages uniques</p>
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
                  <p className="text-2xl font-bold">{utmSources.length}</p>
                  <p className="text-xs text-muted-foreground">UTM trackés</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visitor Info */}
        {visitorData && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Infos Visiteur
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Visitor ID</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">{visitorData.visitorId}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Première visite</span>
                <span>{new Date(visitorData.firstVisit).toLocaleString("fr-FR")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dernière visite</span>
                <span>{new Date(visitorData.lastVisit).toLocaleString("fr-FR")}</span>
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
              {Object.entries(pageBreakdown)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([page, count]) => (
                  <div key={page} className="flex items-center justify-between">
                    <code className="text-xs bg-muted px-2 py-1 rounded">{page}</code>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              {Object.keys(pageBreakdown).length === 0 && (
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
              {Object.entries(utmBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between">
                    <span className="text-sm">{source}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              {Object.keys(utmBreakdown).length === 0 && (
                <p className="text-sm text-muted-foreground">Aucun UTM tracké</p>
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
              {Object.entries(referrerBreakdown)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([ref, count]) => (
                  <div key={ref} className="flex items-center justify-between">
                    <span className="text-sm">{ref}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              {Object.keys(referrerBreakdown).length === 0 && (
                <p className="text-sm text-muted-foreground">Aucune donnée</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sessions récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {visitorData?.sessions.slice(-20).reverse().map((session, i) => (
                <div key={i} className="flex items-center justify-between text-xs border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-0.5 rounded">{session.page}</code>
                    {session.utmSource && (
                      <Badge variant="outline" className="text-[10px]">
                        {session.utmSource}
                      </Badge>
                    )}
                  </div>
                  <span className="text-muted-foreground">
                    {new Date(session.date).toLocaleString("fr-FR")}
                  </span>
                </div>
              ))}
              {!visitorData?.sessions.length && (
                <p className="text-sm text-muted-foreground">Aucune session</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default Admin;
