import { useEffect, useMemo, useState } from "react";
import { Crosshair, ExternalLink, House, MapPin, Route, Store, X } from "lucide-react";
import { drivingRoute, geocodeAddress, type GeoPoint, type RouteMetrics } from "../domain/routing";

type Coords = GeoPoint;

type MapBounds = {
  north: number;
  south: number;
  west: number;
  east: number;
};

function parseCoordinateTarget(destination: string): Coords | null {
  const match = destination.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function distanceKm(a: Coords, b: Coords) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const lat1 = a.lat * rad;
  const lat2 = b.lat * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function mapBounds(points: Coords[]): MapBounds | null {
  if (!points.length) return null;
  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  const north = Math.max(...lats);
  const south = Math.min(...lats);
  const east = Math.max(...lngs);
  const west = Math.min(...lngs);
  const latSpan = Math.max(0.006, north - south);
  const lngSpan = Math.max(0.008, east - west);
  const latPadding = latSpan * 0.2;
  const lngPadding = lngSpan * 0.2;
  return {
    north: Math.min(85, north + latPadding),
    south: Math.max(-85, south - latPadding),
    east: Math.min(180, east + lngPadding),
    west: Math.max(-180, west - lngPadding),
  };
}

function mercatorY(lat: number) {
  const clamped = Math.max(-85, Math.min(85, lat));
  const radians = (clamped * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + radians / 2));
}

function projectPoint(point: Coords, bounds: MapBounds) {
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

export function InAppNavigation({
  destination,
  onClose,
  initialCoords,
}: {
  destination: string;
  onClose: () => void;
  initialCoords?: Coords | null;
}) {
  const parsedTarget = useMemo(() => parseCoordinateTarget(destination), [destination]);
  const [origin, setOrigin] = useState<Coords | null>(initialCoords ?? null);
  const [geocodeResult, setGeocodeResult] = useState<{
    destination: string;
    point: Coords | null;
  }>({ destination: "", point: null });
  const [routeResult, setRouteResult] = useState<{
    key: string;
    route: RouteMetrics | null;
  }>({ key: "", route: null });
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");

  useEffect(() => {
    if (parsedTarget) return;
    let active = true;
    void geocodeAddress(destination).then((point) => {
      if (active) setGeocodeResult({ destination, point });
    });
    return () => {
      active = false;
    };
  }, [destination, parsedTarget]);

  const targetCoords =
    parsedTarget ?? (geocodeResult.destination === destination ? geocodeResult.point : null);
  const routeKey =
    origin && targetCoords
      ? `${origin.lat.toFixed(6)},${origin.lng.toFixed(6)}->${targetCoords.lat.toFixed(6)},${targetCoords.lng.toFixed(6)}`
      : "";

  useEffect(() => {
    if (!origin || !targetCoords || !routeKey) return;
    let active = true;
    void drivingRoute(origin, targetCoords).then((nextRoute) => {
      if (active) setRouteResult({ key: routeKey, route: nextRoute });
    });
    return () => {
      active = false;
    };
  }, [origin, routeKey, targetCoords]);

  const route = routeResult.key === routeKey ? routeResult.route : null;
  const geocoding = !parsedTarget && geocodeResult.destination !== destination;
  const routeLoading = Boolean(routeKey && routeResult.key !== routeKey);
  const routeFailed =
    (!parsedTarget && geocodeResult.destination === destination && geocodeResult.point === null) ||
    (routeResult.key === routeKey && routeKey !== "" && routeResult.route === null);

  const mapPoints = useMemo(() => {
    const points = route?.geometry?.length ? route.geometry : [];
    return [...(origin ? [origin] : []), ...(targetCoords ? [targetCoords] : []), ...points];
  }, [origin, route, targetCoords]);
  const bounds = useMemo(() => mapBounds(mapPoints), [mapPoints]);
  const routePolyline = useMemo(() => {
    if (!bounds || !route?.geometry?.length) return "";
    return route.geometry
      .map((point) => {
        const projected = projectPoint(point, bounds);
        return `${(projected.x * 10).toFixed(1)},${(projected.y * 5.2).toFixed(1)}`;
      })
      .join(" ");
  }, [bounds, route]);
  const originPosition = origin && bounds ? projectPoint(origin, bounds) : null;
  const destinationPosition = targetCoords && bounds ? projectPoint(targetCoords, bounds) : null;
  const straightDistance = origin && targetCoords ? distanceKm(origin, targetCoords) : null;
  const osmEmbedUrl = bounds
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
        `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`,
      )}&layer=mapnik`
    : "";

  function updateLocation() {
    if (!navigator.geolocation) {
      setLocationMessage("Localização do aparelho indisponível.");
      return;
    }
    setLocating(true);
    setLocationMessage("Atualizando sua posição...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setOrigin({ lat: coords.latitude, lng: coords.longitude });
        setLocating(false);
        setLocationMessage("Sua posição foi atualizada. Recalculando a rota real...");
      },
      () => {
        setLocating(false);
        setLocationMessage("Não foi possível atualizar sua posição.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  function openGoogleMaps() {
    const originQuery = origin ? `&origin=${origin.lat},${origin.lng}` : "";
    const destinationQuery = targetCoords ? `${targetCoords.lat},${targetCoords.lng}` : destination;
    window.open(
      `https://www.google.com/maps/dir/?api=1${originQuery}&destination=${encodeURIComponent(destinationQuery)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function openWaze() {
    const query = targetCoords ? `${targetCoords.lat},${targetCoords.lng}` : destination;
    window.open(
      `https://www.waze.com/ul?q=${encodeURIComponent(query)}&navigate=yes`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <div
      className="in-app-route-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="in-app-route" role="dialog" aria-modal="true" aria-labelledby="in-app-route-title">
        <header className="in-app-route__header">
          <div>
            <span className="eyebrow">MAPA FEIRAÊ</span>
            <h2 id="in-app-route-title">Rota real dentro do app</h2>
            <p>
              Mapa OpenStreetMap com percurso calculado pelo OSRM. Google Maps e Waze continuam como opções
              externas.
            </p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar mapa">
            <X size={20} />
          </button>
        </header>

        <div className="in-app-route__map" aria-label="Mapa real de rota dentro do Feiraê">
          {osmEmbedUrl ? (
            <iframe
              className="in-app-route__osm"
              title="Mapa OpenStreetMap da rota"
              src={osmEmbedUrl}
              loading="lazy"
            />
          ) : (
            <div className="in-app-route__map-placeholder">Localize-se para exibir o mapa da rota.</div>
          )}

          {bounds && routePolyline && (
            <svg viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
              <polyline className="in-app-route__path-real" points={routePolyline} />
            </svg>
          )}

          {originPosition && (
            <div
              className="in-app-route__origin"
              style={{ left: `${originPosition.x}%`, top: `${originPosition.y}%` }}
            >
              <span>
                <Crosshair size={21} />
              </span>
              <b>Você</b>
            </div>
          )}

          {destinationPosition && (
            <div
              className="in-app-route__destination"
              style={{ left: `${destinationPosition.x}%`, top: `${destinationPosition.y}%` }}
            >
              <span>
                {destination.toLocaleLowerCase("pt-BR").includes("feira") ? (
                  <Store size={21} />
                ) : (
                  <House size={21} />
                )}
              </span>
              <b>Destino</b>
            </div>
          )}

          <small className="in-app-route__attribution">© OpenStreetMap contributors · rota OSRM</small>
        </div>

        <div className="in-app-route__details">
          <div>
            <MapPin size={18} />
            <span>
              <small>Destino</small>
              <b>{destination}</b>
            </span>
          </div>
          <div>
            <Route size={18} />
            <span>
              <small>Rota</small>
              <b>
                {route
                  ? `${route.distanceKm.toLocaleString("pt-BR")} km · ~${route.durationMinutes} min`
                  : geocoding || routeLoading
                    ? "Calculando percurso real..."
                    : routeFailed
                      ? "Não foi possível calcular a rota agora"
                      : straightDistance !== null
                        ? `${straightDistance.toFixed(1)} km em linha reta · aguardando rota`
                        : "Use sua localização para calcular"}
              </b>
            </span>
          </div>
        </div>

        <button
          type="button"
          className="primary-action w-full in-app-route__locate"
          onClick={updateLocation}
          disabled={locating}
        >
          <Crosshair size={17} />{" "}
          {locating
            ? "Atualizando localização..."
            : origin
              ? "Atualizar minha localização"
              : "Usar minha localização"}
        </button>
        {locationMessage && <p className="in-app-route__message">{locationMessage}</p>}

        <div className="in-app-route__secondary">
          <span>Outras opções de navegação</span>
          <div>
            <button type="button" onClick={openGoogleMaps}>
              Google Maps <ExternalLink size={15} />
            </button>
            <button type="button" onClick={openWaze}>
              Waze <ExternalLink size={15} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
