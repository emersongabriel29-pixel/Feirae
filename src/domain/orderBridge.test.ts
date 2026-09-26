import { beforeEach, describe, expect, it } from "vitest";
import {
  appendReview,
  appendSupportTicket,
  patchUnifiedOrderItem,
  patchVendorStatus,
  readUnifiedOrders,
  upsertUnifiedOrder,
} from "./orderBridge";

describe("unified order bridge", () => {
  beforeEach(() => {
    window.localStorage.removeItem("feirae:unified-orders:v1");
    window.localStorage.removeItem("feirae:unified-orders:v2");
  });

  function seedOrder() {
    upsertUnifiedOrder({
      id: "FE-MULTI",
      createdAt: "2026-09-25T12:00:00-03:00",
      updatedAt: "2026-09-25T12:00:00-03:00",
      customerKey: "cliente@feirae.test",
      fairName: "Feira do Produtor Rural",
      customerName: "Cliente",
      fulfillment: "delivery",
      paymentMethod: "Pix",
      paymentStatus: "authorized",
      subtotal: 50,
      calculatedDeliveryFee: 10,
      deliverySubsidy: 0,
      customerDeliveryFee: 10,
      total: 60,
      items: [
        {
          productId: 1,
          name: "Cesta",
          vendor: "Banca A",
          vendorId: "vendor:a",
          storeId: "store:a",
          quantity: 1,
          unit: "cesta",
          unitPrice: 30,
          weightKg: 4,
        },
        {
          productId: 2,
          name: "Queijo",
          vendor: "Banca B",
          vendorId: "vendor:b",
          storeId: "store:b",
          quantity: 1,
          unit: "un",
          unitPrice: 20,
          weightKg: 1,
        },
      ],
      vendors: [
        {
          vendorId: "vendor:a",
          storeId: "store:a",
          vendorName: "Banca A",
          status: "pending",
          productIds: [1],
        },
        {
          vendorId: "vendor:b",
          storeId: "store:b",
          vendorName: "Banca B",
          status: "pending",
          productIds: [2],
        },
      ],
      status: "received",
      events: [],
    });
  }

  it("only releases a multi-vendor order after every vendor is ready", () => {
    seedOrder();

    patchVendorStatus("FE-MULTI", "vendor:a", "ready");
    expect(readUnifiedOrders()[0].status).toBe("preparing");

    patchVendorStatus("FE-MULTI", "vendor:b", "ready");
    expect(readUnifiedOrders()[0].status).toBe("ready_for_pickup");
  });

  it("propagates actual separated weight to logistics", () => {
    seedOrder();

    patchUnifiedOrderItem("FE-MULTI", "vendor:a", 1, {
      actualWeightKg: 6.25,
    });

    const item = readUnifiedOrders()[0].items.find((candidate) => candidate.productId === 1);
    expect(item?.actualWeightKg).toBe(6.25);
    expect(item?.weightKg).toBe(6.25);
  });

  it("keeps support and cross-role reviews on the same order", () => {
    seedOrder();

    appendSupportTicket("FE-MULTI", {
      id: "SUP-1",
      actor: "delivery",
      topic: "Pane",
      details: "Pneu furou",
      createdAt: "2026-09-25T13:00:00-03:00",
      priority: "urgent",
      status: "open",
    });
    appendReview("FE-MULTI", {
      id: "REV-1",
      authorRole: "customer",
      targetRole: "vendor",
      targetId: "vendor:a",
      rating: 5,
      comment: "Ótimo",
      createdAt: "2026-09-25T14:00:00-03:00",
    });

    const order = readUnifiedOrders()[0];
    expect(order.supportTickets).toHaveLength(1);
    expect(order.reviews).toHaveLength(1);
  });

  it("filters customer history by account key", () => {
    seedOrder();
    expect(readUnifiedOrders("cliente@feirae.test")).toHaveLength(1);
    expect(readUnifiedOrders("outra@feirae.test")).toHaveLength(0);
  });
});
