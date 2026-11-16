import { fetchListing, fetchListings, CATS, PRICE, slugify, listingUrl } from "./data.js";
import { $, esc, icon, scene, card, initHeader, wireModal, openListing, ageText, safeUrl, share } from "./ui.js";
import { handleClaim } from "./claim.js";

initHeader();
wireModal();

const slug = decodeURIComponent((location.pathname.match(/\/place\/([^/?#]+)/) || [])[1] || new URLSearchParams(location.search).get("p") || "");

function notFound() {
  document.title = "Place not found · Bristol Free & Affordable";
  $("#crumb").textContent = "Not found";
  $("#lp-loading").outerHTML = `<div class="empty" style="margin:30px 0">We couldn't find that place. It may have moved or been removed.<br><br><a class="btn" href="/directory.html">Browse things to do</a></div>`;
}

const km = (a, b) => {
  const R = 6371, t = x => x * Math.PI / 180;
  const dLat = t(b.lat - a.lat), dLng = t(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(t(a.lat)) * Math.cos(t(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

function setMeta(l) {
  const title = `${l.name} · ${l.area} · Bristol Free & Affordable`;
  document.title = title;
  const desc = (l.description || `${l.name} in ${l.area}`).slice(0, 160);
  let m = document.querySelector('meta[name="description"]');
  if (m) m.setAttribute("content", desc);
  const link = document.createElement("link");
  link.rel = "canonical"; link.href = new URL(listingUrl(l), location.origin).href;
  document.head.append(link);
}

async function addMap(l) {
  if (typeof l.lat !== "number") return;
  try {
    if (!window.L) await new Promise((res, rej) => { const s = document.createElement("script"); s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; s.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="; s.crossOrigin = ""; s.onload = res; s.onerror = rej; document.head.append(s); });
    const approx = !l.address && !l.postcode;
    const map = L.map("lp-map", { scrollWheelZoom: false }).setView([l.lat, l.lng], approx ? 12 : 15);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
    L.marker([l.lat, l.lng], { title: l.name, alt: l.name }).addTo(map);
  } catch { $("#lp-map").innerHTML = '<div class="empty" style="height:100%;display:grid;place-items:center">The map couldn\'t load.</div>'; }
}

async function start() {
  if (!slug) return notFound();
  let l;
  try { l = await fetchListing(slug); } catch { l = null; }
  if (!l) return notFound();
  setMeta(l);

  const c = CATS[l.category] || CATS.play;
  const web = safeUrl(l.website);
  const hasPin = typeof l.lat === "number";
  const approx = hasPin && !l.address && !l.postcode; // pin marks the area covered, not a venue
  const directions = hasPin && !approx ? `https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}` : (l.postcode ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(l.postcode)}` : "");
  $("#crumb").textContent = l.name;

  $("#lp-loading").outerHTML = `
  <article class="lp-grid">
    <div class="lp-main">
      <div class="lp-hero" style="background:${c.c}">
        ${l.image_url ? `<img src="${esc(l.image_url)}" alt="${esc(l.name)}">` : scene(l.category)}
        <span class="tagpill ${l.price_band === 0 ? "free" : ""}">${PRICE[l.price_band] ?? ""}</span>
        ${l.featured ? '<span class="tagpill feat">Featured</span>' : ""}
      </div>
      ${l.photo_credit ? `<p class="note" style="margin-top:6px">${esc(l.photo_credit)}</p>` : ""}
      <span class="sub" style="font-weight:700;color:#1C5C8C;display:block;margin-top:18px">${esc(c.n)} · ${esc(l.area)}</span>
      <h1 class="lp-title">${esc(l.name)}</h1>
      ${l.description ? `<p class="lp-desc">${esc(l.description)}</p>` : ""}
      <div class="lp-actions">
        ${directions ? `<a class="btn" href="${directions}" target="_blank" rel="noopener">Get directions</a>` : ""}
        ${web ? `<a class="btn ghost" href="${esc(web)}" target="_blank" rel="noopener">Visit website</a>` : ""}
        <button type="button" class="btn ghost" id="lp-share" data-share="${esc(listingUrl(l))}" data-title="${esc(l.name)}">Share</button>
      </div>
      <div id="lp-claim"></div>
    </div>
    <aside class="lp-side">
      <div class="panel lp-facts">
        <h2>Good to know</h2>
        <dl>
          <dt>Price</dt><dd>${PRICE[l.price_band] ?? ""}</dd>
          ${l.ages?.length ? `<dt>Ages</dt><dd>${esc(ageText(l.ages))}</dd>` : ""}
          ${l.opening_hours ? `<dt>Opening hours</dt><dd>${esc(l.opening_hours)}</dd>` : ""}
          ${l.address || l.postcode ? `<dt>Address</dt><dd>${esc([l.address, l.area, l.postcode].filter(Boolean).join(", "))}</dd>` : `<dt>Area</dt><dd>${esc(l.area)}</dd>`}
          ${l.phone ? `<dt>Phone</dt><dd>${esc(l.phone)}</dd>` : ""}
        </dl>
        <p class="note">Details can change, so check before you travel.</p>
      </div>
      ${hasPin ? `<div id="lp-map" class="lp-map" role="region" aria-label="Map"></div>${approx ? '<p class="note" style="margin-top:6px">Pin shows the area they cover, not a venue.</p>' : ""}` : ""}
    </aside>
  </article>
  <section class="block" id="nearby-wrap" hidden>
    <div class="sec-head"><div><h2>More nearby</h2><p>Other places close to ${esc(l.name)}.</p></div><a class="more" href="/directory.html?area=${encodeURIComponent(l.area)}">More in ${esc(l.area)}</a></div>
    <div class="grid" id="nearby"></div>
  </section>`;

  $("#lp-share").addEventListener("click", e => share(e.currentTarget));

  if (!l.claimed) {
    const box = document.createElement("div");
    box.innerHTML = `<div class="claim" style="margin-top:22px">
      <div><b>Is this your business?</b><div class="note">This free listing was added from public information. Claim it to update the details, or ask us to remove it.</div></div>
      <button class="btn ghost" type="button" id="claim-open">Claim this listing</button></div>`;
    $("#lp-claim").append(box);
    $("#claim-open").addEventListener("click", () => openListing(l, { onClaim: handleClaim }));
  }

  addMap(l);

  // nearby: closest published listings, falling back to the same area
  try {
    const all = (await fetchListings()).filter(x => x.id !== l.id);
    let near = hasPin
      ? all.filter(x => typeof x.lat === "number").map(x => ({ x, d: km(l, x) })).sort((a, b) => a.d - b.d).slice(0, 4).map(o => o.x)
      : all.filter(x => x.area === l.area).slice(0, 4);
    if (near.length) {
      $("#nearby").innerHTML = near.map(card).join("");
      $("#nearby-wrap").hidden = false;
      $("#nearby").addEventListener("click", e => {
        const b = e.target.closest(".card[data-id]"); if (!b) return;
        const n = near.find(x => String(x.id) === b.dataset.id);
        if (n) location.href = listingUrl(n);
      });
    }
  } catch { /* nearby is optional */ }
}

start();
