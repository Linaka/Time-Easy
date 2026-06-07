import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { ErrorBoundary } from "./components/templates/index.js";
import { registerGlobalErrorHandlers } from "./services/clientLogger.js";
import "./index.css";

registerGlobalErrorHandlers();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
