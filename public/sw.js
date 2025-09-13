/* Simple PWA SW for Vite SPA (hash router) */
const CACHE_NAME = "ps-cache-v1";
const ASSETS = [
  "/",                // root
  "/index.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

/* Install: pré-cache básico */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

/* Activate: limpa caches antigos */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : undefined)))
    )
  );
  self.clients.claim();
});

/* Fetch: 
   - navegação (HTML): network-first com fallback para index.html (SPA)
   - demais (assets): cache-first com atualização em background
*/
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Navegação (documentos HTML)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Mesma origem: cache-first
  if (new URL(req.url).origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) {
          // Atualiza em background
          fetch(req).then((res) => {
            if (res && res.ok) {
              caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
            }
          }).catch(() => {});
          return cached;
        }
        // Sem cache: busca e armazena
        return fetch(req).then((res) => {
          if (res && res.ok && req.method === "GET") {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        });
      })
    );
  }
});
