const CACHE_NAME = "orbi-shop-shell-v2";
const APP_SHELL = ["/", "/index.html", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/sellers")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/", clone));
          return response;
        })
        .catch(() => caches.match("/") || caches.match("/index.html"))
    );
    return;
  }

  if (url.pathname.startsWith("/assets/") || url.pathname.endsWith(".css") || url.pathname.endsWith(".js")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const contentType = response.headers.get("content-type") || "";
          const isExpectedAsset =
            (url.pathname.endsWith(".css") && contentType.includes("text/css")) ||
            (url.pathname.endsWith(".js") && contentType.includes("javascript")) ||
            (!url.pathname.endsWith(".css") && !url.pathname.endsWith(".js") && response.ok);

          if (response.ok && isExpectedAsset) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});
