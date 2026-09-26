import { storeIdFor, vendorIdFor } from "./identity";

export type UnifiedOrderStatus =
  | "received"
  | "preparing"
  | "ready_for_pickup"
  | "driver_assigned"
  | "collected"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type UnifiedPaymentStatus = "authorized" | "due_on_delivery" | "failed" | "refunded";

export type UnifiedVendorStatus =
  "pending" | "accepted" | "preparing" | "ready" | "collected" | "delivered" | "rejected";

export type UnifiedOrderItem = {
  productId: number;
  name: string;
  vendor: string;
  vendorId?: string;
  storeId?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  weightKg: number;
  estimatedWeightKg?: number;
  actualWeightKg?: number;
  unavailable?: boolean;
  note?: string;
};

export type UnifiedOrderVendor = {
  vendorId: string;
  storeId: string;
  vendorName: string;
  status: UnifiedVendorStatus;
  productIds: number[];
};

export type UnifiedOrderEvent = {
  key: string;
  label: string;
  at: string;
  actor: "customer" | "vendor" | "delivery" | "system";
  reason?: string;
  details?: string;
};

export type UnifiedSupportTicket = {
  id: string;
  actor: "customer" | "vendor" | "delivery";
  topic: string;
  details: string;
  createdAt: string;
  priority: "normal" | "urgent";
  status: "open" | "resolved";
};

export type UnifiedReview = {
  id: string;
  authorRole: "customer" | "vendor" | "delivery";
  targetRole: "customer" | "vendor" | "delivery" | "product" | "app";
  targetId?: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type UnifiedOrderRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  customerKey?: string;
  fairName: string;
  customerName: string;
  customerCity?: string;
  customerAddress?: string;
  customerLat?: number;
  customerLng?: number;
  fulfillment: "delivery" | "pickup";
  paymentMethod: string;
  paymentStatus?: UnifiedPaymentStatus;
  whatsappConsent?: boolean;
  refundAmount?: number;
  changeFor?: number;
  subtotal: number;
  promotionDiscount?: number;
  walletUsed?: number;
  calculatedDeliveryFee: number;
  deliverySubsidy: number;
  customerDeliveryFee: number;
  total: number;
  items: UnifiedOrderItem[];
  vendors?: UnifiedOrderVendor[];
  status: UnifiedOrderStatus;
  cancelReason?: string;
  cancelDetails?: string;
  pickupConfirmedAt?: string;
  driver?: {
    driverKey?: string;
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
  supportTickets?: UnifiedSupportTicket[];
  reviews?: UnifiedReview[];
};

export const UNIFIED_ORDER_EVENT = "feirae:unified-orders-changed";
const STORAGE_KEY = "feirae:unified-orders:v2";
const LEGACY_STORAGE_KEY = "feirae:unified-orders:v1";

function normalizeOrder(order: UnifiedOrderRecord): UnifiedOrderRecord {
  const items = (order.items ?? []).map((item) => ({
    ...item,
    vendorId: item.vendorId ?? vendorIdFor(item.vendor),
    storeId: item.storeId ?? storeIdFor(order.fairName, item.vendor),
    estimatedWeightKg: item.estimatedWeightKg ?? item.weightKg,
  }));
  const vendors = order.vendors?.length
    ? order.vendors
    : Array.from(new Set(items.map((item) => item.vendorId!))).map((vendorId) => {
        const first = items.find((item) => item.vendorId === vendorId)!;
        return {
          vendorId,
          storeId: first.storeId!,
          vendorName: first.vendor,
          status:
            order.status === "received"
              ? ("pending" as const)
              : ["preparing"].includes(order.status)
                ? ("preparing" as const)
                : ["ready_for_pickup", "driver_assigned"].includes(order.status)
                  ? ("ready" as const)
                  : ["collected", "out_for_delivery"].includes(order.status)
                    ? ("collected" as const)
                    : order.status === "delivered"
                      ? ("delivered" as const)
                      : ("rejected" as const),
          productIds: items.filter((item) => item.vendorId === vendorId).map((item) => item.productId),
        };
      });
  return {
    ...order,
    paymentStatus:
      order.paymentStatus ??
      (order.paymentMethod?.toLocaleLowerCase("pt-BR").includes("entrega")
        ? "due_on_delivery"
        : "authorized"),
    items,
    vendors,
    supportTickets: order.supportTickets ?? [],
    reviews: order.reviews ?? [],
  };
}

function readRawOrders(): UnifiedOrderRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const current = window.localStorage.getItem(STORAGE_KEY);
    if (current) {
      const parsed = JSON.parse(current);
      return Array.isArray(parsed) ? parsed.map(normalizeOrder) : [];
    }
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacy) return [];
    const parsed = JSON.parse(legacy);
    const migrated = Array.isArray(parsed) ? parsed.map(normalizeOrder) : [];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return [];
  }
}

export function readUnifiedOrders(customerKey?: string): UnifiedOrderRecord[] {
  const orders = readRawOrders();
  return customerKey
    ? orders.filter(
        (order) => order.customerKey?.toLocaleLowerCase("pt-BR") === customerKey.toLocaleLowerCase("pt-BR"),
      )
    : orders;
}

export function writeUnifiedOrders(orders: UnifiedOrderRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders.map(normalizeOrder)));
  window.dispatchEvent(new Event(UNIFIED_ORDER_EVENT));
}

export function upsertUnifiedOrder(order: UnifiedOrderRecord) {
  const current = readRawOrders();
  const normalized = normalizeOrder(order);
  const exists = current.some((item) => item.id === order.id);
  writeUnifiedOrders(
    exists ? current.map((item) => (item.id === order.id ? normalized : item)) : [normalized, ...current],
  );
}

export function patchUnifiedOrder(
  id: string,
  patch: Partial<Omit<UnifiedOrderRecord, "id" | "events">>,
  event?: UnifiedOrderEvent,
) {
  const current = readRawOrders();
  writeUnifiedOrders(
    current.map((order) =>
      order.id === id
        ? normalizeOrder({
            ...order,
            ...patch,
            updatedAt: new Date().toISOString(),
            events: event ? [...order.events, event] : order.events,
          })
        : order,
    ),
  );
}

function overallVendorStatus(order: UnifiedOrderRecord, vendors: UnifiedOrderVendor[]) {
  if (vendors.some((vendor) => vendor.status === "rejected")) return "cancelled" as const;
  if (order.status === "delivered" || order.status === "cancelled") return order.status;
  if (["driver_assigned", "collected", "out_for_delivery"].includes(order.status)) return order.status;
  if (
    order.fulfillment === "pickup" &&
    vendors.length &&
    vendors.every((vendor) => vendor.status === "delivered")
  ) {
    return "delivered" as const;
  }
  if (
    order.fulfillment === "pickup" &&
    vendors.some((vendor) => vendor.status === "delivered") &&
    vendors.every((vendor) => ["ready", "delivered"].includes(vendor.status))
  ) {
    return "ready_for_pickup" as const;
  }
  if (vendors.length && vendors.every((vendor) => vendor.status === "ready"))
    return "ready_for_pickup" as const;
  if (vendors.some((vendor) => ["accepted", "preparing", "ready"].includes(vendor.status))) {
    return "preparing" as const;
  }
  return "received" as const;
}

export function patchVendorStatus(
  orderId: string,
  vendorId: string,
  status: UnifiedVendorStatus,
  event?: UnifiedOrderEvent,
) {
  const current = readRawOrders();
  writeUnifiedOrders(
    current.map((order) => {
      if (order.id !== orderId) return order;
      const normalized = normalizeOrder(order);
      const vendors = normalized.vendors!.map((vendor) =>
        vendor.vendorId === vendorId ? { ...vendor, status } : vendor,
      );
      return {
        ...normalized,
        vendors,
        status: overallVendorStatus(normalized, vendors),
        updatedAt: new Date().toISOString(),
        events: event ? [...normalized.events, event] : normalized.events,
      };
    }),
  );
}

export function patchUnifiedOrderItem(
  orderId: string,
  vendorId: string,
  productId: number,
  patch: Partial<UnifiedOrderItem>,
) {
  const current = readRawOrders();
  writeUnifiedOrders(
    current.map((order) => {
      if (order.id !== orderId) return order;
      const normalized = normalizeOrder(order);
      return {
        ...normalized,
        updatedAt: new Date().toISOString(),
        items: normalized.items.map((item) =>
          item.vendorId === vendorId && item.productId === productId
            ? {
                ...item,
                ...patch,
                weightKg: typeof patch.actualWeightKg === "number" ? patch.actualWeightKg : item.weightKg,
              }
            : item,
        ),
      };
    }),
  );
}

export function appendSupportTicket(orderId: string, ticket: UnifiedSupportTicket) {
  const order = readRawOrders().find((item) => item.id === orderId);
  if (!order) return;
  patchUnifiedOrder(orderId, {
    supportTickets: [...(order.supportTickets ?? []), ticket],
  });
}

export function appendReview(orderId: string, review: UnifiedReview) {
  const order = readRawOrders().find((item) => item.id === orderId);
  if (!order) return;
  patchUnifiedOrder(orderId, { reviews: [...(order.reviews ?? []), review] });
}

export function migrateUnifiedOrderAccountKey(
  oldEmail: string,
  newEmail: string,
  role: "customer" | "feirante" | "delivery",
  newName?: string,
) {
  const from = oldEmail.trim().toLocaleLowerCase("pt-BR");
  const to = newEmail.trim().toLocaleLowerCase("pt-BR");
  const oldVendorId = vendorIdFor(from);
  const newVendorId = vendorIdFor(to);
  const current = readRawOrders();

  writeUnifiedOrders(
    current.map((order) => {
      let changed = false;
      let nextOrder = order;

      if (role === "customer" && order.customerKey?.trim().toLocaleLowerCase("pt-BR") === from) {
        changed = true;
        nextOrder = {
          ...nextOrder,
          customerKey: to,
          customerName: newName?.trim() || order.customerName,
        };
      }

      if (role === "delivery" && order.driver?.driverKey?.trim().toLocaleLowerCase("pt-BR") === from) {
        changed = true;
        nextOrder = {
          ...nextOrder,
          driver: {
            ...order.driver,
            driverKey: to,
            name: newName?.trim() || order.driver.name,
          },
        };
      }

      if (role === "feirante") {
        const vendors = (nextOrder.vendors ?? []).map((vendor) =>
          vendor.vendorId === oldVendorId
            ? { ...vendor, vendorId: newVendorId, vendorName: newName?.trim() || vendor.vendorName }
            : vendor,
        );
        const items = nextOrder.items.map((item) =>
          item.vendorId === oldVendorId
            ? { ...item, vendorId: newVendorId, vendor: newName?.trim() || item.vendor }
            : item,
        );
        if (
          vendors.some((vendor, index) => vendor !== nextOrder.vendors?.[index]) ||
          items.some((item, index) => item !== nextOrder.items[index])
        ) {
          changed = true;
          nextOrder = { ...nextOrder, vendors, items };
        }
      }

      const reviews = (nextOrder.reviews ?? []).map((review) => {
        if (review.targetId === from) return { ...review, targetId: to };
        if (role === "feirante" && review.targetId === oldVendorId) {
          return { ...review, targetId: newVendorId };
        }
        return review;
      });
      if (reviews.some((review, index) => review !== nextOrder.reviews?.[index])) {
        changed = true;
        nextOrder = { ...nextOrder, reviews };
      }

      return changed ? { ...nextOrder, updatedAt: new Date().toISOString() } : nextOrder;
    }),
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
