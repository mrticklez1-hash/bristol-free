import { fetchEvents, occurrences, AREAS, PRICE, listingUrl, eventUrl } from "./data.js";
import { fmtDay, fmtTime, hasTime, downloadIcs, calMenu } from "./event-cal.js";
import { $, esc, initHeader, safeUrl, ageText } from "./ui.js";
import { openSuggest } from "./suggest.js";

initHeader();
$("#wo-area").insertAdjacentHTML("beforeend", AREAS.map(a => `<option>${esc(a)}</option>`).join(""));
$("#suggest-event").addEventListener("click", () => openSuggest("event"));

const today = new Date(); today.setHours(0, 0, 0, 0);
const horizon = new Date(today); horizon.setDate(horizon.getDate() + 120);
const key = d => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

let all = [], picked = null, month = new Date(today.getFullYear(), today.getMonth(), 1);
try { all = occurrences(await fetchEvents(), today, horizon); }
catch { $("#wo-list").innerHTML = '<div class="empty">Events are taking a moment to load. Please refresh.</div>'; }

function filtered() {
  const area = $("#wo-area").value, age = $("#wo-age").value, free = $("#wo-free").checked;
  return all.filter(o => (!area || o.area === area) && (!age || (o.ages || []).includes(age)) && (!free || o.price_band === 0));
}

function renderCal(list) {
  const has = new Set(list.map(o => key(o.at)));
  const first = new Date(month), startPad = (first.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const canBack = month > new Date(today.getFullYear(), today.getMonth(), 1);
  let cells = "";
  for (let i = 0; i < startPad; i++) cells += "<span></span>";
  for (let d = 1; d <= days; d++) {
    const dt = new Date(month.getFullYear(), month.getMonth(), d), k = key(dt);
    const past = dt < today, on = picked && key(picked) === k;
    cells += `<button type="button" data-d="${dt.toISOString()}" class="${has.has(k) ? "has" : ""}${on ? " on" : ""}${k === key(today) ? " today" : ""}" ${past ? "disabled" : ""} aria-pressed="${on}" aria-label="${fmtDay(dt)}${has.has(k) ? ", has events" : ""}">${d}</button>`;
  }
  $("#cal").innerHTML = `<div class="cal-head"><button type="button" class="cal-nav" data-m="-1" ${canBack ? "" : "disabled"} aria-label="Previous month">‹</button><b>${month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</b><button type="button" class="cal-nav" data-m="1" aria-label="Next month">›</button></div>
    <div class="cal-grid"><i>M</i><i>T</i><i>W</i><i>T</i><i>F</i><i>S</i><i>S</i>${cells}</div>`;
}

/* ---------- add to calendar ---------- */
const shownOcc = [];
const pageOf = o => new URL(eventUrl(o, o.at), location.origin).href;
document.addEventListener("click", e => {
  const b = e.target.closest("[data-ics]"); if (!b) return;
  const o = shownOcc[+b.dataset.ics]; downloadIcs(o, pageOf(o)); b.closest("details").open = false;
});

const EV_TONES = ["mint", "lavender", "peach", "sky", "butter", "pink", "periwinkle"];
function eventRow(o, n = 0) {
  const web = safeUrl(o.website);
  const place = o.listing ? `<a href="${listingUrl(o.listing)}">${esc(o.venue || o.listing.name)}</a>` : esc(o.venue || "");
  const price = o.price_band === 0 ? '<span class="tagpill free">Free</span>' : `<span class="tagpill">${esc(o.price_note || PRICE[o.price_band])}</span>`;
  const img = safeUrl(o.image_url) || safeUrl(o.listing?.image_url);
  const page = eventUrl(o, o.at);
  return `<article class="ev ev-tone t-${EV_TONES[n % EV_TONES.length]}${n % 2 ? " ev-flip" : ""}">
    <a class="ev-media" href="${page}" tabindex="-1" aria-hidden="true"><div class="ev-img">${img ? `<img src="${esc(img)}" alt="" loading="lazy" decoding="async">` : '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#0F2A44" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M12 13.2l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L9.1 15.3l2-.3z"/></svg>'}</div>
    <div class="ev-date" aria-hidden="true"><b>${o.at.getDate()}</b><span>${o.at.toLocaleDateString("en-GB", { month: "short" })}</span></div></a>
    <div class="ev-body">
      <h3><a class="ev-link" href="${page}">${esc(o.title)}</a></h3>
      <span class="sub">${hasTime(o) ? `${fmtTime(o.at)}${o.end ? `–${fmtTime(o.end)}` : ""} · ` : ""}${place ? `${place} · ` : ""}${esc(o.area)}</span>
      ${o.description ? `<p>${esc(o.description)}</p>` : ""}
      <div class="ev-meta"><a class="ev-more" href="${page}">See details</a>${price}${o.ages?.length ? `<span class="note">${esc(ageText(o.ages))}</span>` : ""}${o.repeat_until ? '<span class="note">Every week</span>' : ""}${web ? `<a href="${esc(web)}" target="_blank" rel="noopener">More info</a>` : ""}
        ${calMenu(o, shownOcc.push(o) - 1, new URL(page, location.origin).href)}</div>
    </div></article>`;
}

function render() {
  const list = filtered();
  renderCal(list);
  const shown = picked ? list.filter(o => key(o.at) === key(picked)) : list.filter(o => o.at < new Date(today.getTime() + 31 * 86400000));
  $("#wo-clear").hidden = !picked;
  $("#wo-count").textContent = picked ? `${shown.length} on ${fmtDay(picked)}` : `${shown.length} coming up in the next month`;
  if (!shown.length) { $("#wo-list").innerHTML = `<div class="empty">${picked ? "Nothing listed for this day yet." : "Nothing listed yet for these filters."} Know of something? <button type="button" class="linkish" data-suggest>Tell us about it</button>.</div>`; return; }
  let html = "", lastDay = "", n = 0;
  for (const o of shown) {
    const d = fmtDay(o.at);
    if (d !== lastDay) { html += `<h2 class="ev-day">${key(o.at) === key(today) ? "Today · " : ""}${d}</h2>`; lastDay = d; }
    html += eventRow(o, n++);
  }
  $("#wo-list").innerHTML = html;
}

$("#cal").addEventListener("click", e => {
  const n = e.target.closest("[data-m]");
  if (n) { month = new Date(month.getFullYear(), month.getMonth() + +n.dataset.m, 1); return render(); }
  const b = e.target.closest("[data-d]"); if (!b) return;
  const d = new Date(b.dataset.d);
  picked = picked && key(picked) === key(d) ? null : d;
  render();
});
$("#wo-clear").addEventListener("click", () => { picked = null; render(); });
$("#wo-list").addEventListener("click", e => { if (e.target.closest("[data-suggest]")) openSuggest("event"); });
$("#wo-filters").addEventListener("change", render);
const qs = new URLSearchParams(location.search);
if (qs.get("area")) $("#wo-area").value = qs.get("area");
if (qs.get("free")) $("#wo-free").checked = true;
render();
