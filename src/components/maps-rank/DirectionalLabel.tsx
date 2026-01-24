// Utility functions for directional labels

export interface DirectionalInfo {
  direction: string;
  distanceKm: number;
  label: string;
}

/**
 * Calculate the direction and distance from center to a point
 */
export function getDirectionalInfo(
  centerLat: number,
  centerLng: number,
  pointLat: number,
  pointLng: number
): DirectionalInfo {
  // Calculate distance using Haversine formula
  const R = 6371; // Earth radius in km
  const dLat = toRad(pointLat - centerLat);
  const dLng = toRad(pointLng - centerLng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(centerLat)) * Math.cos(toRad(pointLat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  // If very close to center, it's the center
  if (distanceKm < 0.1) {
    return {
      direction: "Centre",
      distanceKm: 0,
      label: "Centre",
    };
  }

  // Calculate bearing angle
  const y = Math.sin(toRad(pointLng - centerLng)) * Math.cos(toRad(pointLat));
  const x =
    Math.cos(toRad(centerLat)) * Math.sin(toRad(pointLat)) -
    Math.sin(toRad(centerLat)) * Math.cos(toRad(pointLat)) * Math.cos(toRad(pointLng - centerLng));
  let bearing = Math.atan2(y, x);
  bearing = toDeg(bearing);
  bearing = (bearing + 360) % 360;

  // Convert bearing to cardinal direction
  const direction = getCardinalDirection(bearing);
  
  // Format distance
  const distanceLabel = distanceKm < 1 
    ? `${Math.round(distanceKm * 1000)}m` 
    : `${distanceKm.toFixed(1)}km`;

  return {
    direction,
    distanceKm,
    label: `${direction} (${distanceLabel})`,
  };
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

function toDeg(rad: number): number {
  return rad * (180 / Math.PI);
}

function getCardinalDirection(bearing: number): string {
  const directions = [
    { min: 337.5, max: 360, name: "Nord" },
    { min: 0, max: 22.5, name: "Nord" },
    { min: 22.5, max: 67.5, name: "Nord-Est" },
    { min: 67.5, max: 112.5, name: "Est" },
    { min: 112.5, max: 157.5, name: "Sud-Est" },
    { min: 157.5, max: 202.5, name: "Sud" },
    { min: 202.5, max: 247.5, name: "Sud-Ouest" },
    { min: 247.5, max: 292.5, name: "Ouest" },
    { min: 292.5, max: 337.5, name: "Nord-Ouest" },
  ];

  for (const dir of directions) {
    if (bearing >= dir.min && bearing < dir.max) {
      return dir.name;
    }
  }
  
  return "Nord";
}

/**
 * Get a short direction abbreviation
 */
export function getDirectionAbbr(direction: string): string {
  const abbrs: Record<string, string> = {
    "Centre": "C",
    "Nord": "N",
    "Sud": "S",
    "Est": "E",
    "Ouest": "O",
    "Nord-Est": "NE",
    "Nord-Ouest": "NO",
    "Sud-Est": "SE",
    "Sud-Ouest": "SO",
  };
  return abbrs[direction] || direction;
}

/**
 * Get color based on direction for visual differentiation
 */
export function getDirectionColor(direction: string): string {
  const colors: Record<string, string> = {
    "Centre": "#3b82f6",
    "Nord": "#ef4444",
    "Sud": "#22c55e",
    "Est": "#eab308",
    "Ouest": "#8b5cf6",
    "Nord-Est": "#f97316",
    "Nord-Ouest": "#ec4899",
    "Sud-Est": "#14b8a6",
    "Sud-Ouest": "#6366f1",
  };
  return colors[direction] || "#9ca3af";
}
