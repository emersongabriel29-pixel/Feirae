import type { Product } from "../types";
import { storeIdFor, vendorIdFor } from "./identity";

export type SharedPromotion = {
  id: string;
  type: string;
  name: string;
  rule: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
  vendorPaysDelivery: boolean;
  usageLimit: number;
  usedCount: number;
  minimumOrder?: number;
  discountValue?: number;
  target?: string;
  couponCode?: string;
  payQuantity?: number;
  takeQuantity?: number;
};

export type SharedStore = {
  accountKey: string;
  vendorId: string;
  storeId: string;
  name: string;
  fairName: string;
  isOpen: boolean;
  approved: boolean;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  absorbDeliveryFee: boolean;
  acceptCashOnDelivery: boolean;
  acceptCardOnDelivery: boolean;
  promotions: SharedPromotion[];
  aliases?: string[];
  updatedAt: string;
};

export type SharedCatalogProduct = Product & {
  vendorId: string;
  storeId: string;
  active: boolean;
};

type SharedMarketplace = {
  stores: SharedStore[];
  products: SharedCatalogProduct[];
};

const STORAGE_KEY = "feirae:marketplace:v2";
const STATIC_ADJUSTMENT_KEY = "feirae:static-stock-adjustments:v1";

function staticAdjustment(productId: number) {
  if (typeof window === "undefined") return 0;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STATIC_ADJUSTMENT_KEY) ?? "{}") as Record<
      string,
      number
    >;
    return parsed[String(productId)] ?? 0;
  } catch {
    return 0;
  }
}

function readMarketplace(): SharedMarketplace {
  if (typeof window === "undefined") return { stores: [], products: [] };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<SharedMarketplace>;
    return {
      stores: Array.isArray(parsed.stores) ? parsed.stores : [],
      products: Array.isArray(parsed.products) ? parsed.products : [],
    };
  } catch {
    return { stores: [], products: [] };
  }
}

function writeMarketplace(value: SharedMarketplace) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function syncVendorMarketplace(input: {
  accountKey: string;
  name: string;
  fairName: string;
  isOpen: boolean;
  approved: boolean;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  absorbDeliveryFee: boolean;
  acceptCashOnDelivery: boolean;
  acceptCardOnDelivery: boolean;
  promotions: SharedPromotion[];
  products: Array<{
    id: number;
    name: string;
    category: string;
    stock: number;
    active: boolean;
    price: number;
    saleUnit: string;
    weightKg: number;
  }>;
}) {
  const current = readMarketplace();
  const previousStore = current.stores.find((store) => store.accountKey === input.accountKey);
  const vendorId = previousStore?.vendorId ?? vendorIdFor(input.accountKey || input.name);
  const storeId = previousStore?.storeId ?? storeIdFor(input.fairName, input.accountKey || input.name);
  const store: SharedStore = {
    accountKey: input.accountKey,
    vendorId,
    storeId,
    name: input.name,
    fairName: input.fairName,
    isOpen: input.isOpen,
    approved: input.approved,
    deliveryEnabled: input.deliveryEnabled,
    pickupEnabled: input.pickupEnabled,
    absorbDeliveryFee: input.absorbDeliveryFee,
    acceptCashOnDelivery: input.acceptCashOnDelivery,
    acceptCardOnDelivery: input.acceptCardOnDelivery,
    promotions: input.promotions,
    aliases: Array.from(
      new Set([...(previousStore?.aliases ?? []), previousStore?.name, input.name].filter(Boolean) as string[]),
    ),
    updatedAt: new Date().toISOString(),
  };
  const products: SharedCatalogProduct[] = input.products.map((product) => ({
    id: product.id,
    name: product.name,
    feirante: input.name,
    fair: input.fairName,
    price: product.price,
    category: product.category,
    emoji: "🧺",
    stock: product.stock,
    unit: product.saleUnit,
    weightKg: product.weightKg,
    volume: product.weightKg >= 15 ? "pesado" : product.weightKg >= 4 ? "medio" : "leve",
    vendorId,
    storeId,
    active: input.approved && product.active && product.stock > 0,
  }));

  writeMarketplace({
    stores: [...current.stores.filter((item) => item.accountKey !== input.accountKey), store],
    products: [...current.products.filter((item) => item.storeId !== storeId), ...products],
  });
}

export function readSharedStores() {
  return readMarketplace().stores;
}

export function readStoreByIdentity(fairName: string, vendorName: string) {
  const current = readMarketplace();
  return current.stores.find(
    (store) =>
      store.fairName === fairName &&
      (store.name === vendorName || store.vendorId === vendorIdFor(vendorName)),
  );
}

export function marketplaceProducts(baseProducts: Product[]): Product[] {
  const current = readMarketplace();
  if (!current.products.length) {
    return baseProducts
      .map((product) => {
        const stock = Math.max(0, product.stock + staticAdjustment(product.id));
        return {
          ...product,
          stock,
          vendorId: product.vendorId ?? vendorIdFor(product.feirante),
          storeId: product.storeId ?? storeIdFor(product.fair, product.feirante),
          active: (product.active ?? true) && stock > 0,
        };
      })
      .filter((product) => (product.active ?? true) && product.stock > 0);
  }

  const dynamicStoreNames = new Set(
    current.stores.flatMap((store) =>
      [store.name, ...(store.aliases ?? [])].map((name) => `${store.fairName}::${name}`),
    ),
  );
  const staticProducts = baseProducts
    .filter((product) => !dynamicStoreNames.has(`${product.fair}::${product.feirante}`))
    .map((product) => {
      const stock = Math.max(0, product.stock + staticAdjustment(product.id));
      return {
        ...product,
        stock,
        vendorId: product.vendorId ?? vendorIdFor(product.feirante),
        storeId: product.storeId ?? storeIdFor(product.fair, product.feirante),
        active: (product.active ?? true) && stock > 0,
      };
    });
  return [...staticProducts, ...current.products].filter((product) => (product.active ?? true) && product.stock > 0);
}

function promotionIsActive(promotion: SharedPromotion) {
  if (!promotion.active) return false;
  const now = Date.now();
  if (promotion.startsAt && Date.parse(promotion.startsAt) > now) return false;
  if (promotion.endsAt && Date.parse(promotion.endsAt) < now) return false;
  if (promotion.usageLimit > 0 && promotion.usedCount >= promotion.usageLimit) return false;
  return true;
}

export function registerPromotionUsage(promotionNames: string[]) {
  if (!promotionNames.length) return;
  const current = readMarketplace();
  const names = new Set(promotionNames);
  writeMarketplace({
    ...current,
    stores: current.stores.map((store) => ({
      ...store,
      promotions: store.promotions.map((promotion) =>
        names.has(promotion.name)
          ? { ...promotion, usedCount: promotion.usedCount + 1 }
          : promotion,
      ),
    })),
  });
}

export function calculateCheckoutPromotions(
  items: Product[],
  cart: Record<number, number>,
  calculatedDeliveryFee: number,
  couponCode = "",
) {
  const marketplace = readMarketplace();
  let promotionDiscount = 0;
  let deliverySubsidy = 0;
  const applied: string[] = [];

  for (const store of marketplace.stores) {
    const storeItems = items.filter(
      (item) =>
        item.storeId === store.storeId ||
        (item.fair === store.fairName && item.feirante === store.name),
    );
    if (!storeItems.length) continue;
    const storeSubtotal = storeItems.reduce(
      (sum, item) => sum + item.price * (cart[item.id] ?? 0),
      0,
    );

    for (const promotion of store.promotions.filter(promotionIsActive)) {
      if (storeSubtotal < (promotion.minimumOrder ?? 0)) continue;
      const targetItems = promotion.target
        ? storeItems.filter(
            (item) =>
              item.name.toLocaleLowerCase("pt-BR").includes(promotion.target!.toLocaleLowerCase("pt-BR")) ||
              item.category.toLocaleLowerCase("pt-BR").includes(promotion.target!.toLocaleLowerCase("pt-BR")),
          )
        : storeItems;
      const targetSubtotal = targetItems.reduce(
        (sum, item) => sum + item.price * (cart[item.id] ?? 0),
        0,
      );

      if (
        promotion.type === "cupom" &&
        (!promotion.couponCode ||
          promotion.couponCode.toLocaleUpperCase("pt-BR") !== couponCode.trim().toLocaleUpperCase("pt-BR"))
      ) {
        continue;
      }

      if (promotion.type === "freteGratis" && promotion.vendorPaysDelivery) {
        deliverySubsidy = Math.max(deliverySubsidy, calculatedDeliveryFee);
        applied.push(promotion.name);
      } else if (
        ["percentual", "produtoCategoria", "horario", "combo", "cupom"].includes(promotion.type) &&
        (promotion.discountValue ?? 0) > 0
      ) {
        promotionDiscount +=
          targetSubtotal * Math.min(100, promotion.discountValue ?? 0) / 100;
        applied.push(promotion.name);
      } else if (promotion.type === "valorFixo" && (promotion.discountValue ?? 0) > 0) {
        promotionDiscount += Math.min(storeSubtotal, promotion.discountValue ?? 0);
        applied.push(promotion.name);
      } else if (promotion.type === "compreLeve") {
        const pay = Math.max(1, promotion.payQuantity ?? 1);
        const take = Math.max(pay + 1, promotion.takeQuantity ?? pay + 1);
        const quantity = targetItems.reduce((sum, item) => sum + (cart[item.id] ?? 0), 0);
        const freeUnits = Math.floor(quantity / take) * (take - pay);
        if (freeUnits > 0 && targetItems.length) {
          const lowestUnitPrice = Math.min(...targetItems.map((item) => item.price));
          promotionDiscount += freeUnits * lowestUnitPrice;
          applied.push(promotion.name);
        }
      }
    }
  }

  return {
    promotionDiscount: Math.round(promotionDiscount * 100) / 100,
    deliverySubsidy: Math.min(calculatedDeliveryFee, Math.round(deliverySubsidy * 100) / 100),
    appliedPromotions: Array.from(new Set(applied)),
  };
}
