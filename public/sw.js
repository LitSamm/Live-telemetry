const CACHE_NAME = "anargya-telemetry-v5";
const APP_SHELL = ["/", "/manifest.webmanifest", "/anargya-app-icon-192.png", "/anargya-app-icon-512.png", "/anargya-wordmark.png", "/anargya-mark.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put("/", response.clone());
          }
          return response;
        })
        .catch(() => caches.match("/").then((response) => response || Response.error())),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || APP_SHELL.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fresh = fetch(request).then(async (response) => {
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response.clone());
          }
          return response;
        });
        return cached || fresh;
      }),
    );
  }
});
