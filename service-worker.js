// Service Worker para Finanzas Personales
// Estrategia: network-first para la app shell, cache-first para CDNs
const VERSION = "v1";
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
    // No fallar la instalación si algún CDN está caído
    await Promise.allSettled(CDN_ASSETS.map(u => cdnCache.add(u)));
    self.skipWaiting();
  })());
});

// Al activarse, limpia caches viejos
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => k !== APP_CACHE && k !== CDN_CACHE).map(k => caches.delete(k))
    );
    self.clients.claim();
  })());
});

// Fetch: para APP usar network-first (recibir updates), para CDN cache-first
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isApp = url.origin === self.location.origin;

  if (isApp) {
    // Network first con fallback a cache
    event.respondWith((async () => {
      try {
        const networkResp = await fetch(event.request);
        const cache = await caches.open(APP_CACHE);
        cache.put(event.request, networkResp.clone());
        return networkResp;
      } catch (e) {
        const cached = await caches.match(event.request);
        return cached || new Response("Offline", { status: 503 });
      }
    })());
  } else {
    // Cache first para CDNs
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
