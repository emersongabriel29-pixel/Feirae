export const MAX_VENDORS_PER_ORDER = 4;
export const MIN_VENDOR_ORDER_AMOUNT = 30;
export const MULTI_VENDOR_EXTRA_STOP_FEE = 2.5;

export type MultiVendorCartDecision =
  | { allowed: true }
  | { allowed: false; reason: "different_fair" | "vendor_limit"; message: string };

export type VendorOrderSummary = {
  vendorName: string;
  subtotal: number;
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

export function vendorOrderSummaries<
  T extends { id: number; feirante: string; price: number }
>(items: T[], cart: Record<number, number>): VendorOrderSummary[] {
  const totals = new Map<string, number>();

  for (const item of items) {
    const quantity = cart[item.id] ?? 0;
    if (quantity <= 0) continue;
    totals.set(item.feirante, (totals.get(item.feirante) ?? 0) + item.price * quantity);
  }

  return Array.from(totals.entries()).map(([vendorName, rawSubtotal]) => {
    const subtotal = Math.round(rawSubtotal * 100) / 100;
    const missingForMinimum = Math.max(
      0,
      Math.round((MIN_VENDOR_ORDER_AMOUNT - subtotal) * 100) / 100,
    );
    return {
      vendorName,
      subtotal,
      missingForMinimum,
      meetsMinimum: missingForMinimum === 0,
    };
  });
}

export function multiVendorMinimumMet<
  T extends { id: number; feirante: string; price: number }
>(items: T[], cart: Record<number, number>) {
  const summaries = vendorOrderSummaries(items, cart);
  return summaries.length > 0 && summaries.every((summary) => summary.meetsMinimum);
}

export function calculateMultiVendorDeliveryFee(baseDeliveryFee: number, vendorCount: number) {
  const safeBase = Math.max(0, baseDeliveryFee);
  const additionalStops = Math.max(0, vendorCount - 1);
  return Math.round((safeBase + additionalStops * MULTI_VENDOR_EXTRA_STOP_FEE) * 100) / 100;
}
