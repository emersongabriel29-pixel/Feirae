import { useEffect, useMemo, useState } from "react";
import { Bike, Clock, House, MapPin, Navigation, Store } from "lucide-react";
import { fairs } from "../data";
import { fairMapCoordinate } from "../domain/fairMap";
import type { UnifiedOrderRecord } from "../domain/orderBridge";
import { drivingRoute, geocodeAddress, type GeoPoint, type RouteMetrics } from "../domain/routing";

type OrderRouteAudience = "customer" | "vendor" | "delivery";
type MapBounds = { north: number; south: number; west: number; east: number };

function audienceCopy(audience: OrderRouteAudience) {
  if (audience === "delivery") {
    return {
      eyebrow: "Sua rota Feiraê",
      title: "Feira, coleta e casa do cliente",
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

function mercatorY(lat: number) {
  const clamped = Math.max(-85, Math.min(85, lat));
  const radians = (clamped * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + radians / 2));
}

function mapBounds(points: GeoPoint[]): MapBounds | null {
  if (!points.length) return null;
  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  const north = Math.max(...lats);
  const south = Math.min(...lats);
  const east = Math.max(...lngs);
  const west = Math.min(...lngs);
  const latSpan = Math.max(0.006, north - south);
  const lngSpan = Math.max(0.008, east - west);
  return {
    north: Math.min(85, north + latSpan * 0.2),
    south: Math.max(-85, south - latSpan * 0.2),
    east: Math.min(180, east + lngSpan * 0.2),
    west: Math.max(-180, west - lngSpan * 0.2),
  };
}

function projectPoint(point: GeoPoint, bounds: MapBounds) {
  const x = ((point.lng - bounds.west) / Math.max(0.000001, bounds.east - bounds.west)) * 100;
  const northY = mercatorY(bounds.north);
  const southY = mercatorY(bounds.south);
  const pointY = mercatorY(point.lat);
  const y = ((northY - pointY) / Math.max(0.000001, northY - southY)) * 100;
  return {
    x: Math.min(100, Math.max(0, x)),
    y: Math.min(100, Math.max(0, y)),
  };
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
  const liveLocation = order.driver?.location;
  const driverVisible =
    order.fulfillment === "delivery" &&
    Boolean(order.driver) &&
    !["received", "preparing", "ready_for_pickup", "cancelled"].includes(order.status);
  const destinationLabel =
    order.customerAddress ??
    order.customerCity ??
    (order.fulfillment === "pickup" ? order.fairName : "Cliente");
  const fairLabel = order.fairName;
  const fairCoords = useMemo<GeoPoint | null>(() => {
    const fair = fairs.find((item) => item.name === order.fairName);
    const reference = fair ? fairMapCoordinate(fair) : null;
    return reference ? { lat: reference.lat, lng: reference.lng } : null;
  }, [order.fairName]);
  const explicitCustomerCoords = useMemo<GeoPoint | null>(
    () =>
      typeof order.customerLat === "number" && typeof order.customerLng === "number"
        ? { lat: order.customerLat, lng: order.customerLng }
        : null,
    [order.customerLat, order.customerLng],
  );
  const [geocodeResult, setGeocodeResult] = useState<{
    address: string;
    point: GeoPoint | null;
  }>({ address: "", point: null });
  const [routeResult, setRouteResult] = useState<{
    key: string;
    route: RouteMetrics | null;
  }>({ key: "", route: null });

  useEffect(() => {
    if (explicitCustomerCoords || order.fulfillment !== "delivery" || !order.customerAddress) return;
    let active = true;
    const address = order.customerAddress;
    void geocodeAddress(address).then((point) => {
      if (active) setGeocodeResult({ address, point });
    });
    return () => {
      active = false;
    };
  }, [explicitCustomerCoords, order.customerAddress, order.fulfillment]);

  const customerCoords =
    explicitCustomerCoords ??
    (order.customerAddress && geocodeResult.address === order.customerAddress ? geocodeResult.point : null);
  const routeOrigin = useMemo<GeoPoint | null>(
    () => (liveLocation ? { lat: liveLocation.lat, lng: liveLocation.lng } : fairCoords),
    [fairCoords, liveLocation],
  );
  const routeKey =
    order.fulfillment === "delivery" && routeOrigin && customerCoords
      ? `${routeOrigin.lat.toFixed(6)},${routeOrigin.lng.toFixed(6)}->${customerCoords.lat.toFixed(6)},${customerCoords.lng.toFixed(6)}`
      : "";

  useEffect(() => {
    if (!routeKey || !routeOrigin || !customerCoords) return;
    let active = true;
    void drivingRoute(routeOrigin, customerCoords).then((route) => {
      if (active) setRouteResult({ key: routeKey, route });
    });
    return () => {
      active = false;
    };
  }, [customerCoords, routeKey, routeOrigin]);

  const liveRoute = routeResult.key === routeKey ? routeResult.route : null;
  const routeLoading = Boolean(routeKey && routeResult.key !== routeKey);

  const routePoints = useMemo(
    () => [
      ...(fairCoords ? [fairCoords] : []),
      ...(liveLocation ? [{ lat: liveLocation.lat, lng: liveLocation.lng }] : []),
      ...(customerCoords ? [customerCoords] : []),
      ...(liveRoute?.geometry ?? []),
    ],
    [customerCoords, fairCoords, liveLocation, liveRoute],
  );
  const bounds = useMemo(() => mapBounds(routePoints), [routePoints]);
  const fairPosition = fairCoords && bounds ? projectPoint(fairCoords, bounds) : null;
  const driverPosition =
    liveLocation && bounds ? projectPoint({ lat: liveLocation.lat, lng: liveLocation.lng }, bounds) : null;
  const customerPosition = customerCoords && bounds ? projectPoint(customerCoords, bounds) : null;
  const routePolyline = useMemo(() => {
    if (!bounds || !liveRoute?.geometry.length) return "";
    return liveRoute.geometry
      .map((point) => {
        const projected = projectPoint(point, bounds);
        return `${(projected.x * 10).toFixed(1)},${(projected.y * 4.2).toFixed(1)}`;
      })
      .join(" ");
  }, [bounds, liveRoute]);
  const osmEmbedUrl = bounds
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
        `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`,
      )}&layer=mapnik`
    : "";
  const displayedKm = liveRoute?.distanceKm ?? order.route?.totalKm;
  const displayedMinutes = liveRoute?.durationMinutes ?? order.route?.etaMinutes;

  return (
    <section className="order-route-map" aria-label="Mapa Feiraê de acompanhamento do pedido">
      <div className="order-route-map__heading">
        <div>
          <span>{copy.eyebrow}</span>
          <h3>{copy.title}</h3>
        </div>
        {typeof displayedKm === "number" && typeof displayedMinutes === "number" && (
          <small>
            <Clock size={14} /> {displayedMinutes} min · {displayedKm.toLocaleString("pt-BR")} km
          </small>
        )}
      </div>

      <div className="order-route-map__canvas">
        {osmEmbedUrl ? (
          <iframe
            className="order-route-map__osm"
            title="Mapa OpenStreetMap do acompanhamento"
            src={osmEmbedUrl}
            loading="lazy"
            tabIndex={-1}
          />
        ) : (
          <div className="order-route-map__placeholder">Aguardando coordenadas reais da rota.</div>
        )}

        {bounds && routePolyline && (
          <svg viewBox="0 0 1000 420" preserveAspectRatio="none" aria-hidden="true">
            <polyline className="order-route-map__route-real" points={routePolyline} />
          </svg>
        )}

        {fairPosition && (
          <div
            className="order-route-map__fair"
            style={{ left: `${fairPosition.x}%`, top: `${fairPosition.y}%` }}
          >
            <span>
              <Store size={23} />
            </span>
            <b>Feira</b>
          </div>
        )}

        {driverVisible && driverPosition && (
          <div
            className="order-route-map__driver is-live"
            style={{ left: `${driverPosition.x}%`, top: `${driverPosition.y}%` }}
            aria-label="Posição do entregador por GPS"
          >
            <span>
              <Bike size={22} />
            </span>
            <b>{order.driver?.name ?? "Entregador"}</b>
          </div>
        )}

        {order.fulfillment === "delivery" && customerPosition && (
          <div
            className="order-route-map__home"
            style={{ left: `${customerPosition.x}%`, top: `${customerPosition.y}%` }}
          >
            <span>
              <House size={24} />
            </span>
            <b>Casa do cliente</b>
          </div>
        )}

        <small className="order-route-map__attribution">© OpenStreetMap contributors · rota OSRM</small>
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
            <small>{order.fulfillment === "delivery" ? "Casa do cliente" : "Retirada na feira"}</small>
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
                  : "GPS ainda não compartilhado pelo entregador"}
              </b>
            </span>
          </div>
        )}
      </div>

      {pickupStops.length > 0 && (
        <p className="order-route-map__accuracy">
          {pickupStops.length} banca(s) compõem a coleta dentro da feira
          {highlightVendorName ? ` · foco atual: ${highlightVendorName}` : ""}. O mapa público não inventa
          posições de box sem coordenadas internas cadastradas.
        </p>
      )}
      {routeLoading && <p className="order-route-map__accuracy">Atualizando percurso real...</p>}
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
