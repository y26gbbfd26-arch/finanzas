// Service Worker para Finanzas Personales
// Estrategia: network-first para la app shell, cache-first para CDNs
const VERSION = "v37";
const APP_CACHE = `finanzas-app-${VERSION}`;
const CDN_CACHE = `finanzas-cdn-${VERSION}`;

const APP_ASSETS = [
  "./",
  "./index.html",
  "./app.jsx",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

const CDN_ASSETS = [
  "https://unpkg.com/react@18/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
  "https://unpkg.com/@babel/standalone/babel.min.js",
  "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap",
];

// Al instalar, precarga app y CDNs
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const appCache = await caches.open(APP_CACHE);
    await appCache.addAll(APP_ASSETS);
    const cdnCache = await caches.open(CDN_CACHE);
    await Promise.allSettled(CDN_ASSETS.map(u => cdnCache.add(u)));
    // Saltar la fase "waiting" y activarse inmediatamente
    self.skipWaiting();
  })());
});

// Al activarse, limpia caches viejos y toma control de pestañas abiertas
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => k !== APP_CACHE && k !== CDN_CACHE).map(k => caches.delete(k))
    );
    await self.clients.claim();
    // Notificar a las pestañas abiertas que hay versión nueva
    const clients = await self.clients.matchAll({ type: "window" });
    clients.forEach(c => c.postMessage({ type: "SW_UPDATED", version: VERSION }));
  })());
});

// Mensajes desde la app: permitir forzar skipWaiting desde un botón
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Fetch: network-first para todo lo de la app (siempre intenta lo nuevo primero)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isApp = url.origin === self.location.origin;

  if (isApp) {
    event.respondWith((async () => {
      try {
        // Forzar bypass de caché HTTP del navegador
        const networkResp = await fetch(event.request, { cache: "no-store" });
        const cache = await caches.open(APP_CACHE);
        cache.put(event.request, networkResp.clone());
        return networkResp;
      } catch (e) {
        const cached = await caches.match(event.request);
        return cached || new Response("Offline", { status: 503 });
      }
    })());
  } else {
    // Cache first para CDNs (no cambian)
    event.respondWith((async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      try {
        const networkResp = await fetch(event.request);
        const cache = await caches.open(CDN_CACHE);
        cache.put(event.request, networkResp.clone());
        return networkResp;
      } catch (e) {
        return new Response("Offline", { status: 503 });
      }
    })());
  }
});
