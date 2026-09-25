import { useEffect, useRef, useState } from "react";

const EVENT_NAME = "feirae:persistent-state";

function readStoredValue<T>(key: string, initialValue: T) {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : initialValue;
  } catch {
    return initialValue;
  }
}

function sameValue(a: unknown, b: unknown) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return Object.is(a, b);
  }
}

export function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => readStoredValue(key, initialValue));
  const previousKey = useRef(key);

  useEffect(() => {
    if (previousKey.current === key) return;
    previousKey.current = key;
    setValue(readStoredValue(key, initialValue));
  }, [key, initialValue]);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(
        new CustomEvent(EVENT_NAME, {
          detail: { key, value },
        }),
      );
    } catch {
      // O protótipo continua utilizável quando o armazenamento local não está disponível.
    }
  }, [key, value]);

  useEffect(() => {
    function onLocalSync(event: Event) {
      const detail = (event as CustomEvent<{ key?: string; value?: T }>).detail;
      if (!detail || detail.key !== key || sameValue(detail.value, value)) return;
      setValue(detail.value as T);
    }

    function onStorage(event: StorageEvent) {
      if (event.key !== key || !event.newValue) return;
      try {
        const next = JSON.parse(event.newValue) as T;
        if (!sameValue(next, value)) setValue(next);
      } catch {
        // Mantém o último valor válido.
      }
    }

    window.addEventListener(EVENT_NAME, onLocalSync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT_NAME, onLocalSync);
      window.removeEventListener("storage", onStorage);
    };
  }, [key, value]);

  return [value, setValue] as const;
}
