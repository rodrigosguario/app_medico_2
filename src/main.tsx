import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import ErrorBoundary from "./ErrorBoundary";
import "./error-goggles";

// Logs úteis
console.log("[BOOT] Vite env:", {
  VITE_SUPABASE_URL: !!import.meta.env?.VITE_SUPABASE_URL ? "definida" : "vazia",
  VITE_SUPABASE_PUBLISHABLE_KEY: !!import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ? "definida" : "vazia",
  MODE: import.meta.env?.MODE,
});

// Network error tracking para debug de conectividade
window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Promise rejeitada não tratada:', event.reason);
  
  if (event.reason?.message?.includes('Failed to fetch') ||
      event.reason?.message?.includes('ERR_INTERNET_DISCONNECTED') ||
      event.reason?.message?.includes('NetworkError')) {
    console.error('🌐 Erro de rede não tratado:', {
      reason: event.reason,
      promise: event.promise,
      timestamp: new Date().toISOString()
    });
  }
});

// Global error tracking para problemas de conectividade
window.addEventListener('error', (event) => {
  console.error('🚨 Erro JavaScript global:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
    timestamp: new Date().toISOString()
  });
});

const root = document.getElementById("root");
if (!root) {
  console.error("[BOOT] Elemento #root não encontrado em index.html");
}

ReactDOM.createRoot(root!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <App />
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

// Registro do Service Worker (PWA)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        console.log("[SW] Registrado:", reg.scope);
      })
      .catch((err) => {
        console.error("[SW] Falha ao registrar:", err);
      });
  });
}
