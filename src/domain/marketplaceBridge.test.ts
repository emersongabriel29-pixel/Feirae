import { beforeEach, describe, expect, it } from "vitest";
import type { Product } from "../types";
import {
  calculateCheckoutPromotions,
  marketplaceProducts,
  registerPromotionUsage,
  syncVendorMarketplace,
} from "./marketplaceBridge";

const base: Product[] = [
  {
    id: 1,
    name: "Cesta",
    feirante: "Banca A",
    fair: "Feira X",
    price: 30,
    category: "Frutas",
    emoji: "🧺",
    stock: 10,
    unit: "un",
    weightKg: 2,
    volume: "leve",
  },
];

describe("marketplace bridge", () => {
  beforeEach(() => {
    window.localStorage.removeItem("feirae:marketplace:v2");
    window.localStorage.removeItem("feirae:static-stock-adjustments:v1");
  });

  it("replaces the static catalog with the vendor live product", () => {
    syncVendorMarketplace({
      accountKey: "vendor@test",
      name: "Banca A",
      fairName: "Feira X",
      isOpen: true,
      approved: true,
      deliveryEnabled: true,
      pickupEnabled: true,
      absorbDeliveryFee: false,
      acceptCashOnDelivery: true,
      acceptCardOnDelivery: true,
      promotions: [],
      products: [
        {
          id: 1,
          name: "Cesta premium",
          category: "Frutas",
          stock: 4,
          active: true,
          price: 45,
          saleUnit: "un",
          weightKg: 2.5,
        },
      ],
    });

    const catalog = marketplaceProducts(base);
    expect(catalog).toHaveLength(1);
    expect(catalog[0].name).toBe("Cesta premium");
    expect(catalog[0].price).toBe(45);
    expect(catalog[0].stock).toBe(4);
  });

  it("applies a valid coupon and consumes its usage count", () => {
    syncVendorMarketplace({
      accountKey: "vendor@test",
      name: "Banca A",
      fairName: "Feira X",
      isOpen: true,
      approved: true,
      deliveryEnabled: true,
      pickupEnabled: true,
      absorbDeliveryFee: false,
      acceptCashOnDelivery: true,
      acceptCardOnDelivery: true,
      promotions: [
        {
          id: "coupon",
          type: "cupom",
          name: "Cupom 10",
          rule: "10% de desconto",
          couponCode: "FEIRA10",
          discountValue: 10,
          startsAt: "",
          endsAt: "",
          active: true,
          vendorPaysDelivery: false,
          usageLimit: 2,
          usedCount: 0,
        },
      ],
      products: [
        {
          id: 1,
          name: "Cesta",
          category: "Frutas",
          stock: 10,
          active: true,
          price: 30,
          saleUnit: "un",
          weightKg: 2,
        },
      ],
    });

    const items = marketplaceProducts(base);
    expect(calculateCheckoutPromotions(items, { 1: 1 }, 10, "ERRADO").promotionDiscount).toBe(0);
    expect(calculateCheckoutPromotions(items, { 1: 1 }, 10, "FEIRA10").promotionDiscount).toBe(3);

    registerPromotionUsage(["Cupom 10"]);
    const result = calculateCheckoutPromotions(items, { 1: 1 }, 10, "FEIRA10");
    expect(result.appliedPromotions).toContain("Cupom 10");
  });

  it("calculates compre X leve Y from the configured quantities", () => {
    syncVendorMarketplace({
      accountKey: "vendor@test",
      name: "Banca A",
      fairName: "Feira X",
      isOpen: true,
      approved: true,
      deliveryEnabled: true,
      pickupEnabled: true,
      absorbDeliveryFee: false,
      acceptCashOnDelivery: true,
      acceptCardOnDelivery: true,
      promotions: [
        {
          id: "buy-take",
          type: "compreLeve",
          name: "Pague 2 leve 3",
          rule: "Pague 2 e leve 3",
          target: "Cesta",
          payQuantity: 2,
          takeQuantity: 3,
          startsAt: "",
          endsAt: "",
          active: true,
          vendorPaysDelivery: false,
          usageLimit: 0,
          usedCount: 0,
        },
      ],
      products: [
        {
          id: 1,
          name: "Cesta",
          category: "Frutas",
          stock: 10,
          active: true,
          price: 30,
          saleUnit: "un",
          weightKg: 2,
        },
      ],
    });

    const result = calculateCheckoutPromotions(marketplaceProducts(base), { 1: 3 }, 10);
    expect(result.promotionDiscount).toBe(30);
  });

  it("hides products from an unapproved vendor", () => {
    syncVendorMarketplace({
      accountKey: "vendor@test",
      name: "Banca A",
      fairName: "Feira X",
      isOpen: false,
      approved: false,
      deliveryEnabled: true,
      pickupEnabled: true,
      absorbDeliveryFee: false,
      acceptCashOnDelivery: true,
      acceptCardOnDelivery: true,
      promotions: [],
      products: [
        {
          id: 1,
          name: "Cesta",
          category: "Frutas",
          stock: 10,
          active: true,
          price: 30,
          saleUnit: "un",
          weightKg: 2,
        },
      ],
    });

    expect(marketplaceProducts(base)).toHaveLength(0);
  });
});
