import { useEffect, useRef, useState } from "react";

function readStoredValue<T>(key: string, initialValue: T) {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : initialValue;
  } catch {
    return initialValue;
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
    } catch {
      // O protótipo continua utilizável quando o armazenamento local não está disponível.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
