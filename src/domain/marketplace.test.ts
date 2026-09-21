import { describe, expect, it } from "vitest";
import { products, vendorMetrics } from "../data";
import { cartWeight, metricForVendor, vehicleForWeight, vendorSummaries } from "./marketplace";

describe("marketplace domain rules", () => {
  it("calculates the weight of the current cart", () => {
    const selected = products.filter((product) => [1, 2].includes(product.id));
    expect(cartWeight(selected, { 1: 2, 2: 1 })).toBeCloseTo(8.8);
  });

  it("selects a vehicle that supports the cart weight", () => {
    expect(vehicleForWeight(4).name).toBe("Bicicleta");
    expect(vehicleForWeight(12).name).toBe("Moto");
    expect(vehicleForWeight(21).name).toBe("Carro");
  });

  it("uses a safe fallback for vendors without metrics", () => {
    expect(metricForVendor("Banca nova", vendorMetrics)).toMatchObject({ rating: 4.8, deliveryFee: 9.9 });
  });

  it("builds one summary per vendor", () => {
    const summaries = vendorSummaries(products, vendorMetrics);
    expect(summaries.length).toBeGreaterThan(1);
    expect(new Set(summaries.map((vendor) => vendor.name)).size).toBe(summaries.length);
  });
});
