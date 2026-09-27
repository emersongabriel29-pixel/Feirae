import { describe, expect, it } from "vitest";
import {
  MAX_VENDORS_PER_ORDER,
  MIN_VENDOR_ORDER_AMOUNT,
  MULTI_VENDOR_EXTRA_STOP_FEE,
  allocatePromotionAcrossVendors,
  calculateMultiVendorDeliveryFee,
  multiVendorMinimumMet,
  validateMultiVendorCart,
  vendorOrderSummaries,
} from "./multiVendor";

describe("multiVendor", () => {
  it("allows multiple vendors from the same fair", () => {
    expect(
      validateMultiVendorCart({
        currentFairName: "Feira do Produtor Rural",
        currentVendorNames: ["Banca A", "Banca B"],
        nextFairName: "Feira do Produtor Rural",
        nextVendorName: "Banca C",
      }),
    ).toEqual({ allowed: true });
  });

  it("blocks mixing different fairs", () => {
    const decision = validateMultiVendorCart({
      currentFairName: "Feira A",
      currentVendorNames: ["Banca A"],
      nextFairName: "Feira B",
      nextVendorName: "Banca B",
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.reason).toBe("different_fair");
  });

  it("limits an MVP order to four vendors", () => {
    const decision = validateMultiVendorCart({
      currentFairName: "Feira A",
      currentVendorNames: Array.from({ length: MAX_VENDORS_PER_ORDER }, (_, index) => `Banca ${index + 1}`),
      nextFairName: "Feira A",
      nextVendorName: "Banca 5",
    });
    expect(decision.allowed).toBe(false);
    if (!decision.allowed) expect(decision.reason).toBe("vendor_limit");
  });

  it("still allows more items from a vendor already in the cart", () => {
    expect(
      validateMultiVendorCart({
        currentFairName: "Feira A",
        currentVendorNames: ["Banca 1", "Banca 2", "Banca 3", "Banca 4"],
        nextFairName: "Feira A",
        nextVendorName: "Banca 4",
      }),
    ).toEqual({ allowed: true });
  });

  it("requires at least R$ 30 from every vendor", () => {
    const items = [
      { id: 1, feirante: "Banca A", price: 20 },
      { id: 2, feirante: "Banca B", price: 15 },
    ];
    const cart = { 1: 2, 2: 1 };
    const summaries = vendorOrderSummaries(items, cart);

    expect(MIN_VENDOR_ORDER_AMOUNT).toBe(30);
    expect(summaries).toEqual([
      { vendorName: "Banca A", subtotal: 40, missingForMinimum: 0, meetsMinimum: true },
      { vendorName: "Banca B", subtotal: 15, missingForMinimum: 15, meetsMinimum: false },
    ]);
    expect(multiVendorMinimumMet(items, cart)).toBe(false);
  });

  it("accepts checkout when every vendor reaches the minimum", () => {
    const items = [
      { id: 1, feirante: "Banca A", price: 30 },
      { id: 2, feirante: "Banca B", price: 10 },
    ];
    expect(multiVendorMinimumMet(items, { 1: 1, 2: 3 })).toBe(true);
  });

  it("allocates promotion discount across vendors for partial refund accounting", () => {
    const items = [
      { id: 1, feirante: "Banca A", price: 60 },
      { id: 2, feirante: "Banca B", price: 40 },
    ];
    const allocation = allocatePromotionAcrossVendors(items, { 1: 1, 2: 1 }, 10);

    expect(allocation).toEqual([
      expect.objectContaining({ vendorName: "Banca A", promotionDiscount: 6, netMerchandise: 54 }),
      expect.objectContaining({ vendorName: "Banca B", promotionDiscount: 4, netMerchandise: 36 }),
    ]);
  });

  it("charges one base freight plus a small extra-stop fee for each additional vendor", () => {
    expect(MULTI_VENDOR_EXTRA_STOP_FEE).toBe(2.5);
    expect(calculateMultiVendorDeliveryFee(12, 1)).toBe(12);
    expect(calculateMultiVendorDeliveryFee(12, 3)).toBe(17);
  });
});
