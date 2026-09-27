export type InternalFairPoint = {
  x: number;
  y: number;
};

export type InternalPickupStopInput = {
  vendorId: string;
  storeId: string;
  vendorName: string;
  box?: string;
  corridor?: string;
  sector?: string;
  internalX?: number | null;
  internalY?: number | null;
  pickupCode?: string;
};

export type InternalPickupStop = InternalPickupStopInput & {
  sequence: number;
  internalDistanceFromPreviousMeters?: number;
};

export type InternalFairRoute = {
  stops: InternalPickupStop[];
  distanceMeters: number;
  etaMinutes: number;
  mappedStops: number;
  unmappedStops: number;
  strategy: "internal_map" | "corridor_box_fallback" | "mixed";
};

const WALKING_METERS_PER_MINUTE = 70;

function hasInternalPoint(stop: InternalPickupStopInput): stop is InternalPickupStopInput & {
  internalX: number;
  internalY: number;
} {
  return (
    typeof stop.internalX === "number" &&
    Number.isFinite(stop.internalX) &&
    typeof stop.internalY === "number" &&
    Number.isFinite(stop.internalY)
  );
}

function distance(a: InternalFairPoint, b: InternalFairPoint) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function fallbackKey(stop: InternalPickupStopInput) {
  const numericBox = Number.parseInt(String(stop.box ?? "").replace(/\D/g, ""), 10);
  return [
    stop.sector?.trim().toLocaleLowerCase("pt-BR") ?? "",
    stop.corridor?.trim().toLocaleLowerCase("pt-BR") ?? "",
    Number.isFinite(numericBox) ? String(numericBox).padStart(6, "0") : String(stop.box ?? ""),
    stop.vendorName.toLocaleLowerCase("pt-BR"),
  ].join("|");
}

export function optimizeInternalFairRoute(
  stops: InternalPickupStopInput[],
  entrance: InternalFairPoint = { x: 0, y: 0 },
): InternalFairRoute {
  const mapped = stops.filter(hasInternalPoint);
  const unmapped = stops
    .filter((stop) => !hasInternalPoint(stop))
    .sort((a, b) => fallbackKey(a).localeCompare(fallbackKey(b), "pt-BR"));

  const remaining = [...mapped];
  const ordered: InternalPickupStop[] = [];
  let current = entrance;
  let distanceMeters = 0;

  while (remaining.length) {
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    remaining.forEach((stop, index) => {
      const nextDistance = distance(current, { x: stop.internalX, y: stop.internalY });
      if (nextDistance < bestDistance) {
        bestDistance = nextDistance;
        bestIndex = index;
      }
    });

    const [next] = remaining.splice(bestIndex, 1);
    ordered.push({
      ...next,
      sequence: ordered.length + 1,
      internalDistanceFromPreviousMeters: Math.round(bestDistance),
    });
    distanceMeters += bestDistance;
    current = { x: next.internalX, y: next.internalY };
  }

  if (mapped.length) {
    distanceMeters += distance(current, entrance);
  }

  unmapped.forEach((stop) => {
    ordered.push({ ...stop, sequence: ordered.length + 1 });
  });

  const roundedDistance = Math.round(distanceMeters);
  const mappedStops = mapped.length;
  const unmappedStops = unmapped.length;

  return {
    stops: ordered,
    distanceMeters: roundedDistance,
    etaMinutes: mappedStops ? Math.max(1, Math.ceil(roundedDistance / WALKING_METERS_PER_MINUTE)) : 0,
    mappedStops,
    unmappedStops,
    strategy: mappedStops && unmappedStops ? "mixed" : mappedStops ? "internal_map" : "corridor_box_fallback",
  };
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).toUpperCase();
}

export function pickupVerificationCode(storeId: string) {
  return `FEIRAE-${stableHash(storeId).slice(0, 8)}`;
}

export function pickupVerificationPayload(storeId: string) {
  return `feirae://pickup/${pickupVerificationCode(storeId)}`;
}

export function pickupCodeMatches(storeId: string, scannedValue: string) {
  const normalized = scannedValue.trim().toUpperCase();
  const code = pickupVerificationCode(storeId).toUpperCase();
  const payload = pickupVerificationPayload(storeId).toUpperCase();
  return normalized === code || normalized === payload;
}
