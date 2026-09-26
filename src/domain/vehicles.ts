import type { StoredFile } from "./storedFile";
import { getRuntimeConfiguration, runtimeVehicleRules } from "./runtimeConfig";

export const vehicleCapacityDefaults = {
  Bicicleta: 10,
  "Bicicleta cargueira/triciclo": 40,
  Moto: 12,
  "Moto com baú": 20,
  Carro: 80,
  "Utilitário/Pickup": 250,
  Van: 500,
  Outro: 10,
} as const;

export type DeliveryVehicleType = string;

export type DeliveryVehicle = {
  id: string;
  type: DeliveryVehicleType;
  capacityKg: number;
  brandModel: string;
  plate: string;
  active: boolean;
  documentFileName?: string;
  documentFile?: StoredFile;
  documentStatus?: "pending" | "under_review" | "approved" | "correction_required";
};

export function getVehicleTypeOptions(): DeliveryVehicleType[] {
  const runtime = runtimeVehicleRules();
  return getRuntimeConfiguration().source === "supabase"
    ? runtime.map((rule) => rule.display_name)
    : (Object.keys(vehicleCapacityDefaults) as DeliveryVehicleType[]);
}

function runtimeRule(type: DeliveryVehicleType) {
  return runtimeVehicleRules().find((rule) => rule.display_name === type);
}

export function suggestedCapacityForVehicle(type: DeliveryVehicleType) {
  const runtime = runtimeRule(type);
  if (runtime) return Number(runtime.default_capacity_kg);
  return vehicleCapacityDefaults[type as keyof typeof vehicleCapacityDefaults] ?? 10;
}

export function requiresPlate(type: DeliveryVehicleType) {
  const runtime = runtimeRule(type);
  if (runtime) return runtime.requires_plate;
  return !["Bicicleta", "Bicicleta cargueira/triciclo", "Outro"].includes(type);
}

export function isVehicleTypeActive(type: DeliveryVehicleType) {
  const runtime = runtimeVehicleRules();
  if (getRuntimeConfiguration().source !== "supabase") return type in vehicleCapacityDefaults;
  return runtime.some((rule) => rule.display_name === type && rule.active);
}

export function normalizePlate(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);
}

export function isValidBrazilianPlate(value: string) {
  const plate = normalizePlate(value);
  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(plate);
}
