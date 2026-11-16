import { CATS, PRICE, AGES, DEMO, listingUrl } from "./data.js";

export const $ = s => document.querySelector(s);
export const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

const ICON = {
  play: "M5 20V6 M5 6h4 M9 6l8 14 M3 20h18 M5 11h4",
  classes: "M3 6c3-1.5 6-1.5 9 0v13c-3-1.5-6-1.5-9 0z M12 6c3-1.5 6-1.5 9 0v13c-3-1.5-6-1.5-9 0z",
  cafes: "M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z M17 10h1.5a2.5 2.5 0 0 1 0 5H17 M8 3c-1 1.5 1 2.5 0 4 M12 3c-1 1.5 1 2.5 0 4",
  parties: "M12 3a5 5 0 0 1 5 5c0 3.5-3 6.5-5 6.5S7 11.5 7 8a5 5 0 0 1 5-5z M11 16h2 M12 16c0 2-2 3-1 5",
  childcare: "M4 9h10a6 6 0 0 1-6 6H4z M14 9V4a5 5 0 0 1 5 5 M5.5 19a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0 M11.5 19a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0",
  health: "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z M12 10v5 M9.5 12.5h5",
  shops: "M5 8h14l-1 12H6z M9 8V6a3 3 0 0 1 6 0v2",
  sport: "M12 3a9 9 0 1 0 0.01 0z M3.5 9.5c4 1 13 1 17 0 M3.5 14.5c4-1 13-1 17 0 M12 3c-3 4-3 14 0 18",
  outdoors: "M12 3l-5 7h3l-4 6h12l-4-6h3z M12 16v5",
};
export const icon = cat => `<svg viewBox="0 0 24 24" fill="none" stroke="#0F2A44" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICON[cat] || ICON.play}"/></svg>`;

// "Little scene" placeholder for listings without a photo: sky, sun, two hills and the category icon.
export function scene(cat) {
  const c = CATS[cat] || CATS.play;
  const d = ICON[cat] || ICON.play;
  return `<svg class="scene" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="160" height="100" fill="${c.c}"/><circle cx="128" cy="40" r="9" fill="#fff" fill-opacity=".85"/><path d="M0 66 Q40 48 82 64 T160 56 V100 H0 Z" fill="${c.deep}" fill-opacity=".28"/><path d="M0 82 Q58 68 108 81 T160 77 V100 H0 Z" fill="#fff" fill-opacity=".75"/><g transform="translate(58 20) scale(1.8)"><path d="${d}" fill="none" stroke="#0F2A44" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></g></svg>`;
}

export const safeUrl = u => { if (!u) return ""; try { const x = new URL(u, location.href); return /^(https?:)$/.test(x.protocol) ? x.href : ""; } catch { return ""; } };

export function thumb(l) {
  const c = CATS[l.category] || CATS.play;
  const img = l.image_url ? `<img src="${esc(l.image_url)}" alt="" loading="lazy">` : scene(l.category);
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
        <a class="btn" href="${listingUrl(l)}">View full page</a>
        ${web ? `<a class="btn ghost" href="${esc(web)}" target="_blank" rel="noopener">Visit website</a>` : ""}
        <button type="button" class="btn ghost" data-share="${esc(listingUrl(l))}" data-title="${esc(l.name)}">Share</button>
      </div>
      ${l.photo_credit ? `<p class="note">${esc(l.photo_credit)}</p>` : ""}
      ${l.claimed ? "" : claimBlock(l)}
    </div>`;
  const m = $("#modal");
  m.classList.add("on");
  m.querySelector(".x").addEventListener("click", closeListing);
  m.querySelector(".x").focus();
  const f = m.querySelector("#claim-form");
  if (f) f.addEventListener("submit", e => onClaim && onClaim(e, l));
  m.querySelector("[data-share]")?.addEventListener("click", e => share(e.currentTarget));
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

/* share a listing: native share sheet on phones, copy link elsewhere */
export async function share(btn) {
  const url = new URL(btn.dataset.share, location.origin).href, title = btn.dataset.title || document.title;
  const label = btn.textContent;
  try {
    if (navigator.share) { await navigator.share({ title, text: `${title} on Bristol Free & Affordable`, url }); return; }
    await navigator.clipboard.writeText(url);
    btn.textContent = "Link copied!";
  } catch (e) {
    if (e?.name === "AbortError") return;
    btn.textContent = url;
  }
  setTimeout(() => { btn.textContent = label; }, 2000);
}
