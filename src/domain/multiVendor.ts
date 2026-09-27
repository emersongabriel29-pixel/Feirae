export const MAX_VENDORS_PER_ORDER = 4;

export type MultiVendorCartDecision =
  | { allowed: true }
  | { allowed: false; reason: "different_fair" | "vendor_limit"; message: string };

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
