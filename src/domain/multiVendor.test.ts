import { describe, expect, it } from "vitest";
import { MAX_VENDORS_PER_ORDER, validateMultiVendorCart } from "./multiVendor";

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
});
