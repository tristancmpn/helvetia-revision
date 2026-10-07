// Service worker : réseau d'abord (pour recevoir les mises à jour), cache en secours (hors ligne).
const CACHE = "helvetia-20261007110725";
const SHELL = ["./", "index.html", "app.js?v=20261007110725", "styles.css?v=20261007110725", "content.json", "content.bin", "manifest.webmanifest", "icons/icon-192.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  // activation immédiate : comme tout est servi « réseau d'abord », il n'y a pas d'ancienne version à protéger
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(req, { cache: "no-cache" });
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch {
      return (await cache.match(req, { ignoreSearch: req.mode === "navigate" })) ?? (await cache.match("index.html")) ?? Response.error();
    }
  })());
});
