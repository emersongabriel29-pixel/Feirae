import type { Role } from "../types";
import type { UnifiedOrderEvent, UnifiedOrderRecord } from "./orderBridge";

export type FeiraeNotificationPermission = NotificationPermission | "unsupported";

export type FeiraeNotificationMessage = {
  title: string;
  body: string;
  tag: string;
  url?: string;
};

function orderBody(order: UnifiedOrderRecord, suffix: string) {
  return `${order.id} · ${suffix}`;
}

function customerOrderNotification(
  order: UnifiedOrderRecord,
  event: UnifiedOrderEvent,
): FeiraeNotificationMessage | null {
  const driver = order.driver?.name ? ` · ${order.driver.name}` : "";
  if (event.key === "received") {
    return {
      title: "Pedido feito",
      body: orderBody(order, `recebido pela ${order.fairName}`),
      tag: `feirae-customer-${order.id}-received`,
      url: "/#/cliente/pedidos",
    };
  }
  if (event.key === "payment-authorized") {
    return {
      title: "Pagamento confirmado",
      body: orderBody(order, "pagamento aprovado"),
      tag: `feirae-customer-${order.id}-payment`,
      url: "/#/cliente/pedidos",
    };
  }
  if (event.key === "payment-on-delivery") {
    return {
      title: "Pagamento na entrega",
      body: orderBody(order, "pague ao receber conforme a forma escolhida"),
      tag: `feirae-customer-${order.id}-payment-delivery`,
      url: "/#/cliente/pedidos",
    };
  }
  if (["vendor-confirmed", "preparing"].includes(event.key)) {
    return {
      title: "Pedido em preparação",
      body: orderBody(order, "a banca está separando seus itens"),
      tag: `feirae-customer-${order.id}-preparing`,
      url: "/#/cliente/pedidos",
    };
  }
  if (event.key === "ready") {
    return {
      title: order.fulfillment === "pickup" ? "Pronto para retirada" : "Pedido pronto",
      body: orderBody(
        order,
        order.fulfillment === "pickup" ? "já pode ser retirado na feira" : "aguardando coleta do entregador",
      ),
      tag: `feirae-customer-${order.id}-ready`,
      url: "/#/cliente/pedidos",
    };
  }
  if (event.key === "driver-assigned") {
    return {
      title: "Entregador a caminho da banca",
      body: orderBody(order, `coleta sendo organizada${driver}`),
      tag: `feirae-customer-${order.id}-driver`,
      url: "/#/cliente/pedidos",
    };
  }
  if (["collected", "out-for-delivery"].includes(event.key)) {
    return {
      title: "Saiu para entrega",
      body: orderBody(order, `seu pedido está a caminho${driver}`),
      tag: `feirae-customer-${order.id}-out-for-delivery`,
      url: "/#/cliente/pedidos",
    };
  }
  if (event.key === "approaching") {
    return {
      title: "Pedido chegando",
      body: orderBody(order, `o entregador está perto do endereço${driver}`),
      tag: `feirae-customer-${order.id}-approaching`,
      url: "/#/cliente/pedidos",
    };
  }
  if (event.key === "delivered") {
    return {
      title: "Pedido chegou",
      body: orderBody(order, "entrega concluída"),
      tag: `feirae-customer-${order.id}-delivered`,
      url: "/#/cliente/pedidos",
    };
  }
  if (event.key === "vendor-cancelled-partial") {
    return {
      title: "Uma banca saiu do pedido",
      body: orderBody(order, `${event.label}. O restante da compra continua; confira o reembolso.`),
      tag: `feirae-customer-${order.id}-vendor-partial-cancel`,
      url: "/#/cliente/pedidos",
    };
  }
  if (event.key === "vendor-cancelled-order") {
    return {
      title: "Pedido encerrado",
      body: orderBody(order, event.reason || "a última banca ativa cancelou a participação"),
      tag: `feirae-customer-${order.id}-vendor-order-cancel`,
      url: "/#/cliente/pedidos",
    };
  }
  if (["cancelled", "vendor-rejected"].includes(event.key)) {
    return {
      title: "Pedido cancelado",
      body: orderBody(order, event.reason || "consulte os detalhes do pedido"),
      tag: `feirae-customer-${order.id}-cancelled`,
      url: "/#/cliente/pedidos",
    };
  }
  if (event.key.startsWith("substitution-")) {
    return {
      title: "Ação necessária",
      body: orderBody(order, event.label),
      tag: `feirae-customer-${order.id}-${event.key}`,
      url: "/#/cliente/pedidos",
    };
  }
  if (event.key === "pickup-complete") {
    return {
      title: "Retirada concluída",
      body: orderBody(order, "pedido retirado com sucesso"),
      tag: `feirae-customer-${order.id}-pickup-complete`,
      url: "/#/cliente/pedidos",
    };
  }
  return null;
}

function vendorOrderNotification(
  order: UnifiedOrderRecord,
  event: UnifiedOrderEvent,
): FeiraeNotificationMessage | null {
  if (event.key === "received") {
    return {
      title: "Novo pedido",
      body: orderBody(order, `${order.customerName} · ${order.fairName}`),
      tag: `feirae-vendor-${order.id}-received`,
    };
  }
  if (event.key === "payment-authorized") {
    return {
      title: "Pagamento confirmado",
      body: orderBody(order, "pagamento do cliente aprovado"),
      tag: `feirae-vendor-${order.id}-payment`,
    };
  }
  if (event.key === "payment-on-delivery") {
    return {
      title: "Pagamento na entrega",
      body: orderBody(order, "confira a forma de pagamento antes da saída"),
      tag: `feirae-vendor-${order.id}-payment-delivery`,
    };
  }
  if (event.key === "driver-assigned") {
    return {
      title: "Entregador a caminho",
      body: orderBody(order, `${order.driver?.name ?? "Entregador"} vai coletar o pedido`),
      tag: `feirae-vendor-${order.id}-driver`,
    };
  }
  if (event.key === "route-updated") {
    return {
      title: "Rota calculada",
      body: orderBody(order, "a coleta já possui rota e previsão"),
      tag: `feirae-vendor-${order.id}-route`,
    };
  }
  if (event.key === "collected") {
    return {
      title: "Pedido coletado",
      body: orderBody(order, "o entregador saiu da banca com o pedido"),
      tag: `feirae-vendor-${order.id}-collected`,
    };
  }
  if (event.key === "delivered") {
    return {
      title: "Pedido entregue",
      body: orderBody(order, "entrega concluída para o cliente"),
      tag: `feirae-vendor-${order.id}-delivered`,
    };
  }
  if (event.key === "driver-cancelled") {
    return {
      title: "Nova busca de entregador",
      body: orderBody(order, "a corrida voltou para a fila"),
      tag: `feirae-vendor-${order.id}-driver-cancelled`,
    };
  }
  if (["cancelled", "vendor-rejected"].includes(event.key)) {
    return {
      title: "Pedido cancelado",
      body: orderBody(order, event.reason || "consulte os detalhes do pedido"),
      tag: `feirae-vendor-${order.id}-cancelled`,
    };
  }
  return null;
}

function deliveryOrderNotification(
  order: UnifiedOrderRecord,
  event: UnifiedOrderEvent,
): FeiraeNotificationMessage | null {
  if (event.key === "ready") {
    return {
      title: "Pedido pronto para coleta",
      body: orderBody(order, `${order.fairName} liberou a retirada`),
      tag: `feirae-delivery-${order.id}-ready`,
    };
  }
  if (event.key === "route-updated") {
    return {
      title: "Rota atualizada",
      body: orderBody(
        order,
        order.route
          ? `${order.route.totalKm.toLocaleString("pt-BR")} km · ${order.route.etaMinutes} min`
          : "confira a rota da corrida",
      ),
      tag: `feirae-delivery-${order.id}-route`,
    };
  }
  if (event.key === "driver-assigned") {
    return {
      title: "Corrida aceita",
      body: orderBody(order, `primeiro destino: ${order.fairName}`),
      tag: `feirae-delivery-${order.id}-assigned`,
    };
  }
  if (event.key === "collected") {
    return {
      title: "Coleta confirmada",
      body: orderBody(order, "siga agora para o endereço do cliente"),
      tag: `feirae-delivery-${order.id}-collected`,
    };
  }
  if (event.key === "out-for-delivery") {
    return {
      title: "Rota para o cliente",
      body: orderBody(order, order.customerCity || "entrega iniciada"),
      tag: `feirae-delivery-${order.id}-out-for-delivery`,
    };
  }
  if (event.key === "approaching") {
    return {
      title: "Chegada sinalizada",
      body: orderBody(order, "cliente avisado de que você está chegando"),
      tag: `feirae-delivery-${order.id}-approaching`,
    };
  }
  if (event.key === "delivered") {
    return {
      title: "Entrega concluída",
      body: orderBody(order, "ganho liberado conforme as regras de repasse"),
      tag: `feirae-delivery-${order.id}-delivered`,
    };
  }
  if (event.key === "vendor-cancelled-partial") {
    return {
      title: "Rota atualizada",
      body: orderBody(order, `${event.label}. A coleta dessa banca foi removida da corrida.`),
      tag: `feirae-delivery-${order.id}-vendor-partial-cancel`,
    };
  }
  if (event.key === "vendor-cancelled-order") {
    return {
      title: "Corrida encerrada",
      body: orderBody(order, "não restaram bancas ativas neste pedido"),
      tag: `feirae-delivery-${order.id}-vendor-order-cancel`,
    };
  }
  if (["cancelled", "vendor-rejected"].includes(event.key)) {
    return {
      title: "Corrida cancelada",
      body: orderBody(order, event.reason || "a entrega não seguirá"),
      tag: `feirae-delivery-${order.id}-cancelled`,
    };
  }
  if (event.key === "urgent-support") {
    return {
      title: "Suporte prioritário",
      body: orderBody(order, event.label),
      tag: `feirae-delivery-${order.id}-support`,
    };
  }
  return null;
}

export function orderEventNotification(
  role: Role,
  order: UnifiedOrderRecord,
  event: UnifiedOrderEvent,
): FeiraeNotificationMessage | null {
  if (role === "customer") return customerOrderNotification(order, event);
  if (role === "feirante") return vendorOrderNotification(order, event);
  return deliveryOrderNotification(order, event);
}

export function customerPromotionNotification(input: {
  storeId: string;
  storeName: string;
  fairName: string;
  promotionId: string;
  promotionName: string;
  rule?: string;
}): FeiraeNotificationMessage {
  return {
    title: "Promoção no Feiraê",
    body: `${input.storeName} · ${input.promotionName}${input.rule ? ` · ${input.rule}` : ""}`,
    tag: `feirae-customer-offer-${input.storeId}-${input.promotionId}`,
    url: "/#/cliente/inicio",
  };
}

export function feiraeNotificationPermission(): FeiraeNotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function requestFeiraeNotificationPermission(): Promise<FeiraeNotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.requestPermission();
}

export async function showFeiraeNotification({ title, body, tag, url = "/" }: FeiraeNotificationMessage) {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission !== "granted") return false;

  const notificationTitle = `Feiraê • ${title}`;
  const options: NotificationOptions = {
    body,
    icon: "/feirae-mark.svg",
    badge: "/feirae-mark.svg",
    tag,
    data: { url },
  };

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(notificationTitle, options);
      return true;
    }

    const notification = new Notification(notificationTitle, options);
    notification.onclick = () => {
      window.focus();
      window.location.assign(url);
      notification.close();
    };
    return true;
  } catch {
    return false;
  }
}
