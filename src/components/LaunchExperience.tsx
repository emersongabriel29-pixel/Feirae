import { type ReactNode, useEffect, useState } from "react";
import { isFeiraeSoundEnabled, playFeiraeSoundMark } from "../domain/feiraeSound";
import "./LaunchExperience.css";

export const FEIRAE_SPLASH_LAST_FULL_DAY_KEY = "feirae:splash:last-full-day";

type SplashVariant = "full" | "quick" | "reduced";

const durations: Record<SplashVariant, number> = {
  full: 3100,
  quick: 1450,
  reduced: 650,
};

const soundDelays: Partial<Record<SplashVariant, number>> = {
  full: 2460,
  quick: 790,
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
      <div className="feirae-launch__glow" aria-hidden="true" />
      <div className="feirae-launch__leaf feirae-launch__leaf--one" aria-hidden="true" />
      <div className="feirae-launch__leaf feirae-launch__leaf--two" aria-hidden="true" />

      <div className="feirae-launch__scene" aria-hidden="true">
        <svg className="feirae-launch__art" viewBox="0 0 360 300">
          <path
            className="feirae-launch__route"
            d="M38 245 C108 210 178 266 326 220"
            fill="none"
          />

          <g className="feirae-launch__stall-fill">
            <rect x="88" y="116" width="154" height="101" rx="12" fill="#f4e3be" />
            <rect x="98" y="146" width="134" height="71" rx="8" fill="#b8783f" />
            <path d="M76 108h179l-17-42H94z" fill="#f7f3e9" />
            <path d="M94 66h30l-8 42H76z" fill="#1f8b52" />
            <path d="M124 66h31l-3 42h-36z" fill="#ffffff" />
            <path d="M155 66h31l3 42h-37z" fill="#2ca565" />
            <path d="M186 66h31l8 42h-36z" fill="#ffffff" />
            <path d="M217 66h21l17 42h-30z" fill="#1f8b52" />
            <rect x="111" y="167" width="45" height="35" rx="5" fill="#8d552f" />
            <rect x="164" y="167" width="45" height="35" rx="5" fill="#8d552f" />
            <circle cx="123" cy="177" r="8" fill="#ef594b" />
            <circle cx="139" cy="179" r="7" fill="#e94a3b" />
            <circle cx="176" cy="178" r="8" fill="#f3c84d" />
            <circle cx="194" cy="178" r="8" fill="#ef8e3f" />
            <path d="M119 191c5-12 11-17 17-17 4 8 3 15-2 23z" fill="#4ca85f" />
            <path d="M184 194c2-14 8-21 17-22 4 10 2 18-7 25z" fill="#3d9654" />
          </g>

          <g className="feirae-launch__stall-outline">
            <path d="M76 108h179L238 66H94z" />
            <path d="M88 116v101h154V116" />
            <path d="M98 146h134" />
            <path d="M111 167h45v35h-45z" />
            <path d="M164 167h45v35h-45z" />
            <path d="M94 66l-18 42M124 66l-8 42M155 66l-3 42M186 66l3 42M217 66l8 42" />
          </g>

          <g className="feirae-launch__produce feirae-launch__produce--tomato">
            <circle cx="67" cy="124" r="15" fill="#f15545" />
            <path d="M67 107l4 7 8-2-6 7 3 7-9-4-8 4 3-8-6-6 8 2z" fill="#2d8b51" />
          </g>
          <g className="feirae-launch__produce feirae-launch__produce--carrot">
            <path d="M283 93c17 14 14 34-5 52-8-23-7-41 5-52z" fill="#f39a43" />
            <path
              d="M280 94c-2-12 3-20 13-25M282 95c8-10 17-12 25-7"
              stroke="#3d9958"
              strokeWidth="7"
              strokeLinecap="round"
            />
          </g>
          <g className="feirae-launch__produce feirae-launch__produce--leaf">
            <path d="M55 174c20-16 39-14 56 6-22 10-41 8-56-6z" fill="#7fc96c" />
            <path
              d="M61 173c16 2 29 5 40 10"
              stroke="#2e7f4b"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>

          <g className="feirae-launch__bike">
            <circle cx="84" cy="242" r="20" fill="none" stroke="#173d2b" strokeWidth="7" />
            <circle cx="149" cy="242" r="20" fill="none" stroke="#173d2b" strokeWidth="7" />
            <path
              d="M84 242l31-32 34 32h-40l-15-42h33"
              fill="none"
              stroke="#1d8e53"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M109 210h30l-6-24h-28z" fill="#236f47" />
            <circle cx="119" cy="173" r="12" fill="#f2bb84" />
            <path d="M104 168c5-14 28-16 33 2l-13 1z" fill="#1f8b52" />
            <path d="M116 185l-22 25" stroke="#1d5f3d" strokeWidth="10" strokeLinecap="round" />
            <rect x="134" y="176" width="31" height="29" rx="5" fill="#f3c84d" />
            <path
              d="M144 185c5 0 9 3 11 8"
              stroke="#317c4b"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>

          <g className="feirae-launch__pin">
            <path
              d="M318 198c-13 0-23 10-23 23 0 18 23 39 23 39s23-21 23-39c0-13-10-23-23-23z"
              fill="#f2a340"
            />
            <circle cx="318" cy="220" r="7" fill="#fff" />
          </g>
        </svg>
      </div>

      <div className="feirae-launch__brand">
        <img src="/feirae-mark.svg" alt="" aria-hidden="true" />
        <div>
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
