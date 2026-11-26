import { addBasemap } from "./basemap.js";
import { fetchEvent, fetchEvents, occurrences, PRICE, listingUrl, eventUrl } from "./data.js";
import { $, esc, initHeader, ageText, safeUrl, share } from "./ui.js";
import { fmtDay, fmtTime, hasTime, downloadIcs, calMenu, eventCard } from "./event-cal.js";

initHeader();

const slug = decodeURIComponent((location.pathname.match(/\/event\/([^/?#]+)/) || [])[1] || new URLSearchParams(location.search).get("e") || "");
const wanted = new URLSearchParams(location.search).get("d"); // which week of a weekly event was clicked
const now = new Date();
const dayKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const CAL_ICON = '<svg viewBox="0 0 24 24" width="80" height="80" fill="none" stroke="#0F2A44" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M12 13.2l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L9.1 15.3l2-.3z"/></svg>';

// a few other events coming up, for the bottom of the page and the "finished" message
async function moreEvents(exceptId) {
  try {
    const week2 = new Date(now.getTime() + 14 * 86400000);
    const seen = new Set();
    const list = occurrences(await fetchEvents(), now, week2).filter(o => o.id !== exceptId && !seen.has(o.id) && seen.add(o.id)).slice(0, 4);
    if (!list.length) return "";
    return `<section class="block"><div class="sec-head"><div><h2>Also coming up</h2><p>More family events in the next two weeks.</p></div><a class="more" href="/whats-on.html">See the calendar</a></div>
      <div class="ev-cards">${list.map(eventCard).join("")}</div></section>`;
  } catch { return ""; }
}

async function finished(msg) {
  document.title = "Event finished · Bristol Free & Affordable";
  $("#crumb").textContent = "Finished";
  $("#lp-loading").outerHTML = `<div class="panel ev-gone"><h1>This event has finished</h1><p>${msg}</p><a class="btn" href="/whats-on.html">See what's on</a></div><div id="ev-more"></div>`;
  $("#ev-more").innerHTML = await moreEvents(null);
}

function setMeta(e, page) {
  document.title = `${e.title} · What's on · Bristol Free & Affordable`;
  const desc = (e.description || `${e.title} in ${e.area}`).slice(0, 160);
  document.querySelector('meta[name="description"]')?.setAttribute("content", desc);
  const link = document.createElement("link"); link.rel = "canonical"; link.href = page; document.head.append(link);
}

// where to put the pin: the linked venue's pin, or the event's postcode looked up on postcodes.io
async function pinFor(e) {
  const l = e.listing;
  if (l && typeof l.lat === "number") return { lat: l.lat, lng: l.lng, exact: !!(l.address || l.postcode) };
  const pc = e.postcode || l?.postcode;
  if (!pc) return null;
  try {
    const r = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`);
    const j = await r.json();
    return j.result ? { lat: j.result.latitude, lng: j.result.longitude, exact: true } : null;
  } catch { return null; }
}

async function addMap(e) {
  const pin = await pinFor(e);
  if (!pin) return;
  $("#ev-map-wrap").hidden = false;
  try {
    if (!window.L) await new Promise((res, rej) => { const s = document.createElement("script"); s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; s.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="; s.crossOrigin = ""; s.onload = res; s.onerror = rej; document.head.append(s); });
    const map = L.map("lp-map", { scrollWheelZoom: false, maxZoom: 19 }).setView([pin.lat, pin.lng], pin.exact ? 15 : 12);
    addBasemap(map);
    L.marker([pin.lat, pin.lng], { title: e.venue || e.title, alt: e.venue || e.title }).addTo(map);
  } catch { $("#lp-map").innerHTML = '<div class="empty" style="height:100%;display:grid;place-items:center">The map couldn\'t load.</div>'; }
}

function bigPhoto(src, alt) {
  const m = $("#modal"), last = document.activeElement;
  $("#sheet").className = "sheet photo-sheet";
  $("#sheet").innerHTML = `<button class="x" aria-label="Close">✕</button><img src="${esc(src)}" alt="${esc(alt)}"><h2 id="m-title" class="sr">${esc(alt)}</h2>`;
  m.classList.add("on");
  const close = () => { m.classList.remove("on"); $("#sheet").className = "sheet"; last?.focus?.(); };
  $("#sheet .x").addEventListener("click", close); $("#sheet .x").focus();
  m.onclick = ev => { if (ev.target === m) close(); };
  document.addEventListener("keydown", function k(ev) { if (ev.key === "Escape") { close(); document.removeEventListener("keydown", k); } });
}

async function start() {
  if (!slug) return finished("We couldn't find that event.");
  let e;
  try { e = await fetchEvent(slug); } catch { e = null; }
  if (!e) return finished("It may have finished, moved or been taken down. Here's what else is on.");

  // every date this event happens (one, or each week until repeat_until)
  const all = occurrences([e], new Date(e.starts_at), new Date(e.repeat_until ? e.repeat_until + "T23:59:59" : e.starts_at));
  const upcoming = all.filter(o => (o.end || new Date(o.at.getTime() + 3600000)) >= now);
  const o = (wanted && upcoming.find(x => dayKey(x.at) === wanted)) || upcoming[0] || all[all.length - 1];
  const over = !upcoming.length;

  const page = new URL(eventUrl(e, e.repeat_until ? o.at : null), location.origin).href;
  setMeta(e, new URL(eventUrl(e), location.origin).href);
  $("#crumb").textContent = e.title;

  const img = safeUrl(e.image_url) || safeUrl(e.listing?.image_url);
  const web = safeUrl(e.website);
  const venue = e.venue || e.listing?.name;
  const venueHtml = e.listing ? `<a href="${listingUrl(e.listing)}">${esc(venue)}</a>` : esc(venue || "");
  const time = hasTime(o) ? `${fmtTime(o.at)}${o.end ? ` to ${fmtTime(o.end)}` : ""}` : "";
  const price = e.price_band === 0 ? "Free" : (e.price_note || PRICE[e.price_band]);
  const until = e.repeat_until ? new Date(e.repeat_until + "T12:00:00") : null;
  const weekday = o.at.toLocaleDateString("en-GB", { weekday: "long" });
  const nextDates = upcoming.filter(x => x !== o).slice(0, 5);
  const wa = `https://wa.me/?text=${encodeURIComponent(`${e.title}, ${fmtDay(o.at)}: ${page}`)}`;

  $("#lp-loading").outerHTML = `
  <article class="lp-grid ev-page">
    <div class="lp-main">
      <div class="lp-hero ev-hero t-mint${img ? "" : " ev-noimg"}">
        ${img ? `<button type="button" class="ev-zoom" aria-label="See the photo bigger"><img src="${esc(img)}" alt="${esc(e.title)}"><span class="ev-zoom-tag" aria-hidden="true">Tap to enlarge</span></button>` : CAL_ICON}
        <div class="ev-date ev-date-big" aria-hidden="true"><b>${o.at.getDate()}</b><span>${o.at.toLocaleDateString("en-GB", { month: "short" })}</span></div>
        <span class="tagpill ${e.price_band === 0 ? "free" : ""}">${esc(price)}</span>
      </div>
      ${e.photo_credit && e.image_url ? `<p class="note" style="margin-top:6px">${esc(e.photo_credit)}</p>` : ""}
      ${over ? `<div class="ev-over" role="status"><b>This event has finished.</b> <a href="/whats-on.html">See what's on now</a></div>` : ""}
      <span class="sub" style="font-weight:700;color:#1C5C8C;display:block;margin-top:18px">${until ? `Every ${weekday}` : fmtDay(o.at)}${time ? ` · ${time}` : ""} · ${esc(e.area)}</span>
      <h1 class="lp-title">${esc(e.title)}</h1>
      ${e.description ? `<p class="lp-desc">${esc(e.description).replace(/\n/g, "<br>")}</p>` : ""}
      <div class="lp-actions">
        ${over ? "" : calMenu(o, 0, page)}
        ${web ? `<a class="btn ghost" href="${esc(web)}" target="_blank" rel="noopener">More info</a>` : ""}
        <a class="btn ghost wa-btn" href="${wa}" target="_blank" rel="noopener"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#25D366" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Z"/><path fill="#fff" d="M17.2 14.5c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.1l-.9 1.1c-.2.2-.3.2-.6.1a7.8 7.8 0 0 1-3.9-3.4c-.3-.5.3-.5.8-1.6.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.5-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4 3.4 3.4 0 0 0-1 2.5 5.9 5.9 0 0 0 1.2 3.1 13.4 13.4 0 0 0 5.2 4.6c1.9.8 2.7.9 3.6.7a3.1 3.1 0 0 0 2-1.4 2.5 2.5 0 0 0 .2-1.4c-.1-.1-.3-.2-.6-.3Z"/></svg>WhatsApp</a>
        <button type="button" class="btn" id="ev-share" data-share="${esc(page)}" data-title="${esc(e.title)}">Share</button>
      </div>
    </div>
    <aside class="lp-side">
      <div class="panel lp-facts">
        <h2>Good to know</h2>
        <dl>
          <dt>When</dt><dd>${until ? `Every ${weekday}${time ? `, ${time}` : ""}<br><span class="note">Until ${until.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</span>` : `${fmtDay(o.at)}${time ? `<br>${time}` : ""}`}</dd>
          ${venue ? `<dt>Where</dt><dd>${venueHtml}${e.postcode ? `<br>${esc(e.postcode)}` : ""}</dd>` : ""}
          <dt>Area</dt><dd>${esc(e.area)}</dd>
          <dt>Price</dt><dd>${esc(price)}</dd>
          ${e.ages?.length ? `<dt>Ages</dt><dd>${esc(ageText(e.ages))}</dd>` : ""}
        </dl>
        ${nextDates.length ? `<h3 class="ev-next-h">Next dates</h3><div class="chips ev-next">${nextDates.map(x => `<a class="chip" href="${eventUrl(e, x.at)}">${x.at.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</a>`).join("")}</div>` : ""}
        <p class="note">Details can change, so check before you go${web ? " using the More info link" : ""}.</p>
      </div>
      <div id="ev-map-wrap" hidden><div id="lp-map" class="lp-map" role="region" aria-label="Map"></div></div>
    </aside>
  </article>
  <div id="ev-more"></div>`;

  $("#ev-share").addEventListener("click", ev => share(ev.currentTarget));
  $(".ev-zoom")?.addEventListener("click", () => bigPhoto(img, e.title));
  document.addEventListener("click", ev => {
    const b = ev.target.closest("[data-ics]"); if (!b) return;
    downloadIcs(o, page); b.closest("details").open = false;
  });
  addMap(e);
  $("#ev-more").innerHTML = await moreEvents(e.id);
}

start();
