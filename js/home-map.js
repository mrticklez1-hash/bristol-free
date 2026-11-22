// "Explore near you" mini map: glides from place to place and shows a small card for each.
// Featured listings come first and appear most often; then places with a photo.
// Loads only when scrolled near, pauses whenever someone touches it, and stays still for reduced motion.
import { CATS, PRICE, listingUrl } from "./data.js";
import { esc, scene } from "./ui.js";
import { addBasemap } from "./basemap.js";

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const STEP_MS = 5500;

const load = (tag, attrs) => new Promise((ok, fail) => {
  const el = document.createElement(tag);
  Object.assign(el, attrs);
  el.onload = ok; el.onerror = fail;
  document.head.appendChild(el);
});

function pickTour(all) {
  const placed = all.filter(l => typeof l.lat === "number" && typeof l.lng === "number");
  const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(p => p[1]);
  const featured = shuffle(placed.filter(l => l.featured));
  const others = shuffle(placed.filter(l => !l.featured)).sort((a, b) => !!b.image_url - !!a.image_url).slice(0, 12);
  if (!featured.length) return others;
  if (!others.length) return featured;
  // a featured place every other stop, so they show up most often
  const out = [];
  others.forEach((o, k) => { if (k % 2 === 0) out.push(featured[(k / 2) % featured.length]); out.push(o); });
  return out;
}

function tourCard(l) {
  const c = CATS[l.category] || CATS.play;
  const img = l.image_url ? `<img src="${esc(l.image_url)}" alt="">` : scene(l.category);
  const price = l.price_band === 0 ? '<span class="tagpill free">Free</span>' : `<span class="tagpill">${PRICE[l.price_band] ?? ""}</span>`;
  return `<a class="tour-card" href="${listingUrl(l)}">
    <span class="tour-img" style="background:${c.c}">${img}${price}${l.featured ? '<span class="tagpill feat">Featured</span>' : ""}</span>
    <span class="tour-body"><b>${esc(l.name)}</b><span>${esc(l.area)} · ${esc(c.n)}</span>${l.description ? `<span class="tour-desc">${esc(l.description)}</span>` : ""}<em>See details →</em></span>
  </a>`;
}

export function startTour(all, box) {
  if (!box) return;
  const tour = pickTour(all);
  if (!tour.length) { box.closest(".explore-map")?.remove(); return; }
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const go = async () => {
    if (!window.L) {
      await load("link", { rel: "stylesheet", href: LEAFLET_CSS });
      await load("script", { src: LEAFLET_JS });
    }
    const L = window.L;
    const map = L.map(box, { zoomControl: false, attributionControl: true, scrollWheelZoom: false, maxZoom: 19 })
      .setView([tour[0].lat, tour[0].lng], 13);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    addBasemap(map);

    const dot = L.divIcon({ className: "tour-dot", iconSize: [12, 12] });
    const live = L.divIcon({ className: "tour-pin", html: "<span></span>", iconSize: [26, 34], iconAnchor: [13, 34] });
    tour.forEach(l => L.marker([l.lat, l.lng], { icon: dot, interactive: false, keyboard: false }).addTo(map));
    const pin = L.marker([tour[0].lat, tour[0].lng], { icon: live, keyboard: false }).addTo(map);
    // the card floats above the map box, so it can be big and spill over the edges
    const wrapEl = box.parentElement;
    const float = document.createElement("div");
    float.className = "tour-float"; float.setAttribute("aria-live", "polite");
    wrapEl.appendChild(float);
    let current = null;
    const place = () => {
      if (!current) return;
      const pt = map.latLngToContainerPoint([current.lat, current.lng]);
      const w = float.offsetWidth, h = float.offsetHeight, mw = box.offsetWidth;
      const spill = window.innerWidth > 860 ? 36 : 0;
      const x = Math.max(-spill, Math.min(mw - w + spill, pt.x - w / 2));
      float.style.left = (box.offsetLeft + x) + "px";
      float.style.top = (box.offsetTop + pt.y - 44 - h) + "px";
      float.style.setProperty("--arrow", (pt.x - x) + "px");
    };
    map.on("move zoom", place);
    window.addEventListener("resize", place);

    let i = 0, timer = null, paused = still;
    const btn = box.parentElement.querySelector(".tour-toggle");
    const show = (n, fly = !still) => {
      const l = tour[n % tour.length];
      float.classList.remove("on");
      const open = () => {
        pin.setLatLng([l.lat, l.lng]); current = l;
        float.innerHTML = tourCard(l); place();
        requestAnimationFrame(() => float.classList.add("on"));
      };
      // centre a little above the place, so the pin sits low and its card has room above it
      const z = 14, lift = map.getSize().y * 0.3;
      const centre = map.unproject(map.project([l.lat, l.lng], z).subtract([0, lift]), z);
      if (fly) { map.once("moveend", open); map.flyTo(centre, z, { duration: 1.6 }); }
      else { map.setView(centre, z); open(); }
    };
    const tick = () => { i++; show(i); };
    const play = () => { paused = false; clearInterval(timer); timer = setInterval(tick, STEP_MS); btn?.setAttribute("aria-pressed", "false"); if (btn) btn.textContent = "Pause tour"; };
    const pause = () => { paused = true; clearInterval(timer); btn?.setAttribute("aria-pressed", "true"); if (btn) btn.textContent = "Play tour"; };

    show(0, false);
    if (!still) play(); else pause();

    // someone is using the map: stop the tour so it never fights them
    ["mousedown", "touchstart", "wheel", "keydown"].forEach(ev => box.addEventListener(ev, () => { if (!paused) pause(); }, { passive: true }));
    btn?.addEventListener("click", () => { if (paused) { tick(); play(); } else pause(); });
    // pause while off screen or in another tab
    new IntersectionObserver(([e]) => { if (!e.isIntersecting) clearInterval(timer); else if (!paused) play(); }).observe(box);
    document.addEventListener("visibilitychange", () => { if (document.hidden) clearInterval(timer); else if (!paused) play(); });
  };

  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); go().catch(() => box.closest(".explore-map")?.remove()); } }, { rootMargin: "300px" });
  io.observe(box);
}
