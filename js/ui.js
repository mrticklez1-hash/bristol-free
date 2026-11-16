import { CATS, PRICE, AGES, DEMO } from "./data.js";

export const $ = s => document.querySelector(s);
export const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

const ICON = {
  play: "M4 20V9l8-5 8 5v11M9 20v-6h6v6",
  classes: "M12 3l9 5-9 5-9-5 9-5zM6 10.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-5.5",
  cafes: "M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8zM16 10h2a3 3 0 0 1 0 6h-2M8 3v2M12 3v2",
  parties: "M4 20l5-14 9 9-14 5zM14 4l1 2M19 9l2-1M17 3l-1 3",
  childcare: "M12 21c-4 0-7-3-7-7 0-2 1-4 3-5M12 21c4 0 7-3 7-7 0-2-1-4-3-5M9 5a3 3 0 0 1 6 0",
  health: "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z",
  shops: "M5 8h14l-1 12H6L5 8zM9 8V6a3 3 0 0 1 6 0v2",
  sport: "M2 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0M14 5a1.5 1.5 0 1 0 0 .01M8 12l3-4 4 2",
  outdoors: "M12 21v-6M7 15h10l-5-11zM8 10h8",
};
export const icon = cat => `<svg viewBox="0 0 24 24" fill="none" stroke="#0F2A44" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICON[cat] || ICON.play}"/></svg>`;

export const safeUrl = u => { if (!u) return ""; try { const x = new URL(u, location.href); return /^(https?:)$/.test(x.protocol) ? x.href : ""; } catch { return ""; } };

export function thumb(l) {
  const c = CATS[l.category] || CATS.play;
  const img = l.image_url ? `<img src="${esc(l.image_url)}" alt="" loading="lazy">` : icon(l.category);
  const price = l.price_band === 0 ? '<span class="tagpill free">Free</span>' : `<span class="tagpill">${PRICE[l.price_band] ?? ""}</span>`;
  return `<div class="thumb" style="background:${c.c}">${img}${price}${l.featured ? '<span class="tagpill feat">Featured</span>' : ""}</div>`;
}

export function card(l) {
  const c = CATS[l.category] || CATS.play;
  return `<button class="card" data-id="${esc(l.id)}">${thumb(l)}<div class="body"><h3>${esc(l.name)}</h3><span class="sub">${esc(l.area)} · ${c.n}</span>${l.claimed ? "" : '<span class="unclaimed">Free listing · unclaimed</span>'}</div></button>`;
}

export const ageText = a => (a || []).map(x => AGES[x] || x).join(", ");

export function initHeader() {
  const burger = $(".burger"), links = $(".links");
  burger?.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    burger.setAttribute("aria-expanded", String(open));
  });
  if (DEMO) document.body.insertAdjacentHTML("afterbegin", '<div class="demo-bar"><b>Demo mode</b> · showing sample listings until the database is connected.</div>');
}

/* ---------- listing modal + claim form ---------- */
let lastFocus = null;
export function openListing(l, { onClaim } = {}) {
  lastFocus = document.activeElement;
  const c = CATS[l.category] || CATS.play;
  const web = safeUrl(l.website);
  const dir = l.lat && l.lng ? `https://www.openstreetmap.org/?mlat=${l.lat}&mlon=${l.lng}#map=17/${l.lat}/${l.lng}` : "";
  $("#sheet").innerHTML = `
    <button class="x" aria-label="Close">✕</button>${thumb(l)}
    <div class="in">
      <span class="sub" style="font-weight:700;color:#1C5C8C">${c.n}</span>
      <h2 id="m-title">${esc(l.name)}</h2>
      ${l.description ? `<p>${esc(l.description)}</p>` : ""}
      <div class="facts">
        <div><b>Area:</b> ${esc(l.area)}${l.address ? ` · ${esc(l.address)}` : ""}${l.postcode ? ` ${esc(l.postcode)}` : ""}</div>
        <div><b>Price:</b> ${PRICE[l.price_band] ?? ""}</div>
        ${l.ages?.length ? `<div><b>Ages:</b> ${esc(ageText(l.ages))}</div>` : ""}
        ${l.opening_hours ? `<div><b>Opening hours:</b> ${esc(l.opening_hours)}</div>` : ""}
        ${l.phone ? `<div><b>Phone:</b> ${esc(l.phone)}</div>` : ""}
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        ${web ? `<a class="btn" href="${esc(web)}" target="_blank" rel="noopener">Visit website</a>` : ""}
        ${dir ? `<a class="btn ghost" href="${dir}" target="_blank" rel="noopener">Open in map</a>` : ""}
      </div>
      ${l.claimed ? "" : claimBlock(l)}
    </div>`;
  const m = $("#modal");
  m.classList.add("on");
  m.querySelector(".x").addEventListener("click", closeListing);
  m.querySelector(".x").focus();
  const f = m.querySelector("#claim-form");
  if (f) f.addEventListener("submit", e => onClaim && onClaim(e, l));
  const t = m.querySelector("#claim-toggle");
  if (t) t.addEventListener("click", () => { f.hidden = false; t.hidden = true; f.querySelector("input[name=contact_name]").focus(); });
}

function claimBlock(l) {
  return `<div class="claim">
    <div><b>Is this your business?</b><div class="note">This free listing was added from public information. Claim it to update the details, or ask us to remove it.</div></div>
    <button class="btn ghost" id="claim-toggle" type="button">Claim this listing</button>
    <form id="claim-form" hidden novalidate>
      <input class="hp" name="website_hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="two">
        <label class="field">Your name<input name="contact_name" required maxlength="200" autocomplete="name"></label>
        <label class="field">Email<input name="email" type="email" required maxlength="320" autocomplete="email"></label>
      </div>
      <label class="field" style="margin-top:10px">Phone (optional)<input name="phone" maxlength="50" autocomplete="tel"></label>
      <label class="field" style="margin-top:10px">Anything to change? (optional)<textarea name="message" rows="3" maxlength="2000"></textarea></label>
      <p class="err" role="alert" hidden></p>
      <button class="btn" style="margin-top:10px;width:100%">Send claim request</button>
    </form>
  </div>`;
}

export function closeListing() {
  $("#modal").classList.remove("on");
  lastFocus?.focus?.();
}

export function wireModal() {
  $("#modal").addEventListener("click", e => { if (e.target.id === "modal") closeListing(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && $("#modal").classList.contains("on")) closeListing(); });
}

export function readForm(f) {
  const d = Object.fromEntries(new FormData(f).entries());
  for (const k in d) d[k] = String(d[k]).trim();
  return d;
}
export const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
