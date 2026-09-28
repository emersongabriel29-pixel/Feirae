import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, MapPin, Sparkles } from "lucide-react";

export const FEIRAE_DF_MAP_EMBED_URL =
  "https://www.google.com/maps/d/embed?mid=1DIWDxyR1EKjC-0VEI2PSj-AjSqP9GElB&ehbc=2E312F";
export const FEIRAE_DF_MAP_VIEW_URL =
  "https://www.google.com/maps/d/viewer?mid=1DIWDxyR1EKjC-0VEI2PSj-AjSqP9GElB";

export function FairMapPanel() {
  const [mapOpen, setMapOpen] = useState(false);

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
          <h2 id="fair-map-title">Veja as feiras do DF no mapa</h2>
          <p>
            Explore a localização das feiras e depois abra cada feira para ver bancas, produtos e opções de
            entrega.
          </p>
        </div>
      </div>

      <div className="fair-map-panel__actions">
        <button
          type="button"
          className="fair-map-panel__primary"
          onClick={() => setMapOpen((current) => !current)}
          aria-expanded={mapOpen}
          aria-controls="feirae-df-map"
        >
          <MapPin size={18} />
          {mapOpen ? "Ocultar mapa" : "Abrir mapa interativo"}
          {mapOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
        </button>

        <a
          className="fair-map-panel__secondary"
          href={FEIRAE_DF_MAP_VIEW_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir mapa completo <ExternalLink size={16} />
        </a>
      </div>

      {mapOpen && (
        <div id="feirae-df-map" className="fair-map-panel__map">
          <iframe
            title="Mapa das feiras do Distrito Federal"
            src={FEIRAE_DF_MAP_EMBED_URL}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
          <p>
            Conteúdo externo do Google My Maps. O Feiraê não repassa as coordenadas do seu GPS para este mapa.
          </p>
        </div>
      )}
    </section>
  );
}
