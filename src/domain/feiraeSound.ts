export const FEIRAE_SOUND_ENABLED_KEY = "feirae:sound-enabled";

export function isFeiraeSoundEnabled() {
  if (typeof window === "undefined") return false;

  try {
    const stored = window.localStorage.getItem(FEIRAE_SOUND_ENABLED_KEY);
    return stored === null ? true : JSON.parse(stored) !== false;
  } catch {
    return true;
  }
}

export async function playFeiraeSoundMark() {
  if (!isFeiraeSoundEnabled() || typeof window === "undefined" || !window.AudioContext) {
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

    const master = context.createGain();
    master.gain.setValueAtTime(0.16, context.currentTime);
    master.connect(context.destination);

    const notes = [
      { frequency: 659.25, offset: 0, duration: 0.22 },
      { frequency: 783.99, offset: 0.17, duration: 0.22 },
      { frequency: 987.77, offset: 0.34, duration: 0.4 },
    ];

    const start = context.currentTime + 0.02;
    let ended = 0;

    for (const note of notes) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
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
          if (ended === notes.length && context?.state !== "closed") {
            void context.close();
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
