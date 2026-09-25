import type { Product, VendorMetrics } from "../types";
import { vehicleCapacityDefaults } from "./vehicles";

export const vehicleRules = [
  { name: "Bicicleta", maxKg: vehicleCapacityDefaults.Bicicleta, note: "pedidos leves e próximos" },
  {
    name: "Bicicleta cargueira/triciclo",
    maxKg: vehicleCapacityDefaults["Bicicleta cargueira/triciclo"],
    note: "cargas médias sem veículo motorizado",
  },
  { name: "Moto", maxKg: vehicleCapacityDefaults.Moto, note: "sacola pequena ou média" },
  {
    name: "Moto com baú",
    maxKg: vehicleCapacityDefaults["Moto com baú"],
    note: "compras médias com volume controlado",
  },
  { name: "Carro", maxKg: vehicleCapacityDefaults.Carro, note: "compras pesadas e múltiplas bancas" },
  {
    name: "Utilitário/Pickup",
    maxKg: vehicleCapacityDefaults["Utilitário/Pickup"],
    note: "cargas maiores e caixas",
  },
  { name: "Van", maxKg: vehicleCapacityDefaults.Van, note: "grandes volumes dentro da operação configurada" },
] as const;

export function productWeight(product: Product, quantity: number) {
  return product.weightKg * quantity;
}

export function cartWeight(items: Product[], cart: Record<number, number>) {
  return items.reduce((sum, product) => sum + productWeight(product, cart[product.id] ?? 0), 0);
}

export function vehicleForWeight(weight: number) {
  return vehicleRules.find((rule) => weight <= rule.maxKg) ?? vehicleRules[vehicleRules.length - 1];
}

export function metricForVendor(name: string, metrics: Record<string, VendorMetrics>) {
  return (
    metrics[name] ?? {
      rating: 4.8,
      reviewCount: 100,
      deliveryMinutes: [40, 60] as [number, number],
      deliveryFee: 9.9,
    }
  );
}

export function vendorSummaries(items: Product[], metrics: Record<string, VendorMetrics>) {
  return Array.from(new Set(items.map((product) => product.feirante))).map((name) => {
    const vendorProducts = items.filter((product) => product.feirante === name);
    return {
      name,
      fair: vendorProducts[0]?.fair ?? "Feira",
      categories: Array.from(new Set(vendorProducts.map((product) => product.category))).slice(0, 3),
      products: vendorProducts.length,
      ...metricForVendor(name, metrics),
    };
  });
}

export function ratingLabel(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function minutesLabel(range: [number, number]) {
  return `${range[0]}-${range[1]} min`;
}
