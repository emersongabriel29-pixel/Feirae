import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { UnifiedOrderRecord } from "../domain/orderBridge";
import { OrderRouteMap } from "./OrderRouteMap";

function order(overrides: Partial<UnifiedOrderRecord> = {}): UnifiedOrderRecord {
  return {
    id: "FE-MAP-1",
    createdAt: "2026-09-28T08:00:00-03:00",
    updatedAt: "2026-09-28T08:10:00-03:00",
    fairName: "Feira do Produtor Rural",
    customerName: "Cliente",
    customerCity: "Planaltina",
    customerAddress: "Quadra 1, Planaltina - DF",
    fulfillment: "delivery",
    paymentMethod: "Pix",
    subtotal: 40,
    calculatedDeliveryFee: 10,
    deliverySubsidy: 0,
    customerDeliveryFee: 10,
    total: 50,
    items: [],
    vendors: [],
    status: "out_for_delivery",
    driver: {
      name: "Rafael",
      vehicle: "Moto",
      location: {
        lat: -15.62,
        lng: -47.66,
        accuracyMeters: 12,
        updatedAt: new Date().toISOString(),
      },
    },
    route: {
      toVendorKm: 2,
      vendorToCustomerKm: 5,
      totalKm: 7,
      etaMinutes: 25,
      source: "local_fixture",
      pickupStops: [
        {
          vendorId: "vendor:a",
          storeId: "store:a",
          vendorName: "Sítio da Vó",
        },
      ],
    },
    events: [],
    ...overrides,
  };
}

describe("OrderRouteMap", () => {
  it("mostra feira, casa do cliente e entregador no mapa personalizado", () => {
    render(<OrderRouteMap order={order()} audience="customer" />);

    expect(screen.getByLabelText(/mapa feiraê de acompanhamento/i)).toBeInTheDocument();
    expect(screen.getAllByText(/casa do cliente/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Feira do Produtor Rural")).toBeInTheDocument();
    expect(screen.getByLabelText(/posição do entregador por gps/i)).toBeInTheDocument();
    expect(screen.getByText(/gps do entregador atualizado/i)).toBeInTheDocument();
  });

  it("não desenha posição falsa quando o entregador ainda não compartilhou GPS", () => {
    render(
      <OrderRouteMap
        order={order({
          driver: { name: "Rafael", vehicle: "Moto" },
          status: "driver_assigned",
        })}
        audience="vendor"
      />,
    );

    expect(screen.queryByLabelText(/posição estimada do entregador/i)).not.toBeInTheDocument();
    expect(screen.getByText(/gps ainda não compartilhado pelo entregador/i)).toBeInTheDocument();
  });

  it("troca a casa por retirada na feira em pedidos de retirada", () => {
    render(
      <OrderRouteMap
        order={order({ fulfillment: "pickup", driver: undefined, status: "ready_for_pickup" })}
        audience="customer"
      />,
    );

    expect(screen.getByText(/retirada na feira/i)).toBeInTheDocument();
    expect(screen.queryByText(/^casa do cliente$/i)).not.toBeInTheDocument();
  });
});
