import type { Fair } from "../types";

export type RuntimeServiceState = {
  code: string;
  name: string;
  customer_orders_enabled: boolean;
  vendor_registration_enabled: boolean;
  delivery_enabled: boolean;
  active: boolean;
  sort_order: number;
};

export type RuntimeFair = {
  name: string;
  address: string | null;
  state: string;
  city: string | null;
  is_active: boolean;
  opening_hours: unknown;
};

export type RuntimeVehicleRule = {
  code: string;
  display_name: string;
  default_capacity_kg: number;
  requires_plate: boolean;
  requires_vehicle_document: boolean;
  requires_cnh: boolean;
  active: boolean;
  sort_order: number;
};

export type RuntimePaymentMethod = {
  code: string;
  label: string;
  method_type: string;
  customer_enabled: boolean;
  vendor_enabled: boolean;
  delivery_enabled: boolean;
  active: boolean;
  sort_order: number;
};

export type RuntimeConfiguration = {
  loaded: boolean;
  source: "fallback" | "supabase";
  states: RuntimeServiceState[];
  fairs: RuntimeFair[];
  vehicleRules: RuntimeVehicleRule[];
  paymentMethods: RuntimePaymentMethod[];
};

const emptyConfig: RuntimeConfiguration = {
  loaded: false,
  source: "fallback",
  states: [],
  fairs: [],
  vehicleRules: [],
  paymentMethods: [],
};

let currentConfig = emptyConfig;
const listeners = new Set<() => void>();

function envValue(name: "VITE_SUPABASE_URL" | "VITE_SUPABASE_ANON_KEY") {
  return String(import.meta.env[name] ?? "").trim();
}

function dataApiConfigured() {
  return Boolean(envValue("VITE_SUPABASE_URL") && envValue("VITE_SUPABASE_ANON_KEY"));
}

async function dataApi<T>(table: string, query: string): Promise<T[]> {
  const url = envValue("VITE_SUPABASE_URL").replace(/\/$/, "");
  const key = envValue("VITE_SUPABASE_ANON_KEY");
  if (!url || !key) return [];

  const response = await fetch(`${url}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
  });
  if (!response.ok) throw new Error(`runtime_config_${table}_${response.status}`);
  return (await response.json()) as T[];
}

function notifyRuntimeChange() {
  for (const listener of listeners) listener();
}

export function getRuntimeConfiguration() {
  return currentConfig;
}

export function subscribeRuntimeConfiguration(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function refreshRuntimeConfiguration(): Promise<RuntimeConfiguration> {
  if (!dataApiConfigured()) {
    currentConfig = { ...emptyConfig, loaded: true };
    notifyRuntimeChange();
    return currentConfig;
  }

  try {
    const [states, fairs, vehicleRules, paymentMethods] = await Promise.all([
      dataApi<RuntimeServiceState>(
        "service_states",
        "select=code,name,customer_orders_enabled,vendor_registration_enabled,delivery_enabled,active,sort_order&active=eq.true&order=sort_order",
      ),
      dataApi<RuntimeFair>(
        "fairs",
        "select=name,address,state,city,is_active,opening_hours&is_active=eq.true&order=name",
      ),
      dataApi<RuntimeVehicleRule>(
        "vehicle_type_rules",
        "select=code,display_name,default_capacity_kg,requires_plate,requires_vehicle_document,requires_cnh,active,sort_order&active=eq.true&order=sort_order",
      ),
      dataApi<RuntimePaymentMethod>(
        "payment_method_rules",
        "select=code,label,method_type,customer_enabled,vendor_enabled,delivery_enabled,active,sort_order&active=eq.true&order=sort_order",
      ),
    ]);

    currentConfig = {
      loaded: true,
      source: "supabase",
      states,
      fairs,
      vehicleRules,
      paymentMethods,
    };
  } catch (error) {
    console.warn("Feiraê runtime configuration indisponível; usando fallback local.", error);
    currentConfig = { ...emptyConfig, loaded: true };
  }

  notifyRuntimeChange();
  return currentConfig;
}

export function runtimeStates() {
  return currentConfig.states;
}

export function runtimeVehicleRules() {
  return currentConfig.vehicleRules;
}

export function runtimePaymentMethods() {
  return currentConfig.paymentMethods;
}

export function mergeRuntimeFairs(fallback: Fair[]): Fair[] {
  if (!currentConfig.fairs.length) return fallback;

  return currentConfig.fairs.map((fair) => ({
    name: fair.name,
    place: fair.city || fair.state,
    address: fair.address || undefined,
    status: "Disponível no Feiraê",
    source: "official",
    state: fair.state,
  }));
}
