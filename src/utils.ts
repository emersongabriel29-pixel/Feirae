import type { Fair, Product } from "./types";

export const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function editDistanceAtMostOne(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a === b) return true;

  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (a.length > b.length) i += 1;
    else if (b.length > a.length) j += 1;
    else {
      i += 1;
      j += 1;
    }
  }
  return edits + Number(i < a.length || j < b.length) <= 1;
}

export function filterProducts(items: Product[], query: string, category: string) {
  const normalizedQuery = normalizeSearch(query);
  const queryTokens = normalizedQuery.split(" ").filter(Boolean);

  return items.filter((product) => {
    const categoryMatches = category === "Todos" || product.category === category;
    if (!categoryMatches) return false;
    if (!normalizedQuery) return true;

    const searchable = normalizeSearch(
      [product.name, product.feirante, product.fair, product.category].join(" "),
    );
    if (searchable.includes(normalizedQuery)) return true;

    const words = searchable.split(" ").filter(Boolean);
    return queryTokens.every((token) =>
      words.some(
        (word) =>
          word.includes(token) ||
          token.includes(word) ||
          (token.length >= 4 && word.length >= 4 && editDistanceAtMostOne(token, word)),
      ),
    );
  });
}

export function cartSubtotal(items: Product[], cart: Record<number, number>) {
  return items.reduce((sum, product) => sum + product.price * (cart[product.id] ?? 0), 0);
}

export function distanceInKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const radius = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(lat2 - lat1);
  const longitudeDelta = toRadians(lng2 - lng1);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(longitudeDelta / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function sortFairsByDistance(items: Fair[], coords: { lat: number; lng: number } | null) {
  if (!coords) return items.map((fair) => ({ ...fair, distance: null as number | null }));

  return items
    .map((fair) => ({
      ...fair,
      distance:
        typeof fair.lat === "number" && typeof fair.lng === "number"
          ? distanceInKm(coords.lat, coords.lng, fair.lat, fair.lng)
          : (null as number | null),
    }))
    .sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
}
