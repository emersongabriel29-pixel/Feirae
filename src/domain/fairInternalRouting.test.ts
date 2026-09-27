import { describe, expect, it } from "vitest";
import {
  optimizeInternalFairRoute,
  pickupCodeMatches,
  pickupVerificationCode,
  pickupVerificationPayload,
} from "./fairInternalRouting";

describe("fairInternalRouting", () => {
  it("orders mapped stalls from the entrance using the shortest next stop", () => {
    const route = optimizeInternalFairRoute([
      { vendorId: "c", storeId: "c", vendorName: "C", internalX: 40, internalY: 0 },
      { vendorId: "a", storeId: "a", vendorName: "A", internalX: 5, internalY: 0 },
      { vendorId: "b", storeId: "b", vendorName: "B", internalX: 12, internalY: 0 },
    ]);

    expect(route.stops.map((stop) => stop.vendorName)).toEqual(["A", "B", "C"]);
    expect(route.distanceMeters).toBe(80);
    expect(route.strategy).toBe("internal_map");
  });

  it("falls back to sector corridor and box when stalls do not have map coordinates", () => {
    const route = optimizeInternalFairRoute([
      { vendorId: "2", storeId: "2", vendorName: "B", sector: "B", corridor: "2", box: "10" },
      { vendorId: "1", storeId: "1", vendorName: "A", sector: "A", corridor: "1", box: "2" },
    ]);

    expect(route.stops.map((stop) => stop.vendorName)).toEqual(["A", "B"]);
    expect(route.distanceMeters).toBe(0);
    expect(route.strategy).toBe("corridor_box_fallback");
  });

  it("puts mapped stalls first and preserves a fallback sequence for unmapped stalls", () => {
    const route = optimizeInternalFairRoute([
      { vendorId: "u", storeId: "u", vendorName: "Sem mapa", corridor: "C", box: "3" },
      { vendorId: "m", storeId: "m", vendorName: "Mapeada", internalX: 8, internalY: 6 },
    ]);

    expect(route.stops.map((stop) => stop.vendorName)).toEqual(["Mapeada", "Sem mapa"]);
    expect(route.mappedStops).toBe(1);
    expect(route.unmappedStops).toBe(1);
    expect(route.strategy).toBe("mixed");
  });

  it("creates a stable pickup verification code and accepts code or QR payload", () => {
    const code = pickupVerificationCode("store:test");
    expect(code).toMatch(/^FEIRAE-[A-Z0-9]+$/);
    expect(pickupVerificationCode("store:test")).toBe(code);
    expect(pickupCodeMatches("store:test", code)).toBe(true);
    expect(pickupCodeMatches("store:test", pickupVerificationPayload("store:test"))).toBe(true);
    expect(pickupCodeMatches("store:test", "FEIRAE-ERRADO")).toBe(false);
  });
});
