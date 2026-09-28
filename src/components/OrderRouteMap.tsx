import { Bike, Clock, House, MapPin, Navigation, Store } from "lucide-react";
import { fairs } from "../data";
import { fairMapCoordinate } from "../domain/fairMap";
import type { UnifiedOrderRecord } from "../domain/orderBridge";
import { distanceInKm } from "../utils";

type OrderRouteAudience = "customer" | "vendor" | "delivery";

function statusPosition(order: UnifiedOrderRecord) {
  if (order.status === "delivered") return 86;
  if (order.status === "out_for_delivery") return 68;
  if (order.status === "collected") return 48;
  if (order.status === "driver_assigned") return 23;
  return 14;
}

function projectedDriverPosition(order: UnifiedOrderRecord) {
  const live = order.driver?.location;
  if (!live) return statusPosition(order);
  if (!["collected", "out_for_delivery", "delivered"].includes(order.status)) return statusPosition(order);

  const fair = fairs.find((item) => item.name === order.fairName);
  const fairCoordinate = fair ? fairMapCoordinate(fair) : null;
  if (!fairCoordinate || typeof order.customerLat !== "number" || typeof order.customerLng !== "number") {
    return statusPosition(order);
  }

  const toDriver = distanceInKm(fairCoordinate.lat, fairCoordinate.lng, live.lat, live.lng);
  const toCustomer = distanceInKm(live.lat, live.lng, order.customerLat, order.customerLng);
  const total = toDriver + toCustomer;
  if (!Number.isFinite(total) || total <= 0) return statusPosition(order);

  return Math.min(84, Math.max(42, 38 + (toDriver / total) * 46));
}

function audienceCopy(audience: OrderRouteAudience) {
  if (audience === "delivery") {
    return {
      eyebrow: "Sua rota Feiraê",
      title: "Feira, bancas e casa do cliente",
    };
  }
  if (audience === "vendor") {
    return {
      eyebrow: "Acompanhamento logístico",
      title: "Da feira até a casa do cliente",
    };
  }
  return {
    eyebrow: "Seu pedido no mapa",
    title: "Da feira até você",
  };
}

function gpsFreshness(updatedAt: string) {
  const timestamp = Date.parse(updatedAt);
  if (!Number.isFinite(timestamp)) return "GPS do entregador atualizado";
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "GPS do entregador atualizado agora";
  if (minutes === 1) return "GPS do entregador atualizado há 1 min";
  return `GPS do entregador atualizado há ${minutes} min`;
}

export function OrderRouteMap({
  order,
  audience,
  highlightVendorName,
  onRoute,
}: {
  order: UnifiedOrderRecord;
  audience: OrderRouteAudience;
  highlightVendorName?: string;
  onRoute?: (destination: string) => void;
}) {
  const copy = audienceCopy(audience);
  const pickupStops = order.route?.pickupStops ?? [];
  const driverVisible =
    order.fulfillment === "delivery" &&
    Boolean(order.driver) &&
    !["received", "preparing", "ready_for_pickup", "cancelled"].includes(order.status);
  const driverLeft = projectedDriverPosition(order);
  const liveLocation = order.driver?.location;
  const destinationLabel =
    order.customerAddress ??
    order.customerCity ??
    (order.fulfillment === "pickup" ? order.fairName : "Cliente");
  const fairLabel = order.fairName;

  return (
    <section className="order-route-map" aria-label="Mapa Feiraê de acompanhamento do pedido">
      <div className="order-route-map__heading">
        <div>
          <span>{copy.eyebrow}</span>
          <h3>{copy.title}</h3>
        </div>
        {order.route && (
          <small>
            <Clock size={14} /> {order.route.etaMinutes} min · {order.route.totalKm.toLocaleString("pt-BR")}{" "}
            km
          </small>
        )}
      </div>

      <div className="order-route-map__canvas">
        <svg viewBox="0 0 1000 420" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="routeMapBg" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#f7fbed" />
              <stop offset="100%" stopColor="#e3f0e7" />
            </linearGradient>
            <linearGradient id="routeMapLine" x1="0" x2="1">
              <stop offset="0%" stopColor="#176b3a" />
              <stop offset="72%" stopColor="#47a14c" />
              <stop offset="100%" stopColor="#f0b83e" />
            </linearGradient>
          </defs>
          <rect width="1000" height="420" fill="url(#routeMapBg)" />
          <path
            className="order-route-map__road"
            d="M50 335 C190 260 240 300 340 220 C455 128 538 280 655 214 C760 154 842 175 950 92"
          />
          <path
            className="order-route-map__route"
            d="M95 318 C220 256 265 278 350 220 C470 138 555 270 655 210 C760 150 835 162 900 112"
            stroke="url(#routeMapLine)"
          />
          <path className="order-route-map__street" d="M110 116 C300 160 410 130 560 86" />
          <path className="order-route-map__street" d="M430 360 C570 300 710 312 890 270" />
        </svg>

        <div className="order-route-map__fair" style={{ left: "34%", top: "52%" }}>
          <span>
            <Store size={23} />
          </span>
          <b>Feira</b>
        </div>

        {pickupStops.slice(0, 5).map((stop, index) => {
          const left = 28 + index * 3.3;
          const top = 66 - (index % 2) * 10;
          const highlighted = Boolean(
            highlightVendorName &&
            stop.vendorName.toLocaleLowerCase("pt-BR") === highlightVendorName.toLocaleLowerCase("pt-BR"),
          );
          return (
            <div
              key={stop.storeId || `${stop.vendorName}-${index}`}
              className={highlighted ? "order-route-map__bank is-highlighted" : "order-route-map__bank"}
              style={{ left: `${left}%`, top: `${top}%` }}
              title={stop.vendorName}
            >
              <span>{index + 1}</span>
            </div>
          );
        })}

        {driverVisible && (
          <div
            className={liveLocation ? "order-route-map__driver is-live" : "order-route-map__driver"}
            style={{ left: `${driverLeft}%`, top: "43%" }}
            aria-label={
              liveLocation
                ? "Posição do entregador por GPS"
                : "Posição estimada do entregador pela etapa do pedido"
            }
          >
            <span>
              <Bike size={22} />
            </span>
            <b>{order.driver?.name ?? "Entregador"}</b>
          </div>
        )}

        {order.fulfillment === "delivery" ? (
          <div className="order-route-map__home" style={{ left: "89%", top: "22%" }}>
            <span>
              <House size={24} />
            </span>
            <b>Casa do cliente</b>
          </div>
        ) : (
          <div className="order-route-map__pickup" style={{ left: "88%", top: "23%" }}>
            <span>
              <MapPin size={23} />
            </span>
            <b>Retirada na feira</b>
          </div>
        )}
      </div>

      <div className="order-route-map__summary">
        <div>
          <Store size={16} />
          <span>
            <small>Origem</small>
            <b>{fairLabel}</b>
          </span>
        </div>
        <div>
          {order.fulfillment === "delivery" ? <House size={17} /> : <MapPin size={17} />}
          <span>
            <small>{order.fulfillment === "delivery" ? "Casa do cliente" : "Retirada"}</small>
            <b>{destinationLabel}</b>
          </span>
        </div>
        {driverVisible && (
          <div>
            <Bike size={17} />
            <span>
              <small>Entregador</small>
              <b>
                {liveLocation
                  ? gpsFreshness(liveLocation.updatedAt)
                  : "Posição representada pela etapa do pedido"}
              </b>
            </span>
          </div>
        )}
      </div>

      {driverVisible && !liveLocation && (
        <p className="order-route-map__accuracy">
          A moto mostra a etapa operacional do pedido. Ela só vira posição GPS quando o entregador compartilha
          localização durante a corrida.
        </p>
      )}
      {liveLocation && (
        <p className="order-route-map__accuracy">
          GPS compartilhado pelo entregador durante a corrida
          {typeof liveLocation.accuracyMeters === "number"
            ? ` · precisão aproximada de ${Math.round(liveLocation.accuracyMeters)} m`
            : ""}
          .
        </p>
      )}

      {audience === "delivery" && onRoute && order.fulfillment === "delivery" && (
        <div className="order-route-map__actions">
          <button type="button" onClick={() => onRoute(order.customerAddress ?? destinationLabel)}>
            <Navigation size={16} /> Abrir rota no Feiraê
          </button>
        </div>
      )}
    </section>
  );
}
