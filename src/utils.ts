import type { Fair, Product } from "./types";

export const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function filterProducts(items: Product[], query: string, category: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  return items.filter((product) => {
    const categoryMatches = category === "Todos" || product.category === category;
    const text = [product.name, product.feirante, product.fair, product.category]
      .join(" ")
      .toLocaleLowerCase("pt-BR");
    return categoryMatches && (!normalizedQuery || text.includes(normalizedQuery));
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
    .map((fair) => ({ ...fair, distance: distanceInKm(coords.lat, coords.lng, fair.lat, fair.lng) }))
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
}
