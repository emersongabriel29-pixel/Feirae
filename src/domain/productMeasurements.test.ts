import { describe, expect, it } from "vitest";
import { exactPresentation, measurementPolicyForCategory } from "./productMeasurements";

describe("product measurement policies", () => {
  it("uses package or bulk choices for flour and grains", () => {
    const policy = measurementPolicyForCategory("Cereais e grãos");

    expect(policy.allowedUnits).toContain("pacote");
    expect(policy.allowedUnits).toContain("kg");
    expect(policy.examples).toContain("pacote 500 g");
    expect(policy.examples).toContain("pacote 1 kg");
  });

  it("uses maço as the default presentation for cheiro-verde and herbs", () => {
    const policy = measurementPolicyForCategory("Folhas e ervas");

    expect(policy.defaultUnit).toBe("maço");
    expect(policy.allowedUnits).toContain("maço");
    expect(policy.allowedUnits).not.toContain("kg");
  });

  it("allows fish by kg, fixed package or whole piece", () => {
    const policy = measurementPolicyForCategory("Pescados e frutos do mar");

    expect(policy.allowedUnits).toEqual(expect.arrayContaining(["kg", "bandeja", "pacote", "peça", "un"]));
  });

  it("keeps the customer presentation exact instead of promising a variable price", () => {
    expect(exactPresentation("pacote", "pacote 500 g")).toBe("pacote 500 g");
    expect(exactPresentation("kg")).toBe("1 kg");
  });
});
