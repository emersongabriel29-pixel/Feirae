import { type ReactNode, useEffect, useState } from "react";
import { isFeiraeSoundEnabled, playFeiraeSoundMark } from "../domain/feiraeSound";
import "./LaunchExperience.css";
import { FeiraeBrand } from "./FeiraeBrand";

export const FEIRAE_SPLASH_LAST_FULL_DAY_KEY = "feirae:splash:last-full-day";

type SplashVariant = "full" | "quick" | "reduced";

const fallbackDurations: Record<SplashVariant, number> = {
  full: 7000,
  quick: 7000,
  reduced: 650,
};

const soundDelays: Partial<Record<SplashVariant, number>> = {
  full: 80,
  quick: 80,
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

function SplashScreen({ variant, onDone }: { variant: SplashVariant; onDone: () => void }) {
  if (variant === "reduced") {
    return (
      <section
        className="feirae-launch feirae-launch--reduced"
        data-variant={variant}
        role="status"
        aria-label="Feiraê carregando"
        aria-live="polite"
      >
        <div className="feirae-launch__reduced">
          <FeiraeBrand priority />
        </div>
      </section>
    );
  }

  return (
    <section
      className="feirae-launch"
      data-variant={variant}
      role="status"
      aria-label="Feiraê carregando"
      aria-live="polite"
    >
      <video
        className="feirae-launch__video"
        src="/feirae-launch.mp4"
        autoPlay
        playsInline
        muted
        preload="auto"
        controls={false}
        onEnded={onDone}
        onError={onDone}
        aria-hidden="true"
      />
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

    const fallbackTimer = window.setTimeout(() => {
      setVisible(false);
    }, fallbackDurations[variant]);

    return () => {
      window.clearTimeout(fallbackTimer);
      if (soundTimer !== null) window.clearTimeout(soundTimer);
    };
  }, [variant]);

  const finishLaunch = () => {
    setVisible(false);
  };

  return (
    <>
      <div className={`feirae-app-shell${visible ? " is-preloading" : ""}`} aria-hidden={visible}>
        {children}
      </div>
      {visible && <SplashScreen variant={variant} onDone={finishLaunch} />}
    </>
  );
}
