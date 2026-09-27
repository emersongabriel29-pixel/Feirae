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

function SplashFrame({ className, src }: { className: string; src: string }) {
  return (
    <div className={`feirae-launch__phase ${className}`} aria-hidden="true">
      <img src={src} alt="" draggable={false} />
    </div>
  );
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
      <SplashFrame className="feirae-launch__phase--start" src="/launch/feirae-splash-start.svg" />
      <SplashFrame className="feirae-launch__phase--market" src="/launch/feirae-splash-market.svg" />
      <SplashFrame className="feirae-launch__phase--logo" src="/launch/feirae-splash-logo.svg" />
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
