import type { Product } from "../types";
import { marketplaceProducts } from "./marketplaceBridge";

type Reservation = {
  orderId: string;
  status: "reserved" | "released" | "consumed";
  items: Array<{
    productId: number;
    quantity: number;
    storeId?: string;
  }>;
};

const RESERVATION_KEY = "feirae:inventory-reservations:v1";
const MARKETPLACE_KEY = "feirae:marketplace:v2";
const STATIC_ADJUSTMENT_KEY = "feirae:static-stock-adjustments:v1";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "");
    return parsed as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function reservations() {
  return readJson<Reservation[]>(RESERVATION_KEY, []);
}

function adjustVendorLocalStock(accountKey: string, productId: number, delta: number) {
  const key = `feirae:vendor-products:${accountKey}`;
  const items = readJson<Array<{ id: number; stock: number; active: boolean }>>(key, []);
  if (!items.length) return;
  writeJson(
    key,
    items.map((item) =>
      item.id === productId
        ? {
            ...item,
            stock: Math.max(0, item.stock + delta),
            active: item.stock + delta <= 0 ? false : item.active,
          }
        : item,
    ),
  );
}

function adjustSharedMarketplaceStock(productId: number, storeId: string | undefined, delta: number) {
  const marketplace = readJson<{
    stores?: Array<{ storeId: string; accountKey: string }>;
    products?: Array<{ id: number; storeId: string; stock: number; active: boolean }>;
  }>(MARKETPLACE_KEY, {});
  const products = marketplace.products ?? [];
  const target = products.find(
    (product) => product.id === productId && (!storeId || product.storeId === storeId),
  );
  if (!target) return false;
  target.stock = Math.max(0, target.stock + delta);
  if (target.stock <= 0) target.active = false;
  writeJson(MARKETPLACE_KEY, marketplace);
  const store = (marketplace.stores ?? []).find((item) => item.storeId === target.storeId);
  if (store) adjustVendorLocalStock(store.accountKey, productId, delta);
  return true;
}

function adjustStaticStock(productId: number, delta: number) {
  const adjustments = readJson<Record<string, number>>(STATIC_ADJUSTMENT_KEY, {});
  adjustments[String(productId)] = (adjustments[String(productId)] ?? 0) + delta;
  writeJson(STATIC_ADJUSTMENT_KEY, adjustments);
}

export function staticStockAdjustment(productId: number) {
  return readJson<Record<string, number>>(STATIC_ADJUSTMENT_KEY, {})[String(productId)] ?? 0;
}

export function reserveInventory(orderId: string, baseProducts: Product[], cart: Record<number, number>) {
  const currentReservations = reservations();
  const existing = currentReservations.find((reservation) => reservation.orderId === orderId);
  if (existing?.status === "reserved" || existing?.status === "consumed") {
    return { ok: true as const };
  }

  const catalog = marketplaceProducts(baseProducts);
  const requested = Object.entries(cart)
    .map(([id, quantity]) => ({
      product: catalog.find((item) => item.id === Number(id)),
      quantity,
    }))
    .filter((entry): entry is { product: Product; quantity: number } => Boolean(entry.product));

  for (const entry of requested) {
    if (entry.quantity <= 0 || entry.product.stock < entry.quantity) {
      return {
        ok: false as const,
        message: `Estoque insuficiente para ${entry.product.name}.`,
      };
    }
  }

  const reservation: Reservation = {
    orderId,
    status: "reserved",
    items: requested.map(({ product, quantity }) => ({
      productId: product.id,
      quantity,
      storeId: product.storeId,
    })),
  };

  for (const item of reservation.items) {
    const dynamic = adjustSharedMarketplaceStock(item.productId, item.storeId, -item.quantity);
    if (!dynamic) adjustStaticStock(item.productId, -item.quantity);
  }
  writeJson(RESERVATION_KEY, [
    reservation,
    ...currentReservations.filter((item) => item.orderId !== orderId),
  ]);
  return { ok: true as const };
}

export function releaseInventory(orderId: string) {
  const current = reservations();
  const reservation = current.find((item) => item.orderId === orderId);
  if (!reservation || reservation.status !== "reserved") return;
  for (const item of reservation.items) {
    const dynamic = adjustSharedMarketplaceStock(item.productId, item.storeId, item.quantity);
    if (!dynamic) adjustStaticStock(item.productId, item.quantity);
  }
  writeJson(
    RESERVATION_KEY,
    current.map((item) => (item.orderId === orderId ? { ...item, status: "released" as const } : item)),
  );
}

export function consumeInventory(orderId: string) {
  const current = reservations();
  writeJson(
    RESERVATION_KEY,
    current.map((item) => (item.orderId === orderId ? { ...item, status: "consumed" as const } : item)),
  );
}
