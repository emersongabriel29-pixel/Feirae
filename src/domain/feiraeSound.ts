export const FEIRAE_SOUND_ENABLED_KEY = "feirae:sound-enabled";
export const FEIRAE_SONIC_LOGO_SRC = "/feirae-sonic-logo.mp3";

let activeSonicLogo: HTMLAudioElement | null = null;

export function isFeiraeSoundEnabled() {
  if (typeof window === "undefined") return false;

  try {
    const stored = window.localStorage.getItem(FEIRAE_SOUND_ENABLED_KEY);
    return stored === null ? true : JSON.parse(stored) !== false;
  } catch {
    return true;
  }
}

async function playFeiraeSonicLogoAsset() {
  if (typeof window === "undefined" || typeof Audio === "undefined") return false;

  try {
    activeSonicLogo?.pause();

    const audio = new Audio(FEIRAE_SONIC_LOGO_SRC);
    audio.preload = "auto";
    audio.volume = 0.82;
    activeSonicLogo = audio;

    audio.addEventListener(
      "ended",
      () => {
        if (activeSonicLogo === audio) activeSonicLogo = null;
      },
      { once: true },
    );

    await audio.play();
    return true;
  } catch {
    activeSonicLogo = null;
    return false;
  }
}

export async function playFeiraeSoundMark() {
  if (!isFeiraeSoundEnabled() || typeof window === "undefined") {
    return false;
  }

  if (await playFeiraeSonicLogoAsset()) {
    return true;
  }

  if (!window.AudioContext) {
    return false;
  }

  let context: AudioContext | null = null;

  try {
    context = new window.AudioContext();

    if (context.state === "suspended") {
      await context.resume();
    }

    if (context.state !== "running") {
      await context.close();
      return false;
    }

    const activeContext = context;
    const master = activeContext.createGain();
    master.gain.setValueAtTime(0.16, activeContext.currentTime);
    master.connect(activeContext.destination);

    const notes = [
      { frequency: 659.25, offset: 0, duration: 0.22 },
      { frequency: 783.99, offset: 0.17, duration: 0.22 },
      { frequency: 987.77, offset: 0.34, duration: 0.4 },
    ];

    const start = activeContext.currentTime + 0.02;
    let ended = 0;

    for (const note of notes) {
      const oscillator = activeContext.createOscillator();
      const gain = activeContext.createGain();
      const filter = activeContext.createBiquadFilter();
      const at = start + note.offset;

      oscillator.type = note.offset === 0.34 ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(note.frequency, at);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2600, at);
      filter.Q.setValueAtTime(0.65, at);

      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.34, at + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + note.duration);

      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(master);

      oscillator.start(at);
      oscillator.stop(at + note.duration + 0.03);
      oscillator.addEventListener(
        "ended",
        () => {
          ended += 1;
          if (ended === notes.length && activeContext.state !== "closed") {
            void activeContext.close();
          }
        },
        { once: true },
      );
    }

    return true;
  } catch {
    if (context && context.state !== "closed") {
      await context.close().catch(() => undefined);
    }
    return false;
  }
}
