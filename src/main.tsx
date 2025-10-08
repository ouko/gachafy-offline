import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register Radix √ Connect Button web component (mobile deep link support)
import "@radixdlt/connect-button";

createRoot(document.getElementById("root")!).render(<App />);
