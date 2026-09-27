import { beforeEach, describe, expect, it } from "vitest";
import {
  appendReview,
  appendSupportTicket,
  cancelVendorParticipation,
  patchUnifiedOrder,
  patchUnifiedOrderItem,
  patchVendorStatus,
  readUnifiedOrders,
  resolveRefundDestination,
  upsertUnifiedOrder,
} from "./orderBridge";

describe("unified order bridge", () => {
  beforeEach(() => {
    window.localStorage.removeItem("feirae:unified-orders:v1");
    window.localStorage.removeItem("feirae:unified-orders:v2");
  });

  function seedOrder(fulfillment: "delivery" | "pickup" = "delivery") {
    upsertUnifiedOrder({
      id: "FE-MULTI",
      createdAt: "2026-09-25T12:00:00-03:00",
      updatedAt: "2026-09-25T12:00:00-03:00",
      customerKey: "cliente@feirae.test",
      fairName: "Feira do Produtor Rural",
      customerName: "Cliente",
      fulfillment,
      paymentMethod: "Pix",
      paymentStatus: "authorized",
      subtotal: 50,
      calculatedDeliveryFee: 10,
      deliverySubsidy: 0,
      customerDeliveryFee: 10,
      total: 60,
      vendorFinancials: [
        {
          vendorId: "vendor:a",
          storeId: "store:a",
          vendorName: "Banca A",
          merchandiseSubtotal: 30,
          promotionDiscount: 0,
          netMerchandise: 30,
        },
        {
          vendorId: "vendor:b",
          storeId: "store:b",
          vendorName: "Banca B",
          merchandiseSubtotal: 20,
          promotionDiscount: 0,
          netMerchandise: 20,
        },
      ],
      deliveryPricing: {
        baseFee: 7.5,
        extraStopFee: 2.5,
        originalVendorCount: 2,
        currentVendorCount: 2,
      },
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

  it("keeps multi-vendor pickup open until every vendor confirms handoff", () => {
    seedOrder("pickup");

    patchVendorStatus("FE-MULTI", "vendor:a", "ready");
    patchVendorStatus("FE-MULTI", "vendor:b", "ready");
    expect(readUnifiedOrders()[0].status).toBe("ready_for_pickup");

    patchVendorStatus("FE-MULTI", "vendor:a", "delivered");
    expect(readUnifiedOrders()[0].status).toBe("ready_for_pickup");

    patchVendorStatus("FE-MULTI", "vendor:b", "delivered");
    expect(readUnifiedOrders()[0].status).toBe("delivered");
  });

  it("keeps delivery in collection until every vendor stop is confirmed", () => {
    seedOrder();
    patchVendorStatus("FE-MULTI", "vendor:a", "ready");
    patchVendorStatus("FE-MULTI", "vendor:b", "ready");
    patchUnifiedOrder("FE-MULTI", { status: "driver_assigned" });

    patchVendorStatus("FE-MULTI", "vendor:a", "collected");
    let order = readUnifiedOrders()[0];
    expect(order.status).toBe("driver_assigned");
    expect(order.vendors?.find((vendor) => vendor.vendorId === "vendor:a")?.status).toBe("collected");
    expect(order.vendors?.find((vendor) => vendor.vendorId === "vendor:b")?.status).toBe("ready");

    patchVendorStatus("FE-MULTI", "vendor:b", "collected");
    order = readUnifiedOrders()[0];
    expect(order.status).toBe("driver_assigned");

    patchUnifiedOrder("FE-MULTI", { status: "collected" });
    expect(readUnifiedOrders()[0].status).toBe("collected");
  });

  it("derives ordered pickup stops for a multi-vendor route", () => {
    seedOrder();
    patchUnifiedOrder("FE-MULTI", {
      route: {
        toVendorKm: 2,
        vendorToCustomerKm: 5,
        totalKm: 7,
        etaMinutes: 25,
        source: "osrm",
      },
    });

    expect(readUnifiedOrders()[0].route?.pickupStops).toEqual([
      { vendorId: "vendor:a", storeId: "store:a", vendorName: "Banca A" },
      { vendorId: "vendor:b", storeId: "store:b", vendorName: "Banca B" },
    ]);
  });

  it("keeps the remaining bank active and recalculates refund and freight after one bank cancels", () => {
    seedOrder();
    patchUnifiedOrder("FE-MULTI", {
      route: {
        toVendorKm: 2,
        vendorToCustomerKm: 5,
        totalKm: 7,
        etaMinutes: 25,
        source: "osrm",
        pickupStops: [
          { vendorId: "vendor:a", storeId: "store:a", vendorName: "Banca A" },
          { vendorId: "vendor:b", storeId: "store:b", vendorName: "Banca B" },
        ],
      },
    });

    const result = cancelVendorParticipation("FE-MULTI", "vendor:b", "Sem estoque");
    const order = readUnifiedOrders()[0];

    expect(result?.orderCancelled).toBe(false);
    expect(order.status).toBe("received");
    expect(order.vendors?.find((vendor) => vendor.vendorId === "vendor:b")?.status).toBe("rejected");
    expect(order.items.find((item) => item.vendorId === "vendor:b")?.cancelled).toBe(true);
    expect(order.calculatedDeliveryFee).toBe(7.5);
    expect(order.customerDeliveryFee).toBe(7.5);
    expect(order.subtotal).toBe(30);
    expect(order.total).toBe(37.5);
    expect(order.refunds?.[0].amount).toBe(22.5);
    expect(order.refunds?.[0].status).toBe("pending_choice");
    expect(order.route?.pickupStops?.map((stop) => stop.vendorName)).toEqual(["Banca A"]);

    resolveRefundDestination("FE-MULTI", order.refunds![0].id, "wallet");
    const resolved = readUnifiedOrders()[0];
    expect(resolved.refunds?.[0].destination).toBe("wallet");
    expect(resolved.refunds?.[0].status).toBe("credited");
    expect(resolved.paymentStatus).toBe("partially_refunded");
  });

  it("moves to collected when the cancelled bank was the last uncollected stop", () => {
    seedOrder();
    patchVendorStatus("FE-MULTI", "vendor:a", "ready");
    patchVendorStatus("FE-MULTI", "vendor:b", "ready");
    patchUnifiedOrder("FE-MULTI", { status: "driver_assigned" });
    patchVendorStatus("FE-MULTI", "vendor:a", "collected");

    cancelVendorParticipation("FE-MULTI", "vendor:b", "Não consegue atender");

    const order = readUnifiedOrders()[0];
    expect(order.status).toBe("collected");
    expect(order.vendors?.find((vendor) => vendor.vendorId === "vendor:a")?.status).toBe("collected");
    expect(order.vendors?.find((vendor) => vendor.vendorId === "vendor:b")?.status).toBe("rejected");
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
