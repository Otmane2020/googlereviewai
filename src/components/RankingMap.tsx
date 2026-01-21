import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issue in Vite
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

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

interface RankingMapProps {
  center: { lat: number; lng: number };
  points: ScanPoint[];
  spacing: number;
  gridSize: number;
  selectedPoint: ScanPoint | null;
  onPointSelect: (point: ScanPoint) => void;
  businessName?: string;
}

// Custom hook to recenter map when center changes
const MapRecenter = ({ center }: { center: { lat: number; lng: number } }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center.lat && center.lng) {
      map.setView([center.lat, center.lng], map.getZoom());
    }
  }, [center, map]);
  
  return null;
};

// Create custom colored markers
const createRankIcon = (rank: number | null, isSelected: boolean) => {
  let color = "#9ca3af"; // gray
  if (rank !== null) {
    if (rank <= 3) color = "#22c55e"; // green
    else if (rank <= 7) color = "#eab308"; // yellow
    else if (rank <= 10) color = "#f97316"; // orange
    else color = "#ef4444"; // red
  }

  const size = isSelected ? 36 : 28;
  const borderWidth = isSelected ? 3 : 2;
  
  return L.divIcon({
    className: "custom-rank-marker",
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: ${borderWidth}px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${isSelected ? 14 : 12}px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        transform: translate(-50%, -50%);
        ${isSelected ? 'box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 2px 6px rgba(0,0,0,0.3);' : ''}
      ">
        ${rank !== null ? rank : "–"}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Business center marker
const createBusinessIcon = () => {
  return L.divIcon({
    className: "business-marker",
    html: `
      <div style="
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        transform: translate(-50%, -50%);
      ">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};

export const RankingMap = ({
  center,
  points,
  spacing,
  gridSize,
  selectedPoint,
  onPointSelect,
  businessName,
}: RankingMapProps) => {
  // Calculate appropriate zoom based on spacing
  const getZoom = () => {
    if (spacing <= 500) return 15;
    if (spacing <= 1000) return 14;
    if (spacing <= 2000) return 13;
    if (spacing <= 3000) return 12;
    if (spacing <= 5000) return 11;
    return 10;
  };

  // Calculate total radius covered
  const totalRadius = (spacing * (gridSize - 1)) / 2 + spacing / 2;

  if (!center.lat || !center.lng) {
    return (
      <div className="w-full h-[400px] bg-muted rounded-xl flex items-center justify-center">
        <p className="text-muted-foreground">Aucune donnée de localisation</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden border border-border shadow-sm">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={getZoom()}
        className="w-full h-full"
        scrollWheelZoom={true}
      >
        <MapContent 
          center={center}
          points={points}
          totalRadius={totalRadius}
          selectedPoint={selectedPoint}
          onPointSelect={onPointSelect}
          businessName={businessName}
        />
      </MapContainer>
    </div>
  );
};

// Separate component to avoid context consumer issues
const MapContent = ({
  center,
  points,
  totalRadius,
  selectedPoint,
  onPointSelect,
  businessName,
}: {
  center: { lat: number; lng: number };
  points: ScanPoint[];
  totalRadius: number;
  selectedPoint: ScanPoint | null;
  onPointSelect: (point: ScanPoint) => void;
  businessName?: string;
}) => {
  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapRecenter center={center} />
      <Circle
        center={[center.lat, center.lng]}
        radius={totalRadius}
        pathOptions={{
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.08,
          weight: 2,
          dashArray: "8, 8",
        }}
      />
      <Marker 
        position={[center.lat, center.lng]} 
        icon={createBusinessIcon()}
        zIndexOffset={1000}
      >
        <Popup>
          <div className="text-center">
            <strong>{businessName || "Votre établissement"}</strong>
            <p className="text-xs text-muted-foreground mt-1">Centre du scan</p>
          </div>
        </Popup>
      </Marker>
      {points.map((point) => (
        <Marker
          key={point.label}
          position={[point.lat, point.lng]}
          icon={createRankIcon(point.rank_position, selectedPoint?.label === point.label)}
          eventHandlers={{
            click: () => onPointSelect(point),
          }}
        >
          <Popup>
            <div className="min-w-[180px]">
              <div className="flex items-center justify-between mb-2">
                <strong>Point {point.label}</strong>
                <span className={`
                  px-2 py-0.5 rounded text-xs font-bold text-white
                  ${point.rank_position === null ? "bg-gray-400" : 
                    point.rank_position <= 3 ? "bg-green-500" :
                    point.rank_position <= 7 ? "bg-yellow-500" :
                    point.rank_position <= 10 ? "bg-orange-500" : "bg-red-500"}
                `}>
                  {point.rank_position ? `#${point.rank_position}` : "N/A"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {point.total_results} résultats dans cette zone
              </p>
              {point.competitors.length > 0 && (
                <div className="border-t pt-2">
                  <p className="text-xs font-medium mb-1">Top 3:</p>
                  <ul className="text-xs space-y-1">
                    {point.competitors.slice(0, 3).map((comp, i) => (
                      <li key={comp.placeId} className="flex items-start gap-1">
                        <span className="text-muted-foreground">{i + 1}.</span>
                        <span className="truncate">{comp.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};
