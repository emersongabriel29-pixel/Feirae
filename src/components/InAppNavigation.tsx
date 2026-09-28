import { useMemo, useState } from "react";
import { Crosshair, ExternalLink, House, MapPin, Navigation, Route, Store, X } from "lucide-react";

type Coords = { lat: number; lng: number };

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
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
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
  const [origin, setOrigin] = useState<Coords | null>(initialCoords ?? null);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const targetCoords = useMemo(() => parseCoordinateTarget(destination), [destination]);
  const distance = origin && targetCoords ? distanceKm(origin, targetCoords) : null;

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
        setLocationMessage("Sua posição foi atualizada no mapa do Feiraê.");
      },
      () => {
        setLocating(false);
        setLocationMessage("Não foi possível atualizar sua posição.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  function openGoogleMaps() {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`,
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
      <section
        className="in-app-route"
        role="dialog"
        aria-modal="true"
        aria-labelledby="in-app-route-title"
      >
        <header className="in-app-route__header">
          <div>
            <span className="eyebrow">MAPA FEIRAÊ</span>
            <h2 id="in-app-route-title">Sua rota sem sair do app</h2>
            <p>
              O Feiraê é o mapa principal. Google Maps e Waze ficam disponíveis como opções externas.
            </p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar mapa">
            <X size={20} />
          </button>
        </header>

        <div className="in-app-route__map" aria-label="Mapa de rota dentro do Feiraê">
          <svg viewBox="0 0 1000 520" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="inAppRouteLand" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f7f6e9" />
                <stop offset="100%" stopColor="#e1f2e5" />
              </linearGradient>
              <linearGradient id="inAppRouteLine" x1="0" x2="1">
                <stop offset="0%" stopColor="#0B5E3A" />
                <stop offset="70%" stopColor="#22C55E" />
                <stop offset="100%" stopColor="#FF8A00" />
              </linearGradient>
            </defs>
            <rect width="1000" height="520" fill="url(#inAppRouteLand)" />
            <path
              d="M50 110 C210 170 330 118 460 180 C590 242 725 186 950 250"
              className="in-app-route__street"
            />
            <path
              d="M80 420 C230 330 350 380 505 292 C642 215 772 300 935 155"
              className="in-app-route__street"
            />
            <path
              d="M210 40 C280 160 240 280 330 495"
              className="in-app-route__street"
            />
            <path
              d="M105 405 C250 324 366 363 510 286 C665 204 770 284 892 170"
              className="in-app-route__path"
              stroke="url(#inAppRouteLine)"
            />
          </svg>

          <div className="in-app-route__origin">
            <span>
              <Crosshair size={21} />
            </span>
            <b>{origin ? "Você" : "Sua localização"}</b>
          </div>

          <div className="in-app-route__destination">
            <span>
              {destination.toLocaleLowerCase("pt-BR").includes("feira") ? (
                <Store size={21} />
              ) : (
                <House size={21} />
              )}
            </span>
            <b>Destino</b>
          </div>

          <div className="in-app-route__vehicle">
            <span>
              <Navigation size={19} />
            </span>
          </div>
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
              <small>Distância</small>
              <b>
                {distance !== null
                  ? `~${distance.toFixed(1)} km em linha reta`
                  : "Calculada durante a navegação"}
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
