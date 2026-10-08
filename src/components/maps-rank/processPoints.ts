// Browser-safe helpers shared between MapsRank (SSR-rendered) and RankingMap
// (Leaflet, client-only). Kept out of RankingMap.tsx so importing them never
// pulls Leaflet into an SSR module graph.
import { getDirectionalInfo } from "@/components/maps-rank/DirectionalLabel";

export interface Competitor {
  name: string;
  placeId: string;
  address: string;
  rating: number | null;
}

export interface ScanPoint {
  label: string;
  lat: number;
  lng: number;
  rank_position: number | null;
  total_results: number;
  competitors: Competitor[];
  direction?: string;
  distance?: number;
}

// Process points to add directional info
export const processPointsWithDirections = (
  points: ScanPoint[],
  center: { lat: number; lng: number },
): ScanPoint[] => {
  return points.map((point) => {
    const info = getDirectionalInfo(center.lat, center.lng, point.lat, point.lng);
    return {
      ...point,
      direction: info.direction,
      distance: info.distanceKm,
    };
  });
};
