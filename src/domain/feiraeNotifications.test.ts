import { describe, expect, it } from "vitest";
import type { UnifiedOrderEvent, UnifiedOrderRecord } from "./orderBridge";
import { customerPromotionNotification, orderEventNotification } from "./feiraeNotifications";

const order: UnifiedOrderRecord = {
  id: "FE-9001",
  createdAt: "2026-09-26T18:00:00-03:00",
  updatedAt: "2026-09-26T18:00:00-03:00",
  customerKey: "cliente@feirae.test",
  fairName: "Feira do Produtor Rural",
  customerName: "Cliente Teste",
  customerCity: "Planaltina",
  customerAddress: "Planaltina, DF",
  fulfillment: "delivery",
  paymentMethod: "Pix",
  paymentStatus: "authorized",
  subtotal: 50,
  calculatedDeliveryFee: 10,
  deliverySubsidy: 0,
  customerDeliveryFee: 10,
  total: 60,
  items: [],
  vendors: [],
  status: "out_for_delivery",
  driver: {
    driverKey: "entregador@feirae.test",
    name: "Rafael",
    vehicle: "Moto",
    etaMinutes: 5,
  },
  events: [],
};

function event(key: string, label: string): UnifiedOrderEvent {
  return {
    key,
    label,
    at: "26/09/2026 18:30",
    actor: "system",
  };
}

describe("Feiraê role notification messages", () => {
  it("uses customer language for the main order journey", () => {
    expect(orderEventNotification("customer", order, event("received", "Pedido recebido"))?.title).toBe(
      "Pedido feito",
    );
    expect(orderEventNotification("customer", order, event("preparing", "Em separação"))?.title).toBe(
      "Pedido em preparação",
    );
    expect(
      orderEventNotification("customer", order, event("out-for-delivery", "A caminho do cliente"))?.title,
    ).toBe("Saiu para entrega");
    expect(orderEventNotification("customer", order, event("approaching", "Pedido chegando"))?.title).toBe(
      "Pedido chegando",
    );
    expect(orderEventNotification("customer", order, event("delivered", "Entregue"))?.title).toBe(
      "Pedido chegou",
    );
  });

  it("creates customer promotion alerts with Feiraê context", () => {
    const notification = customerPromotionNotification({
      storeId: "store-1",
      storeName: "Banca da Maria",
      fairName: "Feira Central",
      promotionId: "promo-1",
      promotionName: "10% em frutas",
      rule: "Hoje até 18h",
    });

    expect(notification.title).toBe("Promoção no Feiraê");
    expect(notification.body).toMatch(/Banca da Maria.*10% em frutas.*Hoje até 18h/i);
  });

  it("uses feirante language for order, payment and collection", () => {
    expect(orderEventNotification("feirante", order, event("received", "Pedido recebido"))?.title).toBe(
      "Novo pedido",
    );
    expect(
      orderEventNotification("feirante", order, event("payment-authorized", "Pagamento confirmado"))?.title,
    ).toBe("Pagamento confirmado");
    expect(orderEventNotification("feirante", order, event("collected", "Pedido coletado"))?.title).toBe(
      "Pedido coletado",
    );
  });

  it("uses delivery language for route and active delivery stages", () => {
    const routed = {
      ...order,
      route: { toVendorKm: 2, vendorToCustomerKm: 4, totalKm: 6, etaMinutes: 20, source: "osrm" as const },
    };
    expect(orderEventNotification("delivery", routed, event("route-updated", "Rota calculada"))?.title).toBe(
      "Rota atualizada",
    );
    expect(orderEventNotification("delivery", order, event("ready", "Pronto para coleta"))?.title).toBe(
      "Pedido pronto para coleta",
    );
    expect(orderEventNotification("delivery", order, event("delivered", "Entregue"))?.title).toBe(
      "Entrega concluída",
    );
  });

  it("ignores events that are not useful for the selected role", () => {
    expect(orderEventNotification("customer", order, event("route-updated", "Rota calculada"))).toBeNull();
  });
});
