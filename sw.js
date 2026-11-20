// Bristol Free & Affordable: makes the site installable, faster on repeat visits,
// and shows a friendly page when there's no signal.
// Pages, scripts and styles always try the network first, so a new deploy shows straight away.
const VERSION = "bf-2026-11-20a";
const CORE = ["/", "/offline.html", "/css/styles.css", "/img/logo-mark.svg", "/img/app/icon-192.png", "/manifest.webmanifest"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const IMMUTABLE = /^https:\/\/(unpkg\.com\/[^/]+@\d|fonts\.gstatic\.com\/)/; // versioned libraries and font files never change
function networkFirst(req, fallback) {
  return fetch(req).then(res => {
    if (res.ok && res.type === "basic") { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: req.mode === "navigate" }).then(r => r || (fallback ? caches.match(fallback) : Response.error())));
}
function cacheFirst(req) {
  return caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(VERSION + "-assets").then(c => c.put(req, copy)); }
    return res;
  }));
}

self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  // never cache the database, sign-in, card scanning, admin or map tiles
  if (url.hostname.endsWith("supabase.co") || /\/(admin|staff|verify)\.html$|^\/v$/.test(url.pathname) || url.hostname.includes("openfreemap") || url.hostname.includes("openstreetmap")) return;
  if (req.mode === "navigate") return e.respondWith(networkFirst(req, "/offline.html"));
  if (url.origin === location.origin) {
    if (/\.(png|jpe?g|webp|svg|gif|ico)$/i.test(url.pathname)) return e.respondWith(cacheFirst(req));
    return e.respondWith(networkFirst(req));
  }
  if (IMMUTABLE.test(req.url)) return e.respondWith(cacheFirst(req));
});
