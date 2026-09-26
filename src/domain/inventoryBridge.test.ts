import { beforeEach, describe, expect, it } from "vitest";
import type { Product } from "../types";
import { marketplaceProducts } from "./marketplaceBridge";
import { consumeInventory, releaseInventory, reserveInventory } from "./inventoryBridge";

const base: Product[] = [
  {
    id: 101,
    name: "Produto teste",
    feirante: "Banca Teste",
    fair: "Feira Teste",
    price: 10,
    category: "Outros",
    emoji: "🧺",
    stock: 3,
    unit: "un",
    weightKg: 1,
    volume: "leve",
  },
];

describe("inventory bridge", () => {
  beforeEach(() => {
    window.localStorage.removeItem("feirae:inventory-reservations:v1");
    window.localStorage.removeItem("feirae:static-stock-adjustments:v1");
    window.localStorage.removeItem("feirae:marketplace:v2");
  });

  it("reserves stock and returns it on cancellation", () => {
    expect(reserveInventory("FE-STOCK", base, { 101: 2 }).ok).toBe(true);
    expect(marketplaceProducts(base)[0].stock).toBe(1);

    releaseInventory("FE-STOCK");
    expect(marketplaceProducts(base)[0].stock).toBe(3);
  });

  it("does not release stock after consumption", () => {
    expect(reserveInventory("FE-CONSUMED", base, { 101: 2 }).ok).toBe(true);
    consumeInventory("FE-CONSUMED");
    releaseInventory("FE-CONSUMED");

    expect(marketplaceProducts(base)[0].stock).toBe(1);
  });

  it("rejects a reservation that exceeds current stock", () => {
    const result = reserveInventory("FE-OVER", base, { 101: 4 });
    expect(result.ok).toBe(false);
    expect(marketplaceProducts(base)[0].stock).toBe(3);
  });
});
