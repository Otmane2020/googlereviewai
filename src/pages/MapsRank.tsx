import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireSubscription } from "@/hooks/useRequireSubscription";
import { supabase } from "@/integrations/supabase/client";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { MapPin, Search, Grid3X3, History, Loader2, AlertCircle, Target, Trophy, Building2 } from "lucide-react";

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
  const { loading: subLoading, valid } = useRequireSubscription();
  const navigate = useNavigate();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [keyword, setKeyword] = useState("");
  const [gridSize, setGridSize] = useState<string>("3");
  const [spacing, setSpacing] = useState<string>("1000");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<Scan[]>([]);
  const [historyPoints, setHistoryPoints] = useState<ScanPoint[]>([]);
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
    if (rank === null) return "bg-gray-400";
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="w-5 h-5" />
                Configuration
              </CardTitle>
              <CardDescription>
                Paramétrez votre analyse de positionnement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Business selector */}
              <div className="space-y-2">
                <Label htmlFor="business">Établissement</Label>
                <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un établissement" />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {b.name}
                          {!b.google_place_id && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              Non connecté
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Keyword */}
              <div className="space-y-2">
                <Label htmlFor="keyword">Mot-clé de recherche</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="keyword"
                    placeholder="ex: restaurant italien"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Grid size */}
              <div className="space-y-2">
                <Label>Taille de la grille</Label>
                <Select value={gridSize} onValueChange={setGridSize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3×3 (9 points)</SelectItem>
                    <SelectItem value="5">5×5 (25 points)</SelectItem>
                    <SelectItem value="7">7×7 (49 points)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Spacing */}
              <div className="space-y-2">
                <Label>Espacement entre les points</Label>
                <Select value={spacing} onValueChange={setSpacing}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="500">500 mètres</SelectItem>
                    <SelectItem value="1000">1 kilomètre</SelectItem>
                    <SelectItem value="2000">2 kilomètres</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Scan button */}
              <Button
                onClick={handleScan}
                disabled={isScanning || !selectedBusiness || !keyword.trim()}
                className="w-full"
                size="lg"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scan en cours...
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
                  <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Historique récent
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {loadingHistory ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      history.map((scan) => (
                        <button
                          key={scan.id}
                          onClick={() => loadScanFromHistory(scan.id)}
                          className="w-full text-left p-2 rounded-lg border hover:bg-muted transition-colors text-sm"
                        >
                          <div className="font-medium truncate">{scan.keyword}</div>
                          <div className="text-xs text-muted-foreground">
                            {scan.grid_size}×{scan.grid_size} • {formatDate(scan.created_at)}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Résultats
              </CardTitle>
              <CardDescription>
                Visualisation de votre classement par zone
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!scanResult ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <MapPin className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">
                    Configurez et lancez un scan pour voir les résultats
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Grid visualization */}
                  <div className="flex justify-center">
                    <div
                      className="grid gap-2"
                      style={{
                        gridTemplateColumns: `repeat(${parseInt(gridSize)}, minmax(0, 1fr))`,
                      }}
                    >
                      {scanResult.points.map((point) => (
                        <button
                          key={point.label}
                          onClick={() => setSelectedPoint(point)}
                          className={`
                            w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center
                            font-bold text-white transition-all hover:scale-105
                            ${getRankColor(point.rank_position)}
                            ${selectedPoint?.label === point.label ? "ring-2 ring-offset-2 ring-primary" : ""}
                          `}
                          title={`${point.label}: ${point.rank_position ? `#${point.rank_position}` : "Non trouvé"}`}
                        >
                          {point.rank_position || "–"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap justify-center gap-3 text-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded bg-green-500" />
                      <span>Top 3</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded bg-yellow-500" />
                      <span>4-7</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded bg-orange-500" />
                      <span>8-10</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded bg-red-500" />
                      <span>11+</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded bg-gray-400" />
                      <span>Non trouvé</span>
                    </div>
                  </div>

                  {/* Selected point details */}
                  {selectedPoint && (
                    <Card className="border-primary/30 bg-primary/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          Point {selectedPoint.label}
                          <Badge variant={getRankBadgeVariant(selectedPoint.rank_position)}>
                            {selectedPoint.rank_position ? `#${selectedPoint.rank_position}` : "Non classé"}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {selectedPoint.total_results} résultats dans cette zone
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {selectedPoint.competitors.length > 0 ? (
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Top concurrents :</h4>
                            <ul className="space-y-1.5">
                              {selectedPoint.competitors.map((comp, i) => (
                                <li key={comp.placeId} className="text-sm flex items-start gap-2">
                                  <span className="font-medium text-muted-foreground min-w-[20px]">
                                    {i + 1}.
                                  </span>
                                  <div>
                                    <span className="font-medium">{comp.name}</span>
                                    {comp.rating && (
                                      <span className="text-muted-foreground ml-2">
                                        ⭐ {comp.rating.toFixed(1)}
                                      </span>
                                    )}
                                    <div className="text-xs text-muted-foreground truncate max-w-[200px] md:max-w-none">
                                      {comp.address}
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Aucun concurrent trouvé dans cette zone
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Stats summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {scanResult.points.filter(p => p.rank_position && p.rank_position <= 3).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Top 3</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {scanResult.points.filter(p => p.rank_position && p.rank_position >= 4 && p.rank_position <= 7).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Rang 4-7</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {scanResult.points.filter(p => p.rank_position && p.rank_position >= 8 && p.rank_position <= 10).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Rang 8-10</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-gray-600">
                          {scanResult.points.filter(p => !p.rank_position).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Non trouvé</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
};

export default MapsRank;
