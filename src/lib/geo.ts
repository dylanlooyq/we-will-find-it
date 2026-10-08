interface Point {
  lat: number;
  lng: number;
}

/** Great-circle distance in km (haversine). Plenty accurate at Singapore scale. */
export function distanceKm(a: Point, b: Point): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function formatDistance(km: number): string {
  if (km < 0.1) return "Right here";
  if (km < 1) return `${Math.round(km * 10) * 100} m away`;
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}

/** Singapore's mainland bounds — used by the map and SVG projections. */
export const SG_BOUNDS = {
  south: 1.16,
  north: 1.48,
  west: 103.6,
  east: 104.09,
};
