import { addBasemap } from "./basemap.js";
import { fetchListings, AREAS, CATS, CAT_GROUPS, groupOf, listingCats, inCat, PRICE, dealIndex } from "./data.js";
import { $, card, initHeader, openListing, wireModal, esc, qrMark, favourites } from "./ui.js";
import { FACILITIES, FAC, facIcon, facilitiesIndex, yesKeys } from "./facilities.js";
import { handleClaim } from "./claim.js";
import { findPlace, findPostcode, fold } from "./places.js";

initHeader();
wireModal();

const params = new URLSearchParams(location.search);
$("#area").insertAdjacentHTML("beforeend", AREAS.map(a => `<option>${esc(a)}</option>`).join(""));
$("#q").value = params.get("q") || "";
$("#area").value = AREAS.includes(params.get("area")) ? params.get("area") : "";
$("#price").value = ["0", "1", "2", "3"].includes(params.get("price")) ? params.get("price") : "";
$("#age").value = ["baby", "toddler", "kids", "teen"].includes(params.get("age")) ? params.get("age") : "";
let activeCat = CATS[params.get("cat")] ? params.get("cat") : "";
// A heading (e.g. "Things to do") can be picked on its own; a category always implies its heading
let activeGroup = activeCat ? groupOf(activeCat)?.key || "" : (CAT_GROUPS.find(g => g.key === params.get("group"))?.key || "");
const groupCats = () => CAT_GROUPS.find(g => g.key === activeGroup)?.cats || [];

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
/* ---------- place search: "cafés in Bedminster" shows everything within a radius of Bedminster ---------- */
let origin = null, pcOrigin = null, pcFor = "", radius = null, placeInfo = null, ring = null;
const RADII = [1, 2, 5];
const stem = w => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w);
function textMatch(l, text) {
  const words = fold(text).split(/[^a-z0-9']+/).filter(w => w.length > 1).map(stem);
  if (!words.length) return true;
  const hay = fold(`${l.name} ${l.description || ""} ${listingCats(l).map(k => `${k} ${CATS[k].n}`).join(" ")} ${l.area}`);
  return words.every(w => hay.includes(w));
}
function readSearch() {
  const q = $("#q").value.trim();
  const pf = findPlace(q);
  if (pf) return { origin: pf.place, text: pf.rest };
  if (pcOrigin && pcFor === q) return { origin: pcOrigin, text: "" };
  return { origin: null, text: q };
}
function filtered() {
  const favs = favourites();
  const a = $("#area").value, p = $("#price").value, g = $("#age").value;
  const s = readSearch(); origin = s.origin;
  const base = all.filter(l =>
    (activeCat ? inCat(l, activeCat) : !activeGroup || groupCats().some(k => inCat(l, k))) && (!a || l.area === a) && (p === "" || l.price_band === +p) &&
    (!g || (l.ages || []).includes(g)) &&
    [...facSel].every(k => l._fac?.includes(k)) &&
    (!savedOnly || favs.has(String(l.id))) &&
    textMatch(l, s.text)
  );
  all.forEach(l => { l._from = undefined; });
  if (!origin) {
    placeInfo = null; setDistances();
    return base.sort(here
      ? (x, y) => (x._dist ?? 1e9) - (y._dist ?? 1e9) || x.name.localeCompare(y.name)
      : (x, y) => rank(y) - rank(x) || x.name.localeCompare(y.name));
  }
  const placed = base.filter(l => typeof l.lat === "number" && typeof l.lng === "number");
  placed.forEach(l => { l._dist = miles(origin, l); l._from = origin.n; });
  const start = origin.r || 1;
  const tries = radius ? [radius] : RADII.filter(r => r >= start);
  let used = tries[tries.length - 1], list = [];
  for (const r of tries) { list = placed.filter(l => l._dist <= r); used = r; if (list.length >= 3) break; }
  placeInfo = { name: origin.n, used, chosen: radius, widened: !radius && used > start, start, inStart: placed.filter(l => l._dist <= start).length,
                mobile: base.length - placed.length };
  return list.sort((x, y) => x._dist - y._dist || x.name.localeCompare(y.name));
}
const mi = r => `${r} mile${r === 1 ? "" : "s"}`;
function renderPlaceBar() {
  const bar = $("#place-bar");
  bar.hidden = !placeInfo;
  if (!placeInfo) return;
  const P = placeInfo;
  bar.innerHTML = `<div class="pb-row"><span class="pb-label"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" fill="currentColor"/></svg>Within</span>
    ${RADII.map(r => `<button type="button" class="chip${P.used === r ? " on" : ""}" data-radius="${r}" aria-pressed="${P.used === r}">${mi(r)}</button>`).join("")}
    <span class="pb-of">of <b>${esc(P.name)}</b></span><button type="button" class="pb-clear" id="pb-clear">Clear</button></div>
    ${P.widened ? `<p class="pb-note">${P.inStart ? `Only ${P.inStart}` : "Nothing"} within ${mi(P.start)} of ${esc(P.name)}, so we're showing everything within ${mi(P.used)}.</p>` : ""}
    ${P.mobile ? `<p class="pb-note">Plus ${P.mobile} that come to you, such as entertainers, not shown on the map.</p>` : ""}`;
  bar.querySelectorAll("[data-radius]").forEach(b => b.addEventListener("click", () => { radius = +b.dataset.radius; render(); }));
  $("#pb-clear").addEventListener("click", () => { $("#q").value = readSearch().text; pcOrigin = null; radius = null; render(); });
}
function drawRing() {
  if (!map || !window.L) return;
  if (ring) { map.removeLayer(ring); ring = null; }
  if (!origin || !placeInfo) return;
  ring = L.layerGroup([
    L.circle([origin.lat, origin.lng], { radius: placeInfo.used * 1609.34, color: "#2F6FED", weight: 2, fillColor: "#2F6FED", fillOpacity: .06, dashArray: "6 6", interactive: false }),
    L.circleMarker([origin.lat, origin.lng], { radius: 6, color: "#fff", weight: 2, fillColor: "#2F6FED", fillOpacity: 1 }).bindTooltip(origin.n),
  ]).addTo(map);
  map.fitBounds(L.latLng(origin.lat, origin.lng).toBounds(placeInfo.used * 1609.34 * 2), { padding: [20, 20] });
}
// postcodes (BS3, BS3 4AA) are looked up as you type, then act like a place
let pcTimer = null;
$("#q").addEventListener("input", () => {
  radius = null;
  const q = $("#q").value.trim();
  clearTimeout(pcTimer);
  if (/^[A-Za-z]{1,2}\d[A-Za-z\d]?( ?\d[A-Za-z]{2})?$/.test(q)) pcTimer = setTimeout(async () => {
    const o = await findPostcode(q);
    if (o && $("#q").value.trim() === q) { pcOrigin = o; pcFor = q; render(); }
  }, 350);
});
function renderChips() {
  const chip = (attr, on, label) => `<button type="button" class="chip${on ? " on" : ""}" ${attr} aria-pressed="${on}">${esc(label)}</button>`;
  $("#chips").innerHTML = chip('data-group=""', !activeGroup, "All") +
    CAT_GROUPS.map(g => chip(`data-group="${g.key}"`, activeGroup === g.key, g.n)).join("");
  const sub = $("#subchips");
  sub.hidden = !activeGroup;
  sub.innerHTML = activeGroup ? chip('data-cat=""', !activeCat, "Everything") +
    groupCats().map(k => chip(`data-cat="${k}"`, activeCat === k, CATS[k].n)).join("") : "";
}
function syncUrl() {
  const u = new URLSearchParams();
  if ($("#q").value.trim()) u.set("q", $("#q").value.trim());
  if ($("#area").value) u.set("area", $("#area").value);
  if ($("#price").value) u.set("price", $("#price").value);
  if ($("#age").value) u.set("age", $("#age").value);
  if (activeCat) u.set("cat", activeCat); else if (activeGroup) u.set("group", activeGroup);
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
  renderMap(list); renderPlaceBar(); drawRing(); syncUrl();
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
$("#chips").addEventListener("click", e => { const b = e.target.closest("[data-group]"); if (!b) return; activeGroup = b.dataset.group; activeCat = ""; renderChips(); render(); });
$("#subchips").addEventListener("click", e => { const b = e.target.closest("[data-cat]"); if (!b) return; activeCat = b.dataset.cat; renderChips(); render(); });
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
// arrived from "Use my location" on the home page: start Near me straight away
if (data && params.get("near") === "1" && !here) {
  nearBtn.click();
  const u = new URL(location.href); u.searchParams.delete("near"); history.replaceState(null, "", u);
}
