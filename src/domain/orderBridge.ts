export type UnifiedOrderStatus =
  | "received"
  | "preparing"
  | "ready_for_pickup"
  | "driver_assigned"
  | "collected"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type UnifiedOrderItem = {
  productId: number;
  name: string;
  vendor: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  weightKg: number;
};

export type UnifiedOrderEvent = {
  key: string;
  label: string;
  at: string;
  actor: "customer" | "vendor" | "delivery" | "system";
  reason?: string;
  details?: string;
};

export type UnifiedOrderRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  fairName: string;
  customerName: string;
  customerCity?: string;
  customerAddress?: string;
  customerLat?: number;
  customerLng?: number;
  fulfillment: "delivery" | "pickup";
  paymentMethod: string;
  subtotal: number;
  calculatedDeliveryFee: number;
  deliverySubsidy: number;
  customerDeliveryFee: number;
  total: number;
  items: UnifiedOrderItem[];
  status: UnifiedOrderStatus;
  cancelReason?: string;
  cancelDetails?: string;
  driver?: {
    name: string;
    vehicle: string;
    plateMasked?: string;
    etaMinutes?: number;
    distanceKm?: number;
  };
  route?: {
    toVendorKm: number;
    vendorToCustomerKm: number;
    totalKm: number;
    etaMinutes: number;
    source: "routing_provider" | "local_fixture" | "osrm";
  };
  events: UnifiedOrderEvent[];
};

const STORAGE_KEY = "feirae:unified-orders:v1";

export function readUnifiedOrders(): UnifiedOrderRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeUnifiedOrders(orders: UnifiedOrderRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export function upsertUnifiedOrder(order: UnifiedOrderRecord) {
  const current = readUnifiedOrders();
  const exists = current.some((item) => item.id === order.id);
  writeUnifiedOrders(
    exists
      ? current.map((item) => (item.id === order.id ? order : item))
      : [order, ...current],
  );
}

export function patchUnifiedOrder(
  id: string,
  patch: Partial<Omit<UnifiedOrderRecord, "id" | "events">>,
  event?: UnifiedOrderEvent,
) {
  const current = readUnifiedOrders();
  writeUnifiedOrders(
    current.map((order) =>
      order.id === id
        ? {
            ...order,
            ...patch,
            updatedAt: new Date().toISOString(),
            events: event ? [...order.events, event] : order.events,
          }
        : order,
    ),
  );
}

export function eventNow(
  key: string,
  label: string,
  actor: UnifiedOrderEvent["actor"],
  extras: Pick<UnifiedOrderEvent, "reason" | "details"> = {},
): UnifiedOrderEvent {
  return {
    key,
    label,
    actor,
    at: new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date()),
    ...extras,
  };
}
