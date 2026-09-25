import { useCallback, useEffect, useRef, useState } from "react";

export function useToast(duration = 2800) {
  const [toast, setToast] = useState("");
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const notify = useCallback(
    (message: string) => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      setToast(message);
      timerRef.current = window.setTimeout(() => {
        setToast("");
        timerRef.current = null;
      }, duration);
    },
    [duration],
  );

  return { toast, notify };
}
