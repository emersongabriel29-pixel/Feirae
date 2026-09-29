import type { Fair } from "../types";
import { distanceInKm } from "../utils";

export type FairMapPrecision = "exact" | "region";

export type FairMapCoordinate = {
  lat: number;
  lng: number;
  precision: FairMapPrecision;
};

export type FairMapPoint = {
  fair: Fair;
  coordinate: FairMapCoordinate;
  x: number;
  y: number;
};

const REGION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Plano Piloto": { lat: -15.7939, lng: -47.8828 },
  Gama: { lat: -16.0187, lng: -48.0616 },
  Sobradinho: { lat: -15.6507, lng: -47.7915 },
  "Sobradinho II": { lat: -15.649, lng: -47.812 },
  Planaltina: { lat: -15.621, lng: -47.648 },
  "Núcleo Bandeirante": { lat: -15.871, lng: -47.967 },
  Ceilândia: { lat: -15.817, lng: -48.108 },
  Guará: { lat: -15.826, lng: -47.98 },
  Cruzeiro: { lat: -15.794, lng: -47.94 },
  "São Sebastião": { lat: -15.9, lng: -47.771 },
  Taguatinga: { lat: -15.835, lng: -48.056 },
  Brazlândia: { lat: -15.67, lng: -48.2 },
  Paranoá: { lat: -15.775, lng: -47.779 },
  Samambaia: { lat: -15.877, lng: -48.084 },
  "Santa Maria": { lat: -16.003, lng: -47.987 },
  "Recanto das Emas": { lat: -15.902, lng: -48.061 },
  "Riacho Fundo I": { lat: -15.881, lng: -48.016 },
  Candangolândia: { lat: -15.851, lng: -47.949 },
  "Riacho Fundo II": { lat: -15.91, lng: -48.04 },
  "SCIA/Estrutural": { lat: -15.78, lng: -47.999 },
  "Jardim Botânico": { lat: -15.88, lng: -47.83 },
  SIA: { lat: -15.8, lng: -47.955 },
  "Vicente Pires": { lat: -15.814, lng: -48.016 },
  Fercal: { lat: -15.6, lng: -47.87 },
};

const DF_BOUNDS = {
  north: -15.45,
  south: -16.1,
  west: -48.3,
  east: -47.3,
};

function nameOffset(name: string) {
  let hash = 0;
  for (const character of name) {
    hash = (hash * 31 + character.charCodeAt(0)) | 0;
  }
  const lat = (((hash & 0xff) / 255) * 2 - 1) * 0.006;
  const lng = ((((hash >>> 8) & 0xff) / 255) * 2 - 1) * 0.009;
  return { lat, lng };
}

export function fairMapCoordinate(fair: Fair): FairMapCoordinate | null {
  if (typeof fair.lat === "number" && typeof fair.lng === "number") {
    return { lat: fair.lat, lng: fair.lng, precision: "exact" };
  }

  const region = REGION_COORDINATES[fair.place];
  if (!region) return null;
  const offset = nameOffset(fair.name);

  return {
    lat: region.lat + offset.lat,
    lng: region.lng + offset.lng,
    precision: "region",
  };
}

function normalizeRegionLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\b(distrito federal|df)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function regionCoordinateFromLabel(label: string) {
  const normalizedLabel = normalizeRegionLabel(label);
  if (!normalizedLabel) return null;

  const match = Object.entries(REGION_COORDINATES).find(([region]) => {
    const normalizedRegion = normalizeRegionLabel(region);
    return (
      normalizedLabel === normalizedRegion ||
      normalizedLabel.startsWith(`${normalizedRegion} `) ||
      normalizedLabel.includes(` ${normalizedRegion} `) ||
      normalizedLabel.endsWith(` ${normalizedRegion}`)
    );
  });

  return match ? { ...match[1] } : null;
}

export function sortFairsByProximity(
  items: Fair[],
  userCoords: { lat: number; lng: number } | null,
  locationLabel = "",
) {
  const reference = userCoords ?? regionCoordinateFromLabel(locationLabel);
  if (!reference) return items.map((fair) => ({ ...fair, distance: null as number | null }));

  return items
    .map((fair) => {
      const coordinate = fairMapCoordinate(fair);
      return {
        ...fair,
        distance: coordinate
          ? distanceInKm(reference.lat, reference.lng, coordinate.lat, coordinate.lng)
          : (null as number | null),
      };
    })
    .sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
}

export function projectDfCoordinate(coordinate: Pick<FairMapCoordinate, "lat" | "lng">) {
  const x = ((coordinate.lng - DF_BOUNDS.west) / (DF_BOUNDS.east - DF_BOUNDS.west)) * 100;
  const y = ((DF_BOUNDS.north - coordinate.lat) / (DF_BOUNDS.north - DF_BOUNDS.south)) * 100;

  return {
    x: Math.min(98, Math.max(2, x)),
    y: Math.min(97, Math.max(3, y)),
  };
}

export function fairMapPoints(items: Fair[]): FairMapPoint[] {
  return items.flatMap((fair) => {
    const coordinate = fairMapCoordinate(fair);
    if (!coordinate) return [];
    const projected = projectDfCoordinate(coordinate);
    return [{ fair, coordinate, ...projected }];
  });
}

export function nearestFairPoint(
  items: Fair[],
  userCoords: { lat: number; lng: number } | null,
): (FairMapPoint & { distanceKm: number }) | null {
  if (!userCoords) return null;

  return (
    fairMapPoints(items)
      .map((point) => ({
        ...point,
        distanceKm: distanceInKm(userCoords.lat, userCoords.lng, point.coordinate.lat, point.coordinate.lng),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)[0] ?? null
  );
}
