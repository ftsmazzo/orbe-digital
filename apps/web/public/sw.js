/* ORBE Digital — SW só para assets estáticos (nunca HTML/RSC: quebra Server Actions após deploy) */
const CACHE = "orbe-static-v2";
const PRECACHE = ["/icons/icon-orbe.png", "/icons/icon.svg", "/manifest.webmanifest"];

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/sw.js" ||
    /\.(?:svg|png|jpg|jpeg|webp|ico|woff2?)$/i.test(url.pathname)
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Nunca interceptar documentos / RSC / Server Actions payload
  const accept = request.headers.get("accept") || "";
  if (request.mode === "navigate" || accept.includes("text/html") || accept.includes("text/x-component")) {
    return;
  }
  if (request.headers.has("rsc") || request.headers.has("next-router-state-tree")) {
    return;
  }
  if (!isStaticAsset(url)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
