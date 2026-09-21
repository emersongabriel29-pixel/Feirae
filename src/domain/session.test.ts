import { describe, expect, it } from "vitest";
import { nameFromEmail, readSession, routeForRole } from "./session";

describe("session domain rules", () => {
  it("rejects invalid persisted profiles", () => {
    expect(readSession({ role: "admin", email: "admin@test", name: "Admin" })).toBeNull();
    expect(readSession(null)).toBeNull();
  });

  it("normalizes the account name from an email", () => {
    expect(nameFromEmail("ana.paula@feirae.test")).toBe("Ana Paula");
  });

  it("maps each role to its initial route", () => {
    expect(routeForRole("customer")).toBe("/cliente/inicio");
    expect(routeForRole("feirante")).toBe("/feirante");
    expect(routeForRole("delivery")).toBe("/entregador");
  });
});
