import { useEffect, useState } from "react";
import { UNIFIED_ORDER_EVENT } from "../domain/orderBridge";

export function useUnifiedOrderRevision() {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const bump = () => setRevision((value) => value + 1);
    window.addEventListener(UNIFIED_ORDER_EVENT, bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener(UNIFIED_ORDER_EVENT, bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  return revision;
}
