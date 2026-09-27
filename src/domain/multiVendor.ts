export const MAX_VENDORS_PER_ORDER = 4;
export const DEFAULT_VENDOR_MINIMUM_ORDER_AMOUNT = 30;
export const MAX_VENDOR_MINIMUM_ORDER_AMOUNT = 100;
export const MIN_VENDOR_ORDER_AMOUNT = DEFAULT_VENDOR_MINIMUM_ORDER_AMOUNT;
export const MULTI_VENDOR_EXTRA_STOP_FEE = 2.5;

export function normalizeVendorMinimumOrder(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value)) return DEFAULT_VENDOR_MINIMUM_ORDER_AMOUNT;
  return Math.min(MAX_VENDOR_MINIMUM_ORDER_AMOUNT, Math.max(0, Math.round(value * 100) / 100));
}

export type MultiVendorCartDecision =
  { allowed: true } | { allowed: false; reason: "different_fair" | "vendor_limit"; message: string };

export type VendorOrderSummary = {
  vendorName: string;
  subtotal: number;
  promotionDiscount: number;
  eligibleSubtotal: number;
  minimumOrderAmount: number;
  missingForMinimum: number;
  meetsMinimum: boolean;
};

export function validateMultiVendorCart(params: {
  currentFairName?: string;
  currentVendorNames: string[];
  nextFairName: string;
  nextVendorName: string;
}): MultiVendorCartDecision {
  const { currentFairName, currentVendorNames, nextFairName, nextVendorName } = params;

  if (currentFairName && currentFairName !== nextFairName) {
    return {
      allowed: false,
      reason: "different_fair",
      message: `Sua sacola é da ${currentFairName}. Finalize ou esvazie a sacola antes de comprar na ${nextFairName}.`,
    };
  }

  const uniqueVendors = new Set(currentVendorNames);
  if (!uniqueVendors.has(nextVendorName) && uniqueVendors.size >= MAX_VENDORS_PER_ORDER) {
    return {
      allowed: false,
      reason: "vendor_limit",
      message: `No momento, cada pedido pode reunir até ${MAX_VENDORS_PER_ORDER} bancas da mesma feira. Finalize esta sacola para comprar em outra banca.`,
    };
  }

  return { allowed: true };
}

export function vendorOrderSummaries<T extends { id: number; feirante: string; price: number }>(
  items: T[],
  cart: Record<number, number>,
  minimumByVendor: Record<string, number | undefined> = {},
  discountByVendor: Record<string, number | undefined> = {},
): VendorOrderSummary[] {
  const totals = new Map<string, number>();

  for (const item of items) {
    const quantity = cart[item.id] ?? 0;
    if (quantity <= 0) continue;
    totals.set(item.feirante, (totals.get(item.feirante) ?? 0) + item.price * quantity);
  }

  return Array.from(totals.entries()).map(([vendorName, rawSubtotal]) => {
    const subtotal = Math.round(rawSubtotal * 100) / 100;
    const promotionDiscount = Math.max(
      0,
      Math.min(subtotal, Math.round((discountByVendor[vendorName] ?? 0) * 100) / 100),
    );
    const eligibleSubtotal = Math.max(0, Math.round((subtotal - promotionDiscount) * 100) / 100);
    const minimumOrderAmount = normalizeVendorMinimumOrder(minimumByVendor[vendorName]);
    const missingForMinimum = Math.max(
      0,
      Math.round((minimumOrderAmount - eligibleSubtotal) * 100) / 100,
    );
    return {
      vendorName,
      subtotal,
      promotionDiscount,
      eligibleSubtotal,
      minimumOrderAmount,
      missingForMinimum,
      meetsMinimum: missingForMinimum === 0,
    };
  });
}

export function multiVendorMinimumMet<T extends { id: number; feirante: string; price: number }>(
  items: T[],
  cart: Record<number, number>,
  minimumByVendor: Record<string, number | undefined> = {},
  discountByVendor: Record<string, number | undefined> = {},
) {
  const summaries = vendorOrderSummaries(items, cart, minimumByVendor, discountByVendor);
  return summaries.length > 0 && summaries.every((summary) => summary.meetsMinimum);
}

export type VendorFinancialAllocation = VendorOrderSummary & {
  promotionDiscount: number;
  netMerchandise: number;
};

export function allocatePromotionAcrossVendors<T extends { id: number; feirante: string; price: number }>(
  items: T[],
  cart: Record<number, number>,
  promotionDiscount: number,
): VendorFinancialAllocation[] {
  const summaries = vendorOrderSummaries(items, cart);
  const total = summaries.reduce((sum, item) => sum + item.subtotal, 0);
  if (!summaries.length) return [];

  let allocated = 0;
  return summaries.map((summary, index) => {
    const discount =
      index === summaries.length - 1
        ? Math.max(0, Math.round((promotionDiscount - allocated) * 100) / 100)
        : total > 0
          ? Math.max(0, Math.round(promotionDiscount * (summary.subtotal / total) * 100) / 100)
          : 0;
    allocated += discount;
    return {
      ...summary,
      promotionDiscount: discount,
      netMerchandise: Math.max(0, Math.round((summary.subtotal - discount) * 100) / 100),
    };
  });
}

export function calculateMultiVendorDeliveryFee(baseDeliveryFee: number, vendorCount: number) {
  const safeBase = Math.max(0, baseDeliveryFee);
  const additionalStops = Math.max(0, vendorCount - 1);
  return Math.round((safeBase + additionalStops * MULTI_VENDOR_EXTRA_STOP_FEE) * 100) / 100;
}
