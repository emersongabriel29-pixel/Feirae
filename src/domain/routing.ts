export type GeoPoint = {
  lat: number;
  lng: number;
};

export type RouteMetrics = {
  distanceKm: number;
  durationMinutes: number;
  geometry: GeoPoint[];
};

export async function geocodeAddress(address: string): Promise<GeoPoint | null> {
  if (!address.trim()) return null;
  try {
    const response = await fetch(
      "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=br&q=" +
        encodeURIComponent(address),
      { headers: { "Accept-Language": "pt-BR,pt" } },
    );
    if (!response.ok) return null;
    const result = (await response.json()) as Array<{ lat?: string; lon?: string }>;
    const first = result[0];
    if (!first?.lat || !first.lon) return null;
    const lat = Number(first.lat);
    const lng = Number(first.lon);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  } catch {
    return null;
  }
}

export async function drivingRoute(origin: GeoPoint, destination: GeoPoint): Promise<RouteMetrics | null> {
  try {
    const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&steps=false&geometries=geojson`,
    );
    if (!response.ok) return null;
    const data = (await response.json()) as {
      routes?: Array<{
        distance?: number;
        duration?: number;
        geometry?: { coordinates?: Array<[number, number]> };
      }>;
    };
    const route = data.routes?.[0];
    if (typeof route?.distance !== "number" || typeof route.duration !== "number") return null;
    const geometry =
      route.geometry?.coordinates
        ?.filter(([lng, lat]) => Number.isFinite(lat) && Number.isFinite(lng))
        .map(([lng, lat]) => ({ lat, lng })) ?? [];
    return {
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMinutes: Math.max(1, Math.round(route.duration / 60)),
      geometry,
    };
  } catch {
    return null;
  }
}
