import { addBasemap } from "./basemap.js";
import { fetchListings, AREAS, CATS, PRICE } from "./data.js";
import { $, card, initHeader, openListing, wireModal, esc } from "./ui.js";
import { handleClaim } from "./claim.js";

initHeader();
wireModal();

const params = new URLSearchParams(location.search);
$("#area").insertAdjacentHTML("beforeend", AREAS.map(a => `<option>${esc(a)}</option>`).join(""));
$("#q").value = params.get("q") || "";
$("#area").value = AREAS.includes(params.get("area")) ? params.get("area") : "";
$("#price").value = ["0", "1", "2", "3"].includes(params.get("price")) ? params.get("price") : "";
$("#age").value = ["baby", "toddler", "kids", "teen"].includes(params.get("age")) ? params.get("age") : "";
let activeCat = CATS[params.get("cat")] ? params.get("cat") : "";

/* ---------- map ---------- */
let map = null, cluster = null, markers = new Map();
async function loadLeaflet() {
  if (window.L) return;
  await new Promise((res, rej) => { const s = document.createElement("script"); s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; s.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="; s.crossOrigin = ""; s.onload = res; s.onerror = rej; document.head.append(s); });
  await new Promise(res => { const s = document.createElement("script"); s.src = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"; s.onload = res; s.onerror = res; document.head.append(s); });
}
async function initMap() {
  try {
    await loadLeaflet();
    map = L.map("map", { scrollWheelZoom: false, maxZoom: 19 }).setView([51.47, -2.6], 10);
    addBasemap(map);
    cluster = L.markerClusterGroup ? L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 45 }) : L.layerGroup();
    map.addLayer(cluster);
  } catch (e) {
    $("#map").innerHTML = '<div class="empty" style="height:100%;display:grid;place-items:center">The map couldn\'t load. The list below still works.</div>';
  }
}
const pinColour = l => l.featured ? "#E0A83A" : l.price_band === 0 ? "#0B6B4F" : "#0F2A44";
function renderMap(list) {
  if (!map) return;
  cluster.clearLayers(); markers.clear();
  const pts = [];
  list.forEach(l => {
    if (typeof l.lat !== "number" || typeof l.lng !== "number") return;
    const m = L.marker([l.lat, l.lng], {
      icon: L.divIcon({ className: "", html: `<div class="pin" style="background:${pinColour(l)}"></div>`, iconSize: [22, 22], iconAnchor: [11, 11] }),
      title: l.name, alt: l.name, keyboard: true,
    });
    const el = document.createElement("div");
    el.className = "pop";
    el.innerHTML = `${l.image_url ? `<img src="${esc(l.image_url)}" alt="">` : ""}<b>${esc(l.name)}</b><span>${esc(l.area)} · ${PRICE[l.price_band] ?? ""}</span><button type="button">View details</button>`;
    el.querySelector("button").addEventListener("click", () => openListing(l, { onClaim: handleClaim }));
    m.bindPopup(el);
    cluster.addLayer(m); markers.set(String(l.id), m); pts.push([l.lat, l.lng]);
  });
  if (pts.length) map.fitBounds(pts, { padding: [30, 30], maxZoom: 14 });
}

/* ---------- list + filters ---------- */
let all = [];
const rank = l => (l.featured ? 2 : 0) + (l.claimed ? 1 : 0);
function filtered() {
  const q = $("#q").value.toLowerCase().trim(), a = $("#area").value, p = $("#price").value, g = $("#age").value;
  return all.filter(l =>
    (!activeCat || l.category === activeCat) && (!a || l.area === a) && (p === "" || l.price_band === +p) &&
    (!g || (l.ages || []).includes(g)) &&
    (!q || `${l.name} ${l.description || ""} ${CATS[l.category]?.n || ""} ${l.area}`.toLowerCase().includes(q))
  ).sort((x, y) => rank(y) - rank(x) || x.name.localeCompare(y.name));
}
function renderChips() {
  $("#chips").innerHTML = `<button type="button" class="chip${activeCat ? "" : " on"}" data-cat="" aria-pressed="${!activeCat}">All</button>` +
    Object.entries(CATS).map(([k, c]) => `<button type="button" class="chip${activeCat === k ? " on" : ""}" data-cat="${k}" aria-pressed="${activeCat === k}">${esc(c.n)}</button>`).join("");
}
function syncUrl() {
  const u = new URLSearchParams();
  if ($("#q").value.trim()) u.set("q", $("#q").value.trim());
  if ($("#area").value) u.set("area", $("#area").value);
  if ($("#price").value) u.set("price", $("#price").value);
  if ($("#age").value) u.set("age", $("#age").value);
  if (activeCat) u.set("cat", activeCat);
  history.replaceState(null, "", u.toString() ? `?${u}` : location.pathname);
}
function render() {
  const list = filtered();
  $("#count").textContent = `${list.length} ${list.length === 1 ? "place" : "places"} found`;
  $("#results").innerHTML = list.length ? list.map(card).join("") :
    '<div class="empty">No matches yet. Try another area, budget or category.<br><br><a class="btn ghost" href="/business.html">Suggest a place</a></div>';
  renderMap(list); syncUrl();
}

$("#chips").addEventListener("click", e => { const b = e.target.closest("[data-cat]"); if (!b) return; activeCat = b.dataset.cat; renderChips(); render(); });
["#q", "#area", "#price", "#age"].forEach(s => $(s).addEventListener("input", render));
$("#results").addEventListener("click", e => {
  const b = e.target.closest(".card[data-id]"); if (!b) return;
  const l = all.find(x => String(x.id) === b.dataset.id); if (l) openListing(l, { onClaim: handleClaim });
});
const setView = both => {
  $("#v-both").setAttribute("aria-pressed", String(both)); $("#v-list").setAttribute("aria-pressed", String(!both));
  $("#map").hidden = !both; $("#legend").hidden = !both; if (both && map) setTimeout(() => map.invalidateSize(), 50);
};
$("#v-both").addEventListener("click", () => setView(true));
$("#v-list").addEventListener("click", () => setView(false));

renderChips();
const [, data] = await Promise.all([initMap(), fetchListings().catch(() => null)]);
if (!data) { $("#results").innerHTML = '<div class="empty">Listings are taking a moment to load. Please refresh.</div>'; }
else { all = data; render(); }
