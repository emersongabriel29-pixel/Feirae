import { describe, expect, it } from "vitest";
import { calculateDeliveryQuote, routeProgressSummary } from "./deliveryPricing";

describe("delivery pricing", () => {
  it("separates driver pay, platform fee and customer freight", () => {
    const quote = calculateDeliveryQuote({
      vehicleType: "Moto",
      distanceKm: 6.3,
      weightKg: 8.4,
      pickupCount: 2,
    });

    expect(quote.driverPay).toBeGreaterThan(0);
    expect(quote.platformFee).toBeGreaterThanOrEqual(1.5);
    expect(quote.customerFee).toBeCloseTo(quote.driverPay + quote.platformFee, 2);
    expect(quote.extraPickupPay).toBe(1.5);
  });

  it("increases driver pay for heavier routes after the included weight", () => {
    const light = calculateDeliveryQuote({
      vehicleType: "Carro",
      distanceKm: 10,
      weightKg: 20,
      pickupCount: 1,
    });
    const heavy = calculateDeliveryQuote({
      vehicleType: "Carro",
      distanceKm: 10,
      weightKg: 50,
      pickupCount: 1,
    });

    expect(heavy.driverPay).toBeGreaterThan(light.driverPay);
    expect(heavy.weightPay).toBeGreaterThan(0);
  });

  it("changes the active destination after collection", () => {
    const toPickup = routeProgressSummary({
      stage: 0,
      pickupDistanceKm: 2.1,
      pickupEtaMinutes: 7,
      deliveryDistanceKm: 4.2,
      deliveryEtaMinutes: 14,
    });
    const toCustomer = routeProgressSummary({
      stage: 2,
      pickupDistanceKm: 2.1,
      pickupEtaMinutes: 7,
      deliveryDistanceKm: 4.2,
      deliveryEtaMinutes: 14,
    });

    expect(toPickup.destination).toBe("pickup");
    expect(toPickup.etaMinutes).toBe(7);
    expect(toCustomer.destination).toBe("dropoff");
    expect(toCustomer.distanceKm).toBe(4.2);
  });
});
