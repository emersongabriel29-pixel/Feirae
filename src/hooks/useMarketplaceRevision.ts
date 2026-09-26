import { useEffect, useState } from "react";
import { MARKETPLACE_EVENT } from "../domain/marketplaceBridge";

export function useMarketplaceRevision() {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const bump = () => setRevision((value) => value + 1);
    window.addEventListener(MARKETPLACE_EVENT, bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener(MARKETPLACE_EVENT, bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  return revision;
}
