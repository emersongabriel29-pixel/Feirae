import { describe, expect, it } from "vitest";
import type { Fair } from "../types";
import { isFairActive, visibleCustomerFairs } from "./fairAvailability";

const activeFair: Fair = {
  name: "Feira Ativa",
  place: "Planaltina",
  status: "Aberta",
  source: "official",
  active: true,
};

const inactiveFair: Fair = {
  name: "Feira Inativa",
  place: "Sobradinho",
  status: "Inativa",
  source: "official",
  active: false,
};

const demoFair: Fair = {
  name: "Feira Demo",
  place: "Planaltina",
  status: "Demo",
  source: "demo",
};

describe("fair availability", () => {
  it("treats fairs as active by default unless explicitly disabled", () => {
    expect(isFairActive(activeFair)).toBe(true);
    expect(isFairActive({ ...activeFair, active: undefined })).toBe(true);
    expect(isFairActive(inactiveFair)).toBe(false);
  });

  it("hides inactive and demo fairs from customer choices", () => {
    expect(visibleCustomerFairs([activeFair, inactiveFair, demoFair])).toEqual([activeFair]);
  });
});
