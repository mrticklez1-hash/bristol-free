import { CATS, PRICE, AGES, DEMO, listingUrl, dealIndex, wishCounts, myWishes, toggleWish } from "./data.js";
import { fillFacilities, facBubble } from "./facilities.js";

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
  return `<button class="card" data-id="${esc(l.id)}">${thumb(l)}<div class="body"><h3>${esc(l.name)}</h3><span class="sub">${esc(l.area)} · ${c.n}</span>${typeof l._dist === "number" ? `<span class="dist">${distText(l._dist)}${!l.address && !l.postcode ? " · area they cover" : ""}</span>` : ""}${l._fac?.length ? `<span class="card-fac">${l._fac.slice(0, 4).map(k => facBubble(k, 28, 16)).join("")}${l._fac.length > 4 ? `<b>+${l._fac.length - 4}</b>` : ""}</span>` : ""}${l._deal ? `<span class="card-deal">${qrMark(18)}Family card deal</span>` : ""}${l.claimed ? "" : '<span class="unclaimed">Free listing · unclaimed</span>'}</div></button>`;
}

export function distText(mi) {
  if (mi < 0.1) return "Under 0.1 miles away";
  return `${mi < 10 ? mi.toFixed(1) : Math.round(mi)} miles away`;
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


/* tap-to-call: turns "0117 379 0979" into tel:+441173790979 */
export function telHref(phone) {
  const raw = String(phone || "").trim();
  let d = raw.replace(/[^\d+]/g, "");
  if (d.startsWith("00")) d = "+" + d.slice(2);
  else if (d.startsWith("0")) d = "+44" + d.slice(1);
  return d.replace(/\D/g, "").length >= 9 ? "tel:" + d : "";
}
export function phoneHtml(phone) {
  const t = telHref(phone);
  return t ? `<a href="${t}" class="tel">${esc(phone)}</a>` : esc(phone);
}
/* Google reviews link: not shown for parks and outdoor spots, or when we can't pin down the place */
export function reviewsUrl(l) {
  if (!l || l.category === "outdoors") return "";
  const pid = l.google_place_id && String(l.google_place_id).trim();
  if (!pid && !l.postcode) return "";
  const q = encodeURIComponent([l.name, l.postcode || l.area].filter(Boolean).join(" "));
  return `https://www.google.com/maps/search/?api=1&query=${q}${pid ? `&query_place_id=${encodeURIComponent(pid)}` : ""}`;
}


/* Directions: pick Google Maps, Apple Maps or Waze, or copy the postcode for a car satnav.
   Only for listings with a real address or postcode (not mobile businesses). */
export function directionsMenu(l, label = "Get directions") {
  if (!l || (!l.address && !l.postcode)) return "";
  const exact = typeof l.lat === "number" && typeof l.lng === "number";
  const dest = exact ? `${l.lat},${l.lng}` : l.postcode;
  if (!dest) return "";
  const d = encodeURIComponent(dest);
  const links = [
    ["Google Maps", `https://www.google.com/maps/dir/?api=1&destination=${d}`],
    ["Apple Maps", `https://maps.apple.com/?daddr=${d}&dirflg=d`],
    ["Waze", exact ? `https://waze.com/ul?ll=${d}&navigate=yes` : `https://waze.com/ul?q=${d}&navigate=yes`],
  ];
  return `<details class="dir"><summary class="btn">${esc(label)}</summary><div class="dir-menu" role="menu">
    ${links.map(([n, u]) => `<a role="menuitem" href="${u}" target="_blank" rel="noopener">${n}</a>`).join("")}
    ${l.postcode ? `<button type="button" role="menuitem" data-copy="${esc(l.postcode)}">Copy postcode for satnav <b>${esc(l.postcode)}</b></button>` : ""}
  </div></details>`;
}
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-copy]");
  if (b) {
    const old = b.innerHTML;
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = "Postcode copied!"; }
    catch { b.textContent = "Postcode: " + b.dataset.copy; }
    setTimeout(() => { b.innerHTML = old; }, 2200);
    return;
  }
  document.querySelectorAll("details.dir[open]").forEach(d => { if (!d.contains(e.target)) d.open = false; });
});
document.addEventListener("keydown", e => { if (e.key === "Escape") document.querySelectorAll("details.dir[open]").forEach(d => { d.open = false; }); });


/* ---------- family card deal badge (mini QR) ---------- */
export function qrMark(size = 22, bg = "#FFE7AE") {
  const u = size / 9, f = (x, y) => `<rect x="${(1 + x) * u}" y="${(1 + y) * u}" width="${u * 2.5}" height="${u * 2.5}" rx="${u * .5}" fill="none" stroke="#0F2A44" stroke-width="${u * .7}"/>`;
  const d = [[5, 5], [6, 6], [4.6, 6.3], [6.3, 4.6]].map(([x, y]) => `<rect x="${(1 + x - .5) * u}" y="${(1 + y - .5) * u}" width="${u * .9}" height="${u * .9}" fill="#0F2A44"/>`).join("");
  return `<svg class="qrmark" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><rect width="${size}" height="${size}" rx="${u * 1.6}" fill="${bg}"/>${f(0, 0)}${f(4.5, 0)}${f(0, 4.5)}${d}</svg>`;
}
export function dealPanel(d) {
  return `<a class="deal-panel" href="/deals.html">${qrMark(34, "#fff")}<span><b>Family card deal</b><span>${esc(d.offer)}${d.members_only ? ". Show your card." : ""}</span></span></a>`;
}

/* ---------- "I'd love a family deal here" ---------- */
const HEART = filled => `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-9.3-8.6C1 8.3 2.9 5 6.2 5c2 0 3.3 1 3.8 2.2h4C14.5 6 15.8 5 17.8 5 21.1 5 23 8.3 21.3 11.4 19 15.6 12 20 12 20Z" ${filled ? 'fill="#E85D8A"' : 'fill="none" stroke="currentColor" stroke-width="2"'}/></svg>`;
function wishCountLine(n, wished) {
  if (wished && n >= 5) return `You and ${n - 1} other local families would love a deal here`;
  if (!wished && n >= 5) return `${n} local families would love a deal here`;
  return "";
}
function wishHtml(l, n, wished) {
  const line = wishCountLine(n, wished);
  return `<button type="button" class="wish${wished ? " on" : ""}" data-wish="${esc(l.id)}" aria-pressed="${wished}">${HEART(wished)}<span>${wished ? "You'd love a deal here" : "I'd love a family deal here"}</span></button>
    <p class="wish-line" aria-live="polite">${line ? `<b>${line}</b><br>` : ""}We'll show the business how many local families want a deal. No sign-up needed.</p>`;
}
// Fills a <div data-dw> with the deal panel, or the wish button if there's no deal yet
export async function fillDealOrWish(el, l) {
  if (!el || !l?.id) return;
  const [find, counts] = await Promise.all([dealIndex(), wishCounts()]);
  const d = find(l);
  if (d) { el.innerHTML = dealPanel(d); return; }
  const wished = myWishes().has(String(l.id));
  el.innerHTML = wishHtml(l, counts.get(String(l.id)) || 0, wished);
  bindWish(el, l);
}
function bindWish(el, l) {
  el.querySelector("[data-wish]")?.addEventListener("click", async e => {
    const b = e.currentTarget; b.disabled = true;
    const r = await toggleWish(l.id);
    if (!r.ok) {
      b.disabled = false;
      el.querySelector(".wish-line").textContent = r.reason === "busy" ? "Lots of wishes here today already! Please try again tomorrow." : "That didn't save. Please try again.";
      return;
    }
    el.innerHTML = wishHtml(l, r.n, r.wished);
    bindWish(el, l);
  });
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
        ${l.phone ? `<div><b>Phone:</b> ${phoneHtml(l.phone)}</div>` : ""}
      </div>
      <div class="dw" data-dw></div>
      <div data-fac></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <a class="btn" href="${listingUrl(l)}">View full page</a>
        ${directionsMenu(l, "Directions")}
        ${web ? `<a class="btn ghost" href="${esc(web)}" target="_blank" rel="noopener">Visit website</a>` : ""}
        ${l.phone && telHref(l.phone) ? `<a class="btn ghost" href="${telHref(l.phone)}">Call</a>` : ""}
        ${reviewsUrl(l) ? `<a class="btn ghost" href="${esc(reviewsUrl(l))}" target="_blank" rel="noopener">Google reviews</a>` : ""}
        <button type="button" class="btn ghost" data-share="${esc(listingUrl(l))}" data-title="${esc(l.name)}">Share</button>
      </div>
      ${l.photo_credit ? `<p class="note">${esc(l.photo_credit)}</p>` : ""}
      ${l.claimed ? "" : claimBlock(l)}
    </div>`;
  const m = $("#modal");
  fillDealOrWish(m.querySelector("[data-dw]"), l);
  fillFacilities(m.querySelector("[data-fac]"), l);
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

/* ---------- deals and recipes ---------- */
export function dealCard(d) {
  return `<button type="button" class="deal" data-deal="${esc(d.id)}">
    <span class="deal-badge">${esc(d.badge)}</span>
    <span class="deal-body"><b>${esc(d.offer)}</b><span class="sub">${esc(d.business_name)} · ${esc(d.area)}</span>
    <span class="deal-tags">${d.members_only ? '<span class="badge">Show your card</span>' : '<span class="badge open">Open to everyone</span>'}${d.valid_until ? `<span class="note">Until ${new Date(d.valid_until).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>` : ""}</span></span>
  </button>`;
}

const POT = "M4 10h16v3a7 7 0 0 1-7 7h-2a7 7 0 0 1-7-7z M2 10h20 M9 6c-1 1 1 2 0 3 M13 5c-1 1.2 1 2.2 0 3.4 M17 6c-1 1 1 2 0 3";
export function recipeThumb(r, cls = "thumb") {
  const img = r.image_url ? `<img src="${esc(r.image_url)}" alt="" loading="lazy">` :
    `<svg class="scene" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="160" height="100" fill="#FFE2D1"/><circle cx="128" cy="40" r="9" fill="#fff" fill-opacity=".85"/><path d="M0 66 Q40 48 82 64 T160 56 V100 H0 Z" fill="#D9774A" fill-opacity=".28"/><path d="M0 82 Q58 68 108 81 T160 77 V100 H0 Z" fill="#fff" fill-opacity=".75"/><g transform="translate(58 20) scale(1.8)"><path d="${POT}" fill="none" stroke="#0F2A44" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></g></svg>`;
  const cost = r.cost_per_serving != null ? `<span class="tagpill free">£${Number(r.cost_per_serving).toFixed(2)} a portion</span>` : "";
  return `<div class="${cls}" style="background:#FFE2D1">${img}${cost}</div>`;
}
export const recipeTime = r => { const t = (r.prep_mins || 0) + (r.cook_mins || 0); return t ? `${t} mins` : ""; };
export function recipeCard(r) {
  return `<a class="card" href="/recipe/${encodeURIComponent(r.slug)}">${recipeThumb(r)}<div class="body"><h3>${esc(r.title)}</h3><span class="sub">${[recipeTime(r), r.serves ? `Serves ${r.serves}` : ""].filter(Boolean).join(" · ")}</span></div></a>`;
}
