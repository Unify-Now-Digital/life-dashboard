import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import Dashboard from "./Dashboard.jsx";
import { applyTheme, getTheme } from "./lib/theme.js";

applyTheme(getTheme());

// Register the service worker (Web Push for the Spanish "Calma" reminders, and
// a precondition for installing the PWA). Guarded so it's a no-op where SWs
// aren't supported; failures are non-fatal to the app.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("Service worker registration failed", err);
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Dashboard />
  </React.StrictMode>
);
