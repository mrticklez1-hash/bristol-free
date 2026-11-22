import { fetchEvents, occurrences, AREAS, PRICE, listingUrl } from "./data.js";
import { $, esc, initHeader, safeUrl, ageText } from "./ui.js";
import { openSuggest } from "./suggest.js";

initHeader();
$("#wo-area").insertAdjacentHTML("beforeend", AREAS.map(a => `<option>${esc(a)}</option>`).join(""));
$("#suggest-event").addEventListener("click", () => openSuggest("event"));

const today = new Date(); today.setHours(0, 0, 0, 0);
const horizon = new Date(today); horizon.setDate(horizon.getDate() + 120);
const key = d => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const fmtDay = d => d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
const fmtTime = d => { const h = d.getHours(), m = d.getMinutes(); return `${h % 12 || 12}${m ? ":" + String(m).padStart(2, "0") : ""}${h < 12 ? "am" : "pm"}`; };

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
const pad = n => String(n).padStart(2, "0");
const icsTime = d => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
const endOf = o => o.end || new Date(o.at.getTime() + 60 * 60 * 1000);
const where = o => [o.venue || o.listing?.name, o.area].filter(Boolean).join(", ");
function gcalUrl(o) {
  const p = new URLSearchParams({ action: "TEMPLATE", text: o.title, dates: `${icsTime(o.at)}/${icsTime(endOf(o))}`, details: [o.description, o.website].filter(Boolean).join("\n\n"), location: where(o) });
  return `https://calendar.google.com/calendar/render?${p}`;
}
function icsEscape(s) { return String(s || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1"); }
function downloadIcs(o) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Bristol Free & Affordable//EN", "BEGIN:VEVENT",
    `UID:${o.id || "ev"}-${icsTime(o.at)}@bristolfree`, `DTSTAMP:${icsTime(new Date())}`, `DTSTART:${icsTime(o.at)}`, `DTEND:${icsTime(endOf(o))}`,
    `SUMMARY:${icsEscape(o.title)}`, `LOCATION:${icsEscape(where(o))}`, `DESCRIPTION:${icsEscape([o.description, o.website].filter(Boolean).join("\n\n"))}`,
    "END:VEVENT", "END:VCALENDAR"];
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
  a.download = (o.title || "event").replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".ics"; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-ics]"); if (!b) return;
  downloadIcs(shownOcc[+b.dataset.ics]); b.closest("details").open = false;
});

const EV_TONES = ["mint", "lavender", "peach", "sky", "butter", "pink", "periwinkle"];
function eventRow(o, n = 0) {
  const web = safeUrl(o.website);
  const place = o.listing ? `<a href="${listingUrl(o.listing)}">${esc(o.venue || o.listing.name)}</a>` : esc(o.venue || "");
  const price = o.price_band === 0 ? '<span class="tagpill free">Free</span>' : `<span class="tagpill">${esc(o.price_note || PRICE[o.price_band])}</span>`;
  const img = safeUrl(o.image_url) || safeUrl(o.listing?.image_url);
  return `<article class="ev ev-tone t-${EV_TONES[n % EV_TONES.length]}${n % 2 ? " ev-flip" : ""}">
    <div class="ev-media"><div class="ev-img">${img ? `<img src="${esc(img)}" alt="" loading="lazy" decoding="async">` : '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#0F2A44" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/><path d="M12 13.2l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L9.1 15.3l2-.3z"/></svg>'}</div>
    <div class="ev-date" aria-hidden="true"><b>${o.at.getDate()}</b><span>${o.at.toLocaleDateString("en-GB", { month: "short" })}</span></div></div>
    <div class="ev-body">
      <h3>${esc(o.title)}</h3>
      <span class="sub">${fmtTime(o.at)}${o.end ? `–${fmtTime(o.end)}` : ""}${place ? ` · ${place}` : ""} · ${esc(o.area)}</span>
      ${o.description ? `<p>${esc(o.description)}</p>` : ""}
      <div class="ev-meta">${price}${o.ages?.length ? `<span class="note">${esc(ageText(o.ages))}</span>` : ""}${o.repeat_until ? '<span class="note">Every week</span>' : ""}${web ? `<a href="${esc(web)}" target="_blank" rel="noopener">More info</a>` : ""}
        <details class="dir cal-add"><summary class="linkish">Add to my calendar</summary><div class="dir-menu" role="menu">
          <button type="button" role="menuitem" data-ics="${shownOcc.push(o) - 1}">Apple or Outlook calendar</button>
          <a role="menuitem" href="${gcalUrl(o)}" target="_blank" rel="noopener">Google Calendar</a></div></details></div>
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
