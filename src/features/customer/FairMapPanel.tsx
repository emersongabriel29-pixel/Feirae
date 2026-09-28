import { useState } from "react";
import { Crosshair, ExternalLink, LocateFixed, MapPin, Navigation, Sparkles, Store } from "lucide-react";
import { fairMapPoints, nearestFairPoint, projectDfCoordinate } from "../../domain/fairMap";
import type { Fair } from "../../types";

export const FEIRAE_DF_MAP_VIEW_URL =
  "https://www.google.com/maps/d/viewer?mid=1DIWDxyR1EKjC-0VEI2PSj-AjSqP9GElB";

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
          <img src="/feirae-mark.svg" alt="" />
        </span>
        <div>
          <span className="fair-map-panel__eyebrow">
            <Sparkles size={14} /> Mapa Feiraê
          </span>
          <h2 id="fair-map-title">Feiras do DF dentro do próprio app</h2>
          <p>
            Toque em um ponto para escolher a feira. Depois abra a feira, veja as bancas e chegue aos produtos
            sem sair do Feiraê.
          </p>
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

        <a
          className="fair-map-panel__secondary"
          href={FEIRAE_DF_MAP_VIEW_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Mapa público de referência <ExternalLink size={16} />
        </a>
      </div>

      <div className="native-fair-map" aria-label="Mapa nativo das feiras do Distrito Federal">
        <div className="native-fair-map__canvas">
          <svg
            className="native-fair-map__background"
            viewBox="0 0 1000 650"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="feirae-map-land" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#edf6df" />
                <stop offset="100%" stopColor="#dfeee4" />
              </linearGradient>
            </defs>
            <path
              d="M80 90 C210 35 405 52 540 92 C710 142 845 118 930 205 C974 250 934 341 872 386 C808 432 824 526 710 566 C548 622 385 588 282 548 C160 500 74 452 58 344 C45 254 18 152 80 90Z"
              fill="url(#feirae-map-land)"
            />
            <path d="M116 430 C290 350 418 362 570 260 C704 170 805 184 908 122" />
            <path d="M116 202 C270 222 350 297 486 315 C628 334 721 274 870 314" />
            <path d="M302 92 C325 205 370 278 356 410 C347 490 392 542 470 586" />
            <path d="M651 104 C620 204 608 287 650 375 C680 440 665 505 625 570" />
          </svg>

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
                onClick={() => {
                  setSelectedFairName(point.fair.name);
                  onFair(point.fair.name);
                }}
                aria-label={`Selecionar ${point.fair.name}`}
                aria-pressed={selected}
                title={point.fair.name}
              >
                <MapPin size={selected ? 24 : 20} />
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
                  : "Posição aproximada pela região"}
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
        Os pontos sem coordenada própria usam a região como referência visual e de distância aproximada. Rotas
        continuam usando o endereço cadastrado da feira.
      </p>
    </section>
  );
}
