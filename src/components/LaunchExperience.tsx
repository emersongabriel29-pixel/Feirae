import { type ReactNode, useEffect, useState } from "react";
import { isFeiraeSoundEnabled, playFeiraeSoundMark } from "../domain/feiraeSound";
import "./LaunchExperience.css";

export const FEIRAE_SPLASH_LAST_FULL_DAY_KEY = "feirae:splash:last-full-day";

type SplashVariant = "full" | "quick" | "reduced";

const durations: Record<SplashVariant, number> = {
  full: 3300,
  quick: 1550,
  reduced: 650,
};

const soundDelays: Partial<Record<SplashVariant, number>> = {
  full: 2620,
  quick: 900,
};

function localDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLaunchVariant(date = new Date()): SplashVariant {
  if (typeof window === "undefined") return "reduced";

  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    return "reduced";
  }

  try {
    return window.localStorage.getItem(FEIRAE_SPLASH_LAST_FULL_DAY_KEY) === localDayKey(date)
      ? "quick"
      : "full";
  } catch {
    return "quick";
  }
}

function SplashScreen({ variant }: { variant: SplashVariant }) {
  return (
    <section
      className="feirae-launch"
      data-variant={variant}
      role="status"
      aria-label="Feiraê carregando"
      aria-live="polite"
    >
      <div className="feirae-launch__aurora feirae-launch__aurora--one" aria-hidden="true" />
      <div className="feirae-launch__aurora feirae-launch__aurora--two" aria-hidden="true" />
      <div className="feirae-launch__grain" aria-hidden="true" />
      <div className="feirae-launch__leaf feirae-launch__leaf--one" aria-hidden="true" />
      <div className="feirae-launch__leaf feirae-launch__leaf--two" aria-hidden="true" />
      <div className="feirae-launch__leaf feirae-launch__leaf--three" aria-hidden="true" />

      <div className="feirae-launch__scene" aria-hidden="true">
        <div className="feirae-launch__halo" />
        <svg className="feirae-launch__art" viewBox="0 0 440 360">
          <defs>
            <linearGradient id="stallWood" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#d99a55" />
              <stop offset="1" stopColor="#9d5f2f" />
            </linearGradient>
            <linearGradient id="stallCream" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff9e9" />
              <stop offset="1" stopColor="#f1dfb8" />
            </linearGradient>
            <linearGradient id="crateWood" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#a96834" />
              <stop offset="1" stopColor="#75411f" />
            </linearGradient>
            <linearGradient id="motoGreen" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#37b96b" />
              <stop offset="1" stopColor="#0f6c3b" />
            </linearGradient>
            <filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="14" stdDeviation="13" floodColor="#06391f" floodOpacity="0.22" />
            </filter>
          </defs>

          <ellipse className="feirae-launch__ground" cx="218" cy="302" rx="148" ry="24" />

          <path
            className="feirae-launch__route"
            d="M22 308 C95 275 138 329 208 304 C274 281 302 319 410 269"
            fill="none"
          />
          <path
            className="feirae-launch__route-glow"
            d="M22 308 C95 275 138 329 208 304 C274 281 302 319 410 269"
            fill="none"
          />

          <g className="feirae-launch__stall" filter="url(#softShadow)">
            <g className="feirae-launch__stall-fill">
              <rect x="106" y="145" width="214" height="136" rx="18" fill="url(#stallCream)" />
              <rect x="119" y="182" width="188" height="99" rx="12" fill="url(#stallWood)" />
              <rect x="126" y="193" width="174" height="18" rx="9" fill="#75411f" opacity="0.38" />

              <path d="M89 135h247l-23-70H113z" fill="#fffaf0" />
              <path d="M113 65h42l-13 70H89z" fill="#17804a" />
              <path d="M155 65h40l-7 70h-46z" fill="#ffffff" />
              <path d="M195 65h40l3 70h-50z" fill="#2ea765" />
              <path d="M235 65h40l9 70h-46z" fill="#ffffff" />
              <path d="M275 65h38l23 70h-52z" fill="#17804a" />

              <path className="feirae-launch__awning-shadow" d="M90 135c11 17 41 18 52 0 12 18 35 18 46 0 13 18 37 18 50 0 13 18 36 18 46 0 13 18 40 17 51 0z" fill="#0d6538" opacity="0.18" />

              <rect x="135" y="218" width="69" height="50" rx="7" fill="url(#crateWood)" />
              <rect x="217" y="218" width="69" height="50" rx="7" fill="url(#crateWood)" />
              <path d="M142 231h55M142 246h55M224 231h55M224 246h55" stroke="#dca66a" strokeWidth="4" opacity="0.52" />

              <g className="feirae-launch__crate-produce feirae-launch__crate-produce--left">
                <circle cx="151" cy="222" r="10" fill="#ef5147" />
                <circle cx="171" cy="220" r="11" fill="#f36c43" />
                <circle cx="191" cy="224" r="9" fill="#ed3f36" />
                <path d="M143 218c9-12 17-14 25-8M164 216c8-12 18-14 29-7" stroke="#4b9b55" strokeWidth="5" strokeLinecap="round" />
              </g>

              <g className="feirae-launch__crate-produce feirae-launch__crate-produce--right">
                <ellipse cx="231" cy="221" rx="10" ry="8" fill="#f6c548" />
                <ellipse cx="251" cy="218" rx="11" ry="9" fill="#f39b43" />
                <ellipse cx="273" cy="223" rx="10" ry="9" fill="#f3d15e" />
                <path d="M226 214c7-9 13-12 20-9M247 210c8-9 15-10 23-6" stroke="#4c9f58" strokeWidth="5" strokeLinecap="round" />
              </g>

              <g className="feirae-launch__greens">
                <path d="M130 258c5-25 16-38 31-38 7 20 2 37-17 51z" fill="#4fa95e" />
                <path d="M152 260c8-24 20-34 34-31 3 19-4 34-25 45z" fill="#75c86c" />
                <path d="M268 261c3-26 13-40 29-42 9 19 5 38-14 54z" fill="#3e9752" />
              </g>
            </g>

            <g className="feirae-launch__stall-outline">
              <path d="M89 135h247L313 65H113z" />
              <path d="M106 145v136h214V145" />
              <path d="M119 182h188" />
              <path d="M135 218h69v50h-69z" />
              <path d="M217 218h69v50h-69z" />
              <path d="M113 65l-24 70M155 65l-13 70M195 65l-7 70M235 65l3 70M275 65l9 70M313 65l23 70" />
            </g>
          </g>

          <g className="feirae-launch__floating-produce feirae-launch__floating-produce--tomato">
            <circle cx="74" cy="142" r="17" fill="#ef5147" />
            <path d="M74 122l4 8 10-2-8 7 3 9-9-5-10 5 4-10-7-7 10 2z" fill="#2d8b51" />
          </g>
          <g className="feirae-launch__floating-produce feirae-launch__floating-produce--carrot">
            <path d="M361 108c20 15 18 40-7 62-9-29-6-51 7-62z" fill="#f39a43" />
            <path d="M357 108c-2-15 4-25 17-30M360 110c11-12 21-14 31-8" stroke="#4ca65a" strokeWidth="8" strokeLinecap="round" />
          </g>
          <g className="feirae-launch__floating-produce feirae-launch__floating-produce--leaf">
            <path d="M69 209c27-18 51-14 71 12-31 12-55 8-71-12z" fill="#8bcf72" />
            <path d="M78 208c21 2 38 7 51 15" stroke="#2e7f4b" strokeWidth="4" strokeLinecap="round" />
          </g>
          <g className="feirae-launch__spark feirae-launch__spark--one"><circle cx="95" cy="94" r="4" fill="#dff36b" /></g>
          <g className="feirae-launch__spark feirae-launch__spark--two"><circle cx="338" cy="188" r="5" fill="#fff4b1" /></g>
          <g className="feirae-launch__spark feirae-launch__spark--three"><circle cx="72" cy="255" r="3" fill="#ffffff" /></g>

          <g className="feirae-launch__moto" filter="url(#softShadow)">
            <g className="feirae-launch__wheel feirae-launch__wheel--back">
              <circle cx="103" cy="303" r="25" fill="#173d2b" />
              <circle cx="103" cy="303" r="15" fill="#d7e5d9" />
              <path d="M103 288v30M88 303h30M92 292l22 22M114 292l-22 22" stroke="#71887b" strokeWidth="2" />
            </g>
            <g className="feirae-launch__wheel feirae-launch__wheel--front">
              <circle cx="186" cy="303" r="25" fill="#173d2b" />
              <circle cx="186" cy="303" r="15" fill="#d7e5d9" />
              <path d="M186 288v30M171 303h30M175 292l22 22M197 292l-22 22" stroke="#71887b" strokeWidth="2" />
            </g>

            <path d="M105 299l32-41h32l17 41h-53l-21-48h36" fill="none" stroke="url(#motoGreen)" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M128 261h45l-8-31h-43z" fill="#106b3b" />
            <path d="M168 256h28l15 19h-34z" fill="#2dad63" />
            <rect x="173" y="218" width="50" height="43" rx="8" fill="#f0c74e" />
            <path d="M183 229h30M183 238h24" stroke="#2e7b48" strokeWidth="4" strokeLinecap="round" opacity="0.72" />

            <circle cx="142" cy="205" r="15" fill="#efbd8b" />
            <path d="M125 201c5-18 35-21 41 2l-18 2z" fill="#17804a" />
            <path d="M136 220l-24 40M139 221l28 22" stroke="#205f3e" strokeWidth="12" strokeLinecap="round" />
            <path d="M151 220l22 21" stroke="#eef3e8" strokeWidth="7" strokeLinecap="round" />
            <path d="M169 243l20-3" stroke="#173d2b" strokeWidth="6" strokeLinecap="round" />
          </g>

          <g className="feirae-launch__motion-lines">
            <path d="M16 274h50M9 287h38M30 261h27" stroke="#dff36b" strokeWidth="4" strokeLinecap="round" />
          </g>

          <g className="feirae-launch__pin">
            <path d="M391 231c-15 0-27 12-27 27 0 22 27 47 27 47s27-25 27-47c0-15-12-27-27-27z" fill="#f2a340" />
            <circle cx="391" cy="257" r="9" fill="#fff" />
            <circle cx="391" cy="257" r="4" fill="#de8e2b" />
          </g>
        </svg>
      </div>

      <div className="feirae-launch__brand">
        <span className="feirae-launch__brand-mark">
          <img src="/feirae-mark.svg" alt="" aria-hidden="true" />
        </span>
        <div className="feirae-launch__brand-copy">
          <strong>Feiraê</strong>
          <span>Da feira até você</span>
        </div>
      </div>

      <span className="feirae-launch__caption">Feira local, compra simples, entrega perto.</span>
    </section>
  );
}

export function LaunchExperience({ children }: { children: ReactNode }) {
  const [variant] = useState<SplashVariant>(() => getLaunchVariant());
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (variant === "full") {
      try {
        window.localStorage.setItem(FEIRAE_SPLASH_LAST_FULL_DAY_KEY, localDayKey());
      } catch {
        // A abertura continua funcionando mesmo sem armazenamento local.
      }
    }

    const soundDelay = soundDelays[variant];
    const soundTimer =
      soundDelay !== undefined && isFeiraeSoundEnabled()
        ? window.setTimeout(() => {
            void playFeiraeSoundMark();
          }, soundDelay)
        : null;

    const hideTimer = window.setTimeout(() => {
      setVisible(false);
    }, durations[variant]);

    return () => {
      window.clearTimeout(hideTimer);
      if (soundTimer !== null) window.clearTimeout(soundTimer);
    };
  }, [variant]);

  return (
    <>
      <div className={`feirae-app-shell${visible ? " is-preloading" : ""}`} aria-hidden={visible}>
        {children}
      </div>
      {visible && <SplashScreen variant={variant} />}
    </>
  );
}
