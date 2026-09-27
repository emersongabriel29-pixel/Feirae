import { describe, expect, it } from "vitest";
import {
  DEFAULT_VENDOR_MINIMUM_ORDER_AMOUNT,
  MAX_VENDOR_MINIMUM_ORDER_AMOUNT,
  MAX_VENDORS_PER_ORDER,
  MULTI_VENDOR_EXTRA_STOP_FEE,
  allocatePromotionAcrossVendors,
  calculateMultiVendorDeliveryFee,
  multiVendorMinimumMet,
  normalizeVendorMinimumOrder,
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

  it("keeps R$ 30 only as the fallback for bancas without a configured minimum", () => {
    const items = [
      { id: 1, feirante: "Banca A", price: 20 },
      { id: 2, feirante: "Banca B", price: 15 },
    ];
    const cart = { 1: 2, 2: 1 };
    const summaries = vendorOrderSummaries(items, cart);

    expect(DEFAULT_VENDOR_MINIMUM_ORDER_AMOUNT).toBe(30);
    expect(summaries).toEqual([
      {
        vendorName: "Banca A",
        subtotal: 40,
        promotionDiscount: 0,
        eligibleSubtotal: 40,
        minimumOrderAmount: 30,
        missingForMinimum: 0,
        meetsMinimum: true,
      },
      {
        vendorName: "Banca B",
        subtotal: 15,
        promotionDiscount: 0,
        eligibleSubtotal: 15,
        minimumOrderAmount: 30,
        missingForMinimum: 15,
        meetsMinimum: false,
      },
    ]);
  });

  it("supports a different minimum for each banca and no minimum at all", () => {
    const items = [
      { id: 1, feirante: "Banca A", price: 20 },
      { id: 2, feirante: "Banca B", price: 5 },
      { id: 3, feirante: "Banca C", price: 1 },
    ];
    const minimums = { "Banca A": 40, "Banca B": 10, "Banca C": 0 };
    const summaries = vendorOrderSummaries(items, { 1: 2, 2: 1, 3: 1 }, minimums);

    expect(summaries.map(({ vendorName, minimumOrderAmount, meetsMinimum }) => ({
      vendorName,
      minimumOrderAmount,
      meetsMinimum,
    }))).toEqual([
      { vendorName: "Banca A", minimumOrderAmount: 40, meetsMinimum: true },
      { vendorName: "Banca B", minimumOrderAmount: 10, meetsMinimum: false },
      { vendorName: "Banca C", minimumOrderAmount: 0, meetsMinimum: true },
    ]);
    expect(multiVendorMinimumMet(items, { 1: 2, 2: 1, 3: 1 }, minimums)).toBe(false);
  });

  it("uses merchandise after vendor-funded discounts to validate the banca minimum", () => {
    const items = [{ id: 1, feirante: "Banca A", price: 50 }];
    const summaries = vendorOrderSummaries(items, { 1: 1 }, { "Banca A": 45 }, { "Banca A": 10 });

    expect(summaries[0]).toEqual(
      expect.objectContaining({
        subtotal: 50,
        promotionDiscount: 10,
        eligibleSubtotal: 40,
        minimumOrderAmount: 45,
        missingForMinimum: 5,
        meetsMinimum: false,
      }),
    );
  });

  it("normalizes configured minimums to the platform range", () => {
    expect(normalizeVendorMinimumOrder(undefined)).toBe(30);
    expect(normalizeVendorMinimumOrder(-10)).toBe(0);
    expect(normalizeVendorMinimumOrder(22.555)).toBe(22.56);
    expect(normalizeVendorMinimumOrder(500)).toBe(MAX_VENDOR_MINIMUM_ORDER_AMOUNT);
    expect(MAX_VENDOR_MINIMUM_ORDER_AMOUNT).toBe(100);
  });

  it("accepts checkout when every vendor reaches its own minimum", () => {
    const items = [
      { id: 1, feirante: "Banca A", price: 30 },
      { id: 2, feirante: "Banca B", price: 10 },
    ];
    expect(multiVendorMinimumMet(items, { 1: 1, 2: 1 }, { "Banca A": 30, "Banca B": 10 })).toBe(true);
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
