import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App";
import { LaunchExperience } from "./components/LaunchExperience";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/feirae-sw.js").catch(() => undefined);
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LaunchExperience>
      <App />
    </LaunchExperience>
  </StrictMode>,
);
