import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerSW, setupPWAInstall } from "./utils/pwa";
import { initSentry } from "./lib/logger";

// Initialize observability before rendering so errors during mount are captured.
initSentry();

createRoot(document.getElementById("root")!).render(<App />);

// Register the service worker as early as possible so the PWA shell is
// cached on every entry, including deep-links that bypass /.
registerSW();
setupPWAInstall();
