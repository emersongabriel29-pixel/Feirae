import { describe, expect, it } from "vitest";
import { products } from "./data";
import { cartSubtotal, distanceInKm, filterProducts, sortFairsByDistance } from "./utils";

describe("marketplace helpers", () => {
  it("filters products without ignoring accents or casing", () => {
    expect(filterProducts(products, "QUEIJO", "Todos").map((item) => item.name)).toEqual([
      "Queijo artesanal",
    ]);
    expect(filterProducts(products, "", "Hortifruti")).toHaveLength(4);
  });

  it("calculates cart totals", () => {
    expect(cartSubtotal(products, { 1: 2, 2: 1 })).toBeCloseTo(81.8);
  });

  it("calculates distances and sorts nearby fairs", () => {
    expect(distanceInKm(-15.62, -47.65, -15.62, -47.65)).toBe(0);
    const sorted = sortFairsByDistance(
      [
        {
          name: "Longe",
          place: "B",
          status: "Aberta",
          feirantes: 1,
          rating: 4.7,
          reviewCount: 100,
          deliveryMinutes: [40, 60],
          deliveryFee: 9.9,
          lat: -16,
          lng: -48,
        },
        {
          name: "Perto",
          place: "A",
          status: "Aberta",
          feirantes: 1,
          rating: 4.8,
          reviewCount: 120,
          deliveryMinutes: [20, 35],
          deliveryFee: 7.9,
          lat: -15.62,
          lng: -47.65,
        },
      ],
      { lat: -15.62, lng: -47.65 },
    );
    expect(sorted[0].name).toBe("Perto");
  });
});
