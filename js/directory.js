import { addBasemap } from "./basemap.js";
import { fetchListings, AREAS, CATS, PRICE, dealIndex } from "./data.js";
import { $, card, initHeader, openListing, wireModal, esc, qrMark, favourites } from "./ui.js";
import { FACILITIES, FAC, facIcon, facilitiesIndex, yesKeys } from "./facilities.js";
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
let here = null, hereMarker = null; // "Near me": the parent's position, only kept in this page
function miles(a, b) {
  const r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}
function setDistances() {
  all.forEach(l => { l._dist = here && typeof l.lat === "number" && typeof l.lng === "number" ? miles(here, l) : undefined; });
}
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
    cluster = L.markerClusterGroup ? L.markerClusterGroup({
      showCoverageOnHover: false, maxClusterRadius: 45,
      // same look as before, plus the mini QR when any place inside has a family card deal
      iconCreateFunction: cl => {
        const n = cl.getChildCount(), size = n < 10 ? "small" : n < 100 ? "medium" : "large";
        const deal = cl.getAllChildMarkers().some(m => m.options.deal);
        return L.divIcon({ html: `<div><span>${n}</span></div>${deal ? `<span class="pin-qr cl" title="Includes a family card deal">${qrMark(16)}</span>` : ""}`, className: `marker-cluster marker-cluster-${size}`, iconSize: L.point(40, 40) });
      },
    }) : L.layerGroup();
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
      icon: L.divIcon({ className: "", html: `<div class="pin" style="background:${pinColour(l)}"></div>${l._deal ? `<span class="pin-qr" title="Family card deal">${qrMark(16)}</span>` : ""}`, iconSize: [22, 22], iconAnchor: [11, 11] }),
      title: l.name, alt: l.name, keyboard: true, deal: !!l._deal,
    });
    const el = document.createElement("div");
    el.className = "pop";
    el.innerHTML = `${l.image_url ? `<img src="${esc(l.image_url)}" alt="">` : ""}<b>${esc(l.name)}</b><span>${esc(l.area)} · ${PRICE[l.price_band] ?? ""}</span><button type="button">View details</button>`;
    el.querySelector("button").addEventListener("click", () => openListing(l, { onClaim: handleClaim }));
    m.bindPopup(el);
    cluster.addLayer(m); markers.set(String(l.id), m); pts.push([l.lat, l.lng]);
  });
  if (hereMarker) { hereMarker.remove(); hereMarker = null; }
  if (here) {
    hereMarker = L.circleMarker([here.lat, here.lng], { radius: 9, color: "#fff", weight: 3, fillColor: "#2F6FED", fillOpacity: 1 }).addTo(map).bindTooltip("You are here");
    const near = list.filter(l => typeof l._dist === "number").slice(0, 6).map(l => [l.lat, l.lng]);
    map.fitBounds([[here.lat, here.lng], ...near], { padding: [40, 40], maxZoom: 14 });
  } else if (pts.length) map.fitBounds(pts, { padding: [30, 30], maxZoom: 14 });
}

/* ---------- list + filters ---------- */
let all = [];
let savedOnly = false;
const facSel = new Set(new URLSearchParams(location.search).get("fac")?.split(",").filter(k => FAC[k]) || []);
const rank = l => (l.featured ? 2 : 0) + (l.claimed ? 1 : 0);
function filtered() {
  const favs = favourites();
  const q = $("#q").value.toLowerCase().trim(), a = $("#area").value, p = $("#price").value, g = $("#age").value;
  return all.filter(l =>
    (!activeCat || l.category === activeCat) && (!a || l.area === a) && (p === "" || l.price_band === +p) &&
    (!g || (l.ages || []).includes(g)) &&
    [...facSel].every(k => l._fac?.includes(k)) &&
    (!savedOnly || favs.has(String(l.id))) &&
    (!q || `${l.name} ${l.description || ""} ${CATS[l.category]?.n || ""} ${l.area}`.toLowerCase().includes(q))
  ).sort(here
    ? (x, y) => (x._dist ?? 1e9) - (y._dist ?? 1e9) || x.name.localeCompare(y.name)
    : (x, y) => rank(y) - rank(x) || x.name.localeCompare(y.name));
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
  if (facSel.size) u.set("fac", [...facSel].join(","));
  history.replaceState(null, "", u.toString() ? `?${u}` : location.pathname);
}
function render() {
  const list = filtered();
  $("#count").textContent = savedOnly ? `${list.length} saved ${list.length === 1 ? "place" : "places"}` : `${list.length} ${list.length === 1 ? "place" : "places"} found`;
  const n = favourites().size; $("#saved-btn span").textContent = n ? `My places (${n})` : "My places";
  const fn = $("#fac-note");
  fn.hidden = !facSel.size;
  if (facSel.size) fn.textContent = `Showing places confirmed to have ${[...facSel].map(k => FAC[k].label.toLowerCase()).join(" and ")}. Others may have ${facSel.size > 1 ? "these" : "this"} too.`;
  $("#results").innerHTML = list.length ? list.map(card).join("") :
    (savedOnly ? '<div class="empty">No saved places yet. Open any listing and tap <b>Save</b> to keep it here. Saved places stay on this phone or computer.</div>'
    : '<div class="empty">No matches yet. Try another area, budget or category.<br><br><a class="btn ghost" href="/business.html">Suggest a place</a></div>');
  renderMap(list); syncUrl();
}

$("#saved-btn").addEventListener("click", e => { savedOnly = !savedOnly; e.currentTarget.setAttribute("aria-pressed", String(savedOnly)); render(); });
document.addEventListener("favchange", () => { if (all.length) render(); });
function renderFacChips() {
  $("#fac-chips").innerHTML = FACILITIES.map(f => `<button type="button" class="chip fac-chip${facSel.has(f.key) ? " on" : ""}" data-fac="${f.key}" aria-pressed="${facSel.has(f.key)}"><span class="fac-b" style="width:26px;height:26px;background:${f.bg}">${facIcon(f.key, 15)}</span>${esc(f.label)}</button>`).join("");
  $("#fac-count").textContent = facSel.size ? `(${facSel.size})` : "";
}
$("#fac-chips").addEventListener("click", e => {
  const b = e.target.closest("[data-fac]"); if (!b) return;
  facSel.has(b.dataset.fac) ? facSel.delete(b.dataset.fac) : facSel.add(b.dataset.fac);
  renderFacChips(); render();
});
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

const nearBtn = $("#near"), nearNote = $("#near-note");
function nearMsg(t) { nearNote.textContent = t; nearNote.hidden = !t; }
nearBtn.addEventListener("click", () => {
  if (here) { here = null; setDistances(); nearBtn.setAttribute("aria-pressed", "false"); nearMsg(""); render(); return; }
  if (!navigator.geolocation) { nearMsg("Your browser can't share your location, so try the Where filter instead."); return; }
  const done = () => { nearBtn.disabled = false; nearBtn.querySelector("span").textContent = "Near me"; };
  nearBtn.disabled = true; nearBtn.querySelector("span").textContent = "Finding you…";
  navigator.geolocation.getCurrentPosition(pos => {
    done();
    here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    setDistances(); nearBtn.setAttribute("aria-pressed", "true");
    const far = all.every(l => typeof l._dist !== "number" || l._dist > 40);
    nearMsg(far ? "You seem to be a long way from Bristol, so distances may look large." : "Sorted by distance from you. Your location stays on your device and isn't saved.");
    render();
  }, err => {
    done();
    nearMsg(err.code === 1 ? "Location is turned off for this site. Allow it in your browser settings, or use the Where filter." : "We couldn't find your location just now. Please try again.");
  }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 });
});

renderChips(); renderFacChips();
if (facSel.size) $("#fac-filter").open = true;
const [, data, findDeal] = await Promise.all([initMap(), fetchListings().catch(() => null), dealIndex()]);
if (data) { data.forEach(l => { l._deal = !!findDeal(l); }); const facM = await facilitiesIndex(data); data.forEach(l => { l._fac = yesKeys(facM.get(String(l.id))); }); }
if (!data) { $("#results").innerHTML = '<div class="empty">Listings are taking a moment to load. Please refresh.</div>'; }
else { all = data; render(); }
