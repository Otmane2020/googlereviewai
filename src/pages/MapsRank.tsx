import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireSubscription } from "@/hooks/useRequireSubscription";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { RankingMap } from "@/components/RankingMap";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { MapPin, Search, Grid3X3, History, Loader2, Target, Building2, Star, Users } from "lucide-react";

interface Business {
  id: string;
  name: string;
  google_place_id: string | null;
  address: string | null;
}

interface Competitor {
  name: string;
  placeId: string;
  address: string;
  rating: number | null;
}

interface ScanPoint {
  label: string;
  lat: number;
  lng: number;
  rank_position: number | null;
  total_results: number;
  competitors: Competitor[];
}

interface Scan {
  id: string;
  keyword: string;
  grid_size: number;
  spacing_m: number;
  status: string;
  created_at: string;
  center_lat: number;
  center_lng: number;
}

interface ScanResult {
  scan_id: string;
  center: { lat: number; lng: number };
  points: ScanPoint[];
  success: boolean;
  error?: string;
}

const MapsRank = () => {
  const { user, loading: authLoading } = useAuth();
  const { loading: subLoading } = useRequireSubscription();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [keyword, setKeyword] = useState("");
  const [gridSize, setGridSize] = useState<string>("3");
  const [spacing, setSpacing] = useState<string>("1000");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<Scan[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<ScanPoint | null>(null);

  // Fetch businesses on mount
  useEffect(() => {
    if (!user) return;

    const fetchBusinesses = async () => {
      const { data } = await supabase
        .from("businesses")
        .select("id, name, google_place_id, address")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (data) {
        setBusinesses(data);
        if (data.length > 0 && !selectedBusiness) {
          setSelectedBusiness(data[0].id);
        }
      }
    };

    fetchBusinesses();
  }, [user]);

  // Fetch scan history when business changes
  useEffect(() => {
    if (!user || !selectedBusiness) return;

    const fetchHistory = async () => {
      setLoadingHistory(true);
      const { data } = await supabase
        .from("maps_rank_scans")
        .select("*")
        .eq("user_id", user.id)
        .eq("business_id", selectedBusiness)
        .order("created_at", { ascending: false })
        .limit(10);

      if (data) {
        setHistory(data as Scan[]);
      }
      setLoadingHistory(false);
    };

    fetchHistory();
  }, [user, selectedBusiness]);

  const handleScan = async () => {
    if (!selectedBusiness || !keyword.trim()) {
      toast.error("Sélectionnez un établissement et entrez un mot-clé");
      return;
    }

    const business = businesses.find(b => b.id === selectedBusiness);
    if (!business?.google_place_id) {
      toast.error("Cet établissement n'est pas connecté à Google. Reconnectez-le dans Établissements.");
      return;
    }

    setIsScanning(true);
    setScanResult(null);
    setSelectedPoint(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-maps-ranking`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            business_id: selectedBusiness,
            keyword: keyword.trim(),
            grid_size: parseInt(gridSize),
            spacing_m: parseInt(spacing),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Erreur lors du scan");
      }

      setScanResult(result);
      toast.success(`Scan terminé ! ${result.points.length} points analysés`);

      // Refresh history
      const { data: newHistory } = await supabase
        .from("maps_rank_scans")
        .select("*")
        .eq("user_id", user?.id)
        .eq("business_id", selectedBusiness)
        .order("created_at", { ascending: false })
        .limit(10);

      if (newHistory) {
        setHistory(newHistory as Scan[]);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      toast.error(message);
    } finally {
      setIsScanning(false);
    }
  };

  const loadScanFromHistory = async (scanId: string) => {
    try {
      const { data: pointsData } = await supabase
        .from("maps_rank_scan_points")
        .select("label, lat, lng, rank_position, total_results, competitors")
        .eq("scan_id", scanId);

      const { data: scan } = await supabase
        .from("maps_rank_scans")
        .select("id, keyword, grid_size, spacing_m, status, created_at, center_lat, center_lng")
        .eq("id", scanId)
        .single();
      
      // Transform competitors from JSON to typed array
      const points: ScanPoint[] = (pointsData || []).map((p) => ({
        label: p.label,
        lat: p.lat,
        lng: p.lng,
        rank_position: p.rank_position,
        total_results: p.total_results || 0,
        competitors: Array.isArray(p.competitors) ? (p.competitors as unknown as Competitor[]) : [],
      }));

      if (points.length > 0 && scan) {
        const scanData = scan as Scan;
        setScanResult({
          scan_id: scanId,
          center: { lat: scanData.center_lat, lng: scanData.center_lng },
          points,
          success: true,
        });
        setKeyword(scanData.keyword);
        setGridSize(scanData.grid_size.toString());
        setSpacing(scanData.spacing_m.toString());
        setSelectedPoint(null);
        toast.success("Scan chargé depuis l'historique");
      }
    } catch (error) {
      toast.error("Erreur lors du chargement du scan");
    }
  };

  const getRankColor = (rank: number | null): string => {
    if (rank === null) return "bg-muted-foreground/50";
    if (rank <= 3) return "bg-green-500";
    if (rank <= 7) return "bg-yellow-500";
    if (rank <= 10) return "bg-orange-500";
    return "bg-red-500";
  };

  const getRankBadgeVariant = (rank: number | null): "default" | "secondary" | "destructive" | "outline" => {
    if (rank === null) return "secondary";
    if (rank <= 3) return "default";
    if (rank <= 7) return "outline";
    return "destructive";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate stats
  const getStats = () => {
    if (!scanResult) return null;
    const top3 = scanResult.points.filter(p => p.rank_position && p.rank_position <= 3).length;
    const rank4to7 = scanResult.points.filter(p => p.rank_position && p.rank_position >= 4 && p.rank_position <= 7).length;
    const rank8to10 = scanResult.points.filter(p => p.rank_position && p.rank_position >= 8 && p.rank_position <= 10).length;
    const notFound = scanResult.points.filter(p => !p.rank_position).length;
    const avgRank = scanResult.points
      .filter(p => p.rank_position)
      .reduce((sum, p) => sum + (p.rank_position || 0), 0) / (scanResult.points.length - notFound) || 0;
    
    return { top3, rank4to7, rank8to10, notFound, avgRank };
  };

  // Aggregate top competitors across all points
  const getTopCompetitors = () => {
    if (!scanResult) return [];
    
    const competitorMap = new Map<string, { name: string; address: string; rating: number | null; appearances: number; avgPosition: number }>();
    
    scanResult.points.forEach(point => {
      point.competitors.forEach((comp, idx) => {
        const existing = competitorMap.get(comp.placeId);
        if (existing) {
          existing.appearances += 1;
          existing.avgPosition = (existing.avgPosition * (existing.appearances - 1) + (idx + 1)) / existing.appearances;
        } else {
          competitorMap.set(comp.placeId, {
            name: comp.name,
            address: comp.address,
            rating: comp.rating,
            appearances: 1,
            avgPosition: idx + 1,
          });
        }
      });
    });
    
    return Array.from(competitorMap.values())
      .sort((a, b) => b.appearances - a.appearances)
      .slice(0, 10);
  };

  const stats = getStats();
  const topCompetitors = getTopCompetitors();
  const selectedBusinessData = businesses.find(b => b.id === selectedBusiness);

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Target className="w-6 h-6 text-primary" />
              Maps Rank
            </h1>
            <p className="text-muted-foreground mt-1">
              Analysez votre positionnement sur Google Maps par zone géographique
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Configuration Panel */}
          <Card className="lg:col-span-3">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Grid3X3 className="w-4 h-4" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Business selector */}
              <div className="space-y-2">
                <Label htmlFor="business" className="text-xs">Établissement</Label>
                <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3 h-3" />
                          <span className="truncate">{b.name}</span>
                          {!b.google_place_id && (
                            <Badge variant="destructive" className="text-[10px] px-1">!</Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Keyword */}
              <div className="space-y-2">
                <Label htmlFor="keyword" className="text-xs">Mot-clé</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    id="keyword"
                    placeholder="restaurant italien"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="pl-8 h-9 text-sm"
                  />
                </div>
              </div>

              {/* Grid size */}
              <div className="space-y-2">
                <Label className="text-xs">Grille</Label>
                <Select value={gridSize} onValueChange={setGridSize}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3×3 (9 pts)</SelectItem>
                    <SelectItem value="5">5×5 (25 pts)</SelectItem>
                    <SelectItem value="7">7×7 (49 pts)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Spacing */}
              <div className="space-y-2">
                <Label className="text-xs">Espacement</Label>
                <Select value={spacing} onValueChange={setSpacing}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="500">500 m</SelectItem>
                    <SelectItem value="1000">1 km</SelectItem>
                    <SelectItem value="2000">2 km</SelectItem>
                    <SelectItem value="3000">3 km</SelectItem>
                    <SelectItem value="5000">5 km</SelectItem>
                    <SelectItem value="10000">10 km</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Scan button */}
              <Button
                onClick={handleScan}
                disabled={isScanning || !selectedBusiness || !keyword.trim()}
                className="w-full"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scan...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Lancer le scan
                  </>
                )}
              </Button>

              {/* History */}
              {history.length > 0 && (
                <div className="pt-4 border-t">
                  <h3 className="font-medium text-xs mb-2 flex items-center gap-1.5 text-muted-foreground">
                    <History className="w-3.5 h-3.5" />
                    Historique
                  </h3>
                  <ScrollArea className="h-32">
                    <div className="space-y-1.5 pr-2">
                      {loadingHistory ? (
                        <Skeleton className="h-8 w-full" />
                      ) : (
                        history.map((scan) => (
                          <button
                            key={scan.id}
                            onClick={() => loadScanFromHistory(scan.id)}
                            className="w-full text-left p-2 rounded-lg border hover:bg-muted transition-colors text-xs"
                          >
                            <div className="font-medium truncate">{scan.keyword}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {scan.grid_size}×{scan.grid_size} • {formatDate(scan.created_at)}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Map & Results Panel */}
          <div className="lg:col-span-6 space-y-4">
            {/* Map */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="w-4 h-4" />
                  Carte de classement
                </CardTitle>
                {scanResult && (
                  <CardDescription className="text-xs">
                    Cliquez sur un point pour voir les détails
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {!scanResult ? (
                  <div className="w-full h-[400px] bg-muted/50 rounded-xl flex flex-col items-center justify-center text-center p-6">
                    <MapPin className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground text-sm">
                      Configurez et lancez un scan pour voir votre classement sur la carte
                    </p>
                  </div>
                ) : (
                  <RankingMap
                    center={scanResult.center}
                    points={scanResult.points}
                    spacing={parseInt(spacing)}
                    gridSize={parseInt(gridSize)}
                    selectedPoint={selectedPoint}
                    onPointSelect={setSelectedPoint}
                    businessName={selectedBusinessData?.name}
                  />
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.top3}</div>
                    <div className="text-[10px] text-muted-foreground">Top 3</div>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-500/10 border-yellow-500/20">
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.rank4to7}</div>
                    <div className="text-[10px] text-muted-foreground">Rang 4-7</div>
                  </CardContent>
                </Card>
                <Card className="bg-orange-500/10 border-orange-500/20">
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.rank8to10}</div>
                    <div className="text-[10px] text-muted-foreground">Rang 8-10</div>
                  </CardContent>
                </Card>
                <Card className="bg-muted/50">
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-muted-foreground">{stats.notFound}</div>
                    <div className="text-[10px] text-muted-foreground">Absents</div>
                  </CardContent>
                </Card>
                <Card className="bg-primary/10 border-primary/20 col-span-2 md:col-span-1">
                  <CardContent className="p-3 text-center">
                    <div className="text-2xl font-bold text-primary">
                      {stats.avgRank > 0 ? `#${stats.avgRank.toFixed(1)}` : "–"}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Moyenne</div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Right Panel: Selected Point & Competitors */}
          <div className="lg:col-span-3 space-y-4">
            {/* Selected Point Details */}
            {selectedPoint && (
              <Card className="border-primary/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      Point {selectedPoint.label}
                    </CardTitle>
                    <Badge 
                      variant={getRankBadgeVariant(selectedPoint.rank_position)}
                      className="text-sm px-2"
                    >
                      {selectedPoint.rank_position ? `#${selectedPoint.rank_position}` : "N/A"}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    {selectedPoint.total_results} établissements dans cette zone
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedPoint.competitors.length > 0 ? (
                    <ScrollArea className="h-48">
                      <div className="space-y-2 pr-2">
                        {selectedPoint.competitors.map((comp, i) => (
                          <div 
                            key={comp.placeId} 
                            className={`flex items-start gap-2 p-2 rounded-lg ${
                              i < 3 ? "bg-muted/50" : ""
                            }`}
                          >
                            <span className={`
                              w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
                              ${i === 0 ? "bg-yellow-500 text-white" : 
                                i === 1 ? "bg-gray-400 text-white" :
                                i === 2 ? "bg-orange-600 text-white" : "bg-muted text-muted-foreground"}
                            `}>
                              {i + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">{comp.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                {comp.rating && (
                                  <span className="flex items-center gap-0.5">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    {comp.rating.toFixed(1)}
                                  </span>
                                )}
                                <span className="truncate">{comp.address}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucun concurrent dans cette zone
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Top Competitors Aggregate */}
            {topCompetitors.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Top Concurrents
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Les plus présents sur votre zone
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-2 pr-2">
                      {topCompetitors.map((comp, i) => (
                        <div 
                          key={`${comp.name}-${i}`}
                          className="flex items-start gap-2 p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <span className={`
                            w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                            ${i === 0 ? "bg-red-500 text-white" : 
                              i === 1 ? "bg-red-400 text-white" :
                              i === 2 ? "bg-red-300 text-white" : "bg-muted text-muted-foreground"}
                          `}>
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{comp.name}</p>
                            <div className="flex flex-wrap items-center gap-2 text-[10px] mt-1">
                              <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                                {comp.appearances} zones
                              </Badge>
                              <span className="text-muted-foreground flex items-center gap-0.5">
                                Pos. moy: #{comp.avgPosition.toFixed(1)}
                              </span>
                              {comp.rating && (
                                <span className="flex items-center gap-0.5 text-muted-foreground">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                  {comp.rating.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Legend */}
            {scanResult && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="text-xs font-medium mb-3 text-muted-foreground">Légende</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-green-500" />
                      <span>Top 3</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-yellow-500" />
                      <span>4 - 7</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-orange-500" />
                      <span>8 - 10</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500" />
                      <span>11+</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <div className="w-4 h-4 rounded-full bg-muted-foreground/50" />
                      <span>Non trouvé</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default MapsRank;
