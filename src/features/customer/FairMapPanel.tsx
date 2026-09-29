import { useState } from "react";
import { Crosshair, LocateFixed, MapPin, Navigation, Sparkles, Store } from "lucide-react";
import { fairMapPoints, nearestFairPoint, projectDfCoordinate } from "../../domain/fairMap";
import type { Fair } from "../../types";

const DF_OSM_EMBED_URL =
  "https://www.openstreetmap.org/export/embed.html?bbox=-48.3%2C-16.1%2C-47.3%2C-15.45&layer=mapnik";

export function FairMapPanel({
  fairItems,
  userCoords,
  onRequestLocation,
  onFair,
  onRoute,
}: {
  fairItems: Fair[];
  userCoords: { lat: number; lng: number } | null;
  onRequestLocation: () => void;
  onFair: (name: string) => void;
  onRoute: (destination: number | string, lng?: number) => void;
}) {
  const points = fairMapPoints(fairItems);
  const nearest = nearestFairPoint(fairItems, userCoords);
  const [selectedFairName, setSelectedFairName] = useState<string | null>(null);
  const selectedPoint =
    points.find((point) => point.fair.name === selectedFairName) ?? nearest ?? points[0] ?? null;
  const userPoint = userCoords ? projectDfCoordinate(userCoords) : null;

  return (
    <section className="fair-map-panel" aria-labelledby="fair-map-title">
      <div className="fair-map-panel__glow" aria-hidden="true" />
      <div className="fair-map-panel__intro">
        <span className="fair-map-panel__mark" aria-hidden="true">
          <img src="/brand/09_versao_selo.webp" alt="" />
        </span>
        <div>
          <span className="fair-map-panel__eyebrow">
            <Sparkles size={14} /> Mapa Feiraê
          </span>
          <h2 id="fair-map-title">Feiras perto de você</h2>
          <p>Mapa real do Distrito Federal. Toque em um ponto para ver a feira e traçar a rota.</p>
        </div>
      </div>

      <div className="fair-map-panel__actions">
        {!userCoords ? (
          <button type="button" className="fair-map-panel__primary" onClick={onRequestLocation}>
            <LocateFixed size={18} /> Usar minha localização
          </button>
        ) : nearest ? (
          <button
            type="button"
            className="fair-map-panel__primary"
            onClick={() => setSelectedFairName(nearest.fair.name)}
          >
            <Crosshair size={18} />
            Mais próxima: {nearest.fair.place} · {nearest.coordinate.precision === "exact" ? "" : "~"}
            {nearest.distanceKm.toFixed(1)} km
          </button>
        ) : null}
      </div>

      <div className="native-fair-map" aria-label="Mapa das feiras do Distrito Federal">
        <div className="native-fair-map__canvas">
          <iframe
            className="native-fair-map__background native-fair-map__osm"
            title="Mapa OpenStreetMap das feiras do Distrito Federal"
            src={DF_OSM_EMBED_URL}
            loading="lazy"
            tabIndex={-1}
          />

          {userPoint && (
            <span
              className="native-fair-map__user"
              style={{ left: `${userPoint.x}%`, top: `${userPoint.y}%` }}
              aria-label="Sua localização aproximada no mapa"
            >
              <span />
            </span>
          )}

          {points.map((point) => {
            const selected = selectedPoint?.fair.name === point.fair.name;
            const isNearest = nearest?.fair.name === point.fair.name;
            return (
              <button
                key={point.fair.name}
                type="button"
                className={[
                  "native-fair-map__pin",
                  selected ? "is-selected" : "",
                  isNearest ? "is-nearest" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
                onClick={() => setSelectedFairName(point.fair.name)}
                aria-label={`Selecionar ${point.fair.name}`}
                aria-pressed={selected}
                title={point.fair.name}
              >
                <Store size={selected ? 23 : 19} strokeWidth={2.2} />
              </button>
            );
          })}

          <div className="native-fair-map__legend" aria-hidden="true">
            <span>
              <i className="native-fair-map__legend-pin" /> Feira
            </span>
            {userCoords && (
              <span>
                <i className="native-fair-map__legend-user" /> Você
              </span>
            )}
          </div>
        </div>

        {selectedPoint ? (
          <article className="native-fair-map__selection">
            <div className="native-fair-map__selection-icon" aria-hidden="true">
              <Store size={22} />
            </div>
            <div className="native-fair-map__selection-copy">
              <small>
                {selectedPoint.coordinate.precision === "exact"
                  ? "Localização cadastrada"
                  : "Referência aproximada da região"}
              </small>
              <strong>{selectedPoint.fair.name}</strong>
              <p>
                <MapPin size={14} /> {selectedPoint.fair.place}
                {nearest?.fair.name === selectedPoint.fair.name
                  ? ` · ${selectedPoint.coordinate.precision === "exact" ? "" : "~"}${nearest.distanceKm.toFixed(
                      1,
                    )} km de você`
                  : ""}
              </p>
              {selectedPoint.fair.address && <p>{selectedPoint.fair.address}</p>}
            </div>
            <div className="native-fair-map__selection-actions">
              <button type="button" onClick={() => onFair(selectedPoint.fair.name)}>
                <Store size={16} /> Abrir feira
              </button>
              <button
                type="button"
                onClick={() =>
                  onRoute(
                    selectedPoint.fair.address ??
                      `${selectedPoint.fair.name}, ${selectedPoint.fair.place}, Distrito Federal`,
                  )
                }
              >
                <Navigation size={16} /> Rota no Feiraê
              </button>
            </div>
          </article>
        ) : (
          <p className="native-fair-map__empty">Nenhuma feira desta região possui referência cartográfica.</p>
        )}
      </div>

      <p className="fair-map-panel__notice">
        © OpenStreetMap contributors. Pontos sem coordenada própria usam a região como referência até a feira
        ter sua localização exata cadastrada.
      </p>
    </section>
  );
}
