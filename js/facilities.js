// Facilities: the 17 icons, loading confirmed answers, the peach box, and the
// "Update info or facilities" form. A facility with no row is unknown and shows nothing.
import { DEMO, sb } from "./data.js";

export const FACILITIES = [
  { key: "pushchair", label: "Pushchair-friendly", bg: "#E5EFF8", svg: "<path d=\"M4 10h14a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6z\"/><path d=\"M4 10a8 8 0 0 1 8-7v7\"/><path d=\"M18 10l1.5-4H21\"/><circle cx=\"8\" cy=\"19.5\" r=\"1.8\"/><circle cx=\"15\" cy=\"19.5\" r=\"1.8\"/>" },
  { key: "baby_changing", label: "Baby changing", bg: "#FCE6EE", svg: "<rect x=\"3\" y=\"15\" width=\"18\" height=\"4\" rx=\"2\"/><circle cx=\"8\" cy=\"11\" r=\"2.5\"/><path d=\"M11 12.5h5.5a1.8 1.8 0 0 1 0 2.5H11\"/>" },
  { key: "toilets", label: "Toilets", bg: "#EFE9FA", svg: "<circle cx=\"7\" cy=\"5\" r=\"1.6\"/><path d=\"M5 9h4v6H8v5H6v-5H5z\"/><circle cx=\"17\" cy=\"5\" r=\"1.6\"/><path d=\"M15.5 9h3l2 6h-2v5h-3v-5h-2z\"/><path d=\"M12 4v16\"/>" },
  { key: "accessible_toilet", label: "Accessible toilet", bg: "#E6EDFD", svg: "<circle cx=\"11\" cy=\"4\" r=\"1.7\"/><path d=\"M11 7v6h5l2.5 5\"/><path d=\"M8.5 10.5a5 5 0 1 0 6 7\"/>" },
  { key: "step_free", label: "Step-free access", bg: "#E2F4EA", svg: "<path d=\"M3 19L21 9v10z\"/><path d=\"M8 13.5l5-2.8\"/><path d=\"M11.5 9.7l1.5 1-1 1.5\"/>" },
  { key: "free_parking", label: "Free parking", bg: "#E2F4EA", svg: "<rect x=\"4\" y=\"3\" width=\"16\" height=\"18\" rx=\"4\"/><path d=\"M10 17V7h3a3 3 0 0 1 0 6h-3\"/>" },
  { key: "paid_parking", label: "Paid parking nearby", bg: "#FFF3D3", svg: "<rect x=\"3\" y=\"3\" width=\"13\" height=\"15\" rx=\"3.5\"/><path d=\"M8 14V7h2.5a2.5 2.5 0 0 1 0 5H8\"/><circle cx=\"18\" cy=\"17.5\" r=\"4\"/><path d=\"M19.2 15.8a1.3 1.3 0 0 0-2.4.7v3h2.6M16.2 17.6h2\"/>" },
  { key: "cafe", label: "Caf\u00e9 or food", bg: "#FDE8DC", svg: "<path d=\"M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z\"/><path d=\"M16 10h1.5a2.5 2.5 0 0 1 0 5H16\"/><path d=\"M9 3c-1 1.5 1 2.5 0 4M13 3c-1 1.5 1 2.5 0 4\"/>" },
  { key: "high_chairs", label: "High chairs", bg: "#FDE8DC", svg: "<path d=\"M8 3v8M16 3v8\"/><path d=\"M6 11h12\"/><path d=\"M5 7h3M16 7h3\"/><path d=\"M9 11l-3 10M15 11l3 10\"/><path d=\"M7 17h10\"/>" },
  { key: "indoor", label: "Indoor", bg: "#E6EDFD", svg: "<path d=\"M3 11l9-7 9 7\"/><path d=\"M5 9.5V20h14V9.5\"/><rect x=\"10\" y=\"14\" width=\"4\" height=\"6\" rx=\"1\"/>" },
  { key: "outdoor", label: "Outdoor", bg: "#E2F4EA", svg: "<path d=\"M9 3l4.5 7h-2.5l3.5 6H4.5L8 10H5.5z\"/><path d=\"M9 16v4\"/><circle cx=\"18.5\" cy=\"5.5\" r=\"2.2\"/><path d=\"M3 20.5h18\"/>" },
  { key: "picnic", label: "Picnic area", bg: "#FFF3D3", svg: "<path d=\"M4 9h16\"/><path d=\"M7 9l-3 11M17 9l3 11\"/><path d=\"M3 15h18\"/>" },
  { key: "dog_friendly", label: "Dog-friendly", bg: "#FDE8DC", svg: "<ellipse cx=\"12\" cy=\"16.3\" rx=\"4.6\" ry=\"3.7\" fill=\"#0F2A44\" stroke=\"none\"/><circle cx=\"5.6\" cy=\"10.6\" r=\"2.2\" fill=\"#0F2A44\" stroke=\"none\"/><circle cx=\"9.5\" cy=\"6.2\" r=\"2.2\" fill=\"#0F2A44\" stroke=\"none\"/><circle cx=\"14.5\" cy=\"6.2\" r=\"2.2\" fill=\"#0F2A44\" stroke=\"none\"/><circle cx=\"18.4\" cy=\"10.6\" r=\"2.2\" fill=\"#0F2A44\" stroke=\"none\"/>" },
  { key: "feeding", label: "Feeding-friendly space", bg: "#FCE6EE", svg: "<path d=\"M12 20s-7.5-4.4-7.5-9.7A4 4 0 0 1 12 8a4 4 0 0 1 7.5 2.3C19.5 15.6 12 20 12 20z\"/><path d=\"M12 11.5c-1.3 1.6-1.6 2.5-1.6 3.1a1.6 1.6 0 0 0 3.2 0c0-.6-.3-1.5-1.6-3.1z\" fill=\"#0F2A44\"/>" },
  { key: "quiet_send", label: "SEND-friendly / quiet sessions", bg: "#EFE9FA", svg: "<path d=\"M4 15v-3a8 8 0 0 1 16 0v3\"/><path d=\"M4 14h3v6H5a1 1 0 0 1-1-1z\"/><path d=\"M20 14h-3v6h2a1 1 0 0 0 1-1z\"/>" },
  { key: "creche", label: "Cr\u00e8che", bg: "#FFF3D3", svg: "<circle cx=\"9\" cy=\"5.5\" r=\"2.2\"/><path d=\"M6 21v-5.5L4.5 12 9 10l4.5 2L12 15.5V21\"/><path d=\"M9 14v7\"/><rect x=\"15\" y=\"15\" width=\"6\" height=\"6\" rx=\"1\"/><path d=\"M16.5 11.5l1.5-2.5 1.5 2.5z\"/>" },
  { key: "changing_places", label: "Changing Places toilet", bg: "#E6EDFD", svg: "<path d=\"M3 4h18\"/><path d=\"M15 4v4\"/><path d=\"M13.5 8h3\"/><circle cx=\"8\" cy=\"10\" r=\"1.8\"/><rect x=\"3\" y=\"14\" width=\"18\" height=\"3.5\" rx=\"1.5\"/><path d=\"M6 17.5V21M18 17.5V21\"/><path d=\"M10.5 14l1.5-3h3\"/>" },
];
export const FAC = Object.fromEntries(FACILITIES.map(f => [f.key, f]));
// "No" chips only show for these, where a confirmed "no" really matters to parents
const SHOW_NO = new Set(["baby_changing", "toilets", "accessible_toilet", "step_free", "pushchair"]);

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export function facIcon(key, size = 20, colour = "#0F2A44") {
  const f = FAC[key]; if (!f) return "";
  return `<svg class="fac-svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${colour}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${f.svg}</svg>`;
}
export function facBubble(key, size = 34, icon = 19) {
  const f = FAC[key]; if (!f) return "";
  return `<span class="fac-b" style="width:${size}px;height:${size}px;background:${f.bg}" title="${esc(f.label)}">${facIcon(key, icon)}</span>`;
}

/* ---------- loading ---------- */
const DEMO_FAC = {
  "Jumping Jellybeans": { indoor: "yes", cafe: "yes", baby_changing: "yes", free_parking: "yes", pushchair: "yes", high_chairs: "yes", step_free: "no", _checked: "2026-11-12" },
  "Beanbag Coffee House": { cafe: "yes", high_chairs: "yes", baby_changing: "yes", feeding: "yes", indoor: "yes", _checked: "2026-11-05" },
  "Meadowbank Adventure Park": { outdoor: "yes", picnic: "yes", toilets: "yes", free_parking: "yes", dog_friendly: "yes", cafe: "yes", _checked: "2026-10-28" },
  "Wild Woods Adventure Farm": { outdoor: "yes", indoor: "yes", picnic: "yes", cafe: "yes", toilets: "yes", baby_changing: "yes", accessible_toilet: "yes", quiet_send: "yes", _checked: "2026-11-01" },
};
let facP = null;
// Map of listing id -> { key: "yes"|"no" }
export function facilitiesIndex(listings = []) {
  if (DEMO) {
    const m = new Map();
    for (const l of listings) { const d = DEMO_FAC[l.name]; if (d) { const { _checked, ...rest } = d; m.set(String(l.id), rest); if (!l.last_checked) l.last_checked = _checked; } }
    return Promise.resolve(m);
  }
  facP = facP || sb().then(c => c.from("listing_facilities").select("listing_id, facility, value"))
    .then(({ data }) => {
      const m = new Map();
      for (const r of data || []) { const k = String(r.listing_id); if (!m.has(k)) m.set(k, {}); m.get(k)[r.facility] = r.value; }
      return m;
    }).catch(() => new Map());
  return facP;
}
export const yesKeys = facs => FACILITIES.map(f => f.key).filter(k => facs?.[k] === "yes");

const monthYear = d => { try { return new Date(d + (String(d).length === 10 ? "T12:00:00" : "")).toLocaleDateString("en-GB", { month: "short", year: "numeric" }); } catch { return ""; } };
const PEN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>';
function noChip(k) {
  return `<span class="fac-no">${`<span class="fac-no-i">${facIcon(k, 18, "#8A94A0")}</span>`}No ${esc(FAC[k].label.toLowerCase())}</span>`;
}

/* ---------- the peach box (pop-up) and the full panel (listing page) ---------- */
export function facilitiesHtml(l, facs, full = false) {
  const yes = yesKeys(facs), no = FACILITIES.map(f => f.key).filter(k => facs?.[k] === "no" && SHOW_NO.has(k));
  const checked = l.last_checked ? `Checked ${monthYear(l.last_checked)}` : "";
  const btn = `<button type="button" class="fac-update" data-update="${esc(l.id)}">${PEN}Update info or facilities</button>`;
  if (!yes.length && !no.length) {
    return `<div class="fac-box${full ? " full" : ""}"><div class="fac-head"><span>Facilities</span></div>
      <div class="fac-faint">${["baby_changing", "free_parking", "cafe", "toilets"].map(k => facBubble(k, 30, 17)).join("")}</div>
      <p class="fac-empty"><b>No facilities confirmed yet.</b> Been here? Be the first to add them.</p>${btn}</div>`;
  }
  if (full) {
    return `<div class="fac-box full"><div class="fac-head"><span>Facilities</span></div>
      <div class="fac-grid">${yes.map(k => `<div class="fac-row">${facBubble(k, 38, 21)}<span>${esc(FAC[k].label)}</span></div>`).join("")}</div>
      ${no.length ? `<div class="fac-nos">${no.map(noChip).join("")}</div>` : ""}
      ${checked ? `<p class="fac-checked">${checked}</p>` : ""}${btn}</div>`;
  }
  const shown = yes.slice(0, 5), more = yes.length - shown.length;
  return `<div class="fac-box"><div class="fac-head"><span>Facilities</span>${yes.length > 5 || no.length ? `<button type="button" class="fac-all" aria-expanded="false">See all</button>` : ""}</div>
    <div class="fac-strip">${shown.map(k => facBubble(k, 32, 18)).join("")}${more > 0 ? `<span class="fac-more">+${more}</span>` : ""}</div>
    <p class="fac-names">${yes.map(k => esc(FAC[k].label)).join(" · ")}</p>
    <div class="fac-expand" hidden><div class="fac-grid">${yes.map(k => `<div class="fac-row">${facBubble(k, 32, 18)}<span>${esc(FAC[k].label)}</span></div>`).join("")}</div>${no.length ? `<div class="fac-nos">${no.map(noChip).join("")}</div>` : ""}</div>
    ${checked ? `<p class="fac-checked">${checked}</p>` : ""}${btn}</div>`;
}
export async function fillFacilities(el, l, full = false) {
  if (!el || !l) return;
  const m = await facilitiesIndex([l]);
  el.innerHTML = facilitiesHtml(l, m.get(String(l.id)) || {}, full);
  el.querySelector(".fac-all")?.addEventListener("click", e => {
    const b = e.currentTarget, x = el.querySelector(".fac-expand"), open = x.hidden;
    x.hidden = !open; el.querySelector(".fac-strip").hidden = open; el.querySelector(".fac-names").hidden = open;
    b.textContent = open ? "Show less" : "See all"; b.setAttribute("aria-expanded", String(open));
  });
  el.querySelector("[data-update]")?.addEventListener("click", () => openUpdate(l, true));
}

/* ---------- "Update info or facilities" form ---------- */
async function sendReport(row) {
  if (DEMO) { await new Promise(r => setTimeout(r, 300)); return; }
  const c = await sb();
  const { error } = await c.from("listing_reports").insert(row);
  if (error) throw error;
}
let wrap = null;
function close() { if (wrap) { wrap.remove(); wrap = null; document.removeEventListener("keydown", onKey); } }
function onKey(e) { if (e.key === "Escape") close(); }
const X = '<button type="button" class="upd-x" aria-label="Close">×</button>';
const BACK = '<button type="button" class="upd-back" aria-label="Back">‹</button>';
function head(l, title, sub, back) {
  return `<div class="upd-head">${back ? BACK : ""}<div><span class="upd-place">${esc(l.name)}</span><h2>${title}</h2></div>${X}</div>${sub ? `<p class="upd-sub">${sub}</p>` : ""}`;
}
function screen(html) { wrap.querySelector(".upd-sheet").innerHTML = html; wrap.querySelector(".upd-sheet").scrollTop = 0; }
function choices(l) {
  const ic = p => `<span class="upd-ci"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F2A44" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg></span>`;
  screen(head(l, "Update info or facilities", "What would you like to tell us?", false) + `<div class="upd-body">
    <button type="button" class="upd-choice peach" data-go="fac">${ic('<path d="M5 12l4 4 10-10"/>')}<span><b>Confirm facilities</b><small>Baby changing, parking, café and more</small></span><i>›</i></button>
    <button type="button" class="upd-choice blue" data-go="change">${ic('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>')}<span><b>Something's changed</b><small>Prices, opening times, phone or website</small></span><i>›</i></button>
    <button type="button" class="upd-choice grey" data-go="closed">${ic('<circle cx="12" cy="12" r="8"/><path d="M8 8l8 8"/>')}<span><b>It's closed down</b><small>Let us know and we'll take it off</small></span><i>›</i></button>
    <p class="upd-small">No sign-up needed. We check every update before it goes live.</p></div>`);
}
function facForm(l, known) {
  const row = f => `<div class="upd-fac">${facBubble(f.key, 34, 19)}<span class="upd-fl">${esc(f.label)}</span>
    <span class="seg" role="radiogroup" aria-label="${esc(f.label)}">${[["yes", "Yes"], ["no", "No"], ["", "Not sure"]].map(([v, t]) =>
      `<label><input type="radio" name="${f.key}" value="${v}"${(known[f.key] || "") === v ? " checked" : ""}><span>${t}</span></label>`).join("")}</span></div>`;
  screen(head(l, "Confirm facilities", "Tap what you know. Leave anything you're not sure about.", true) + `<form class="upd-body" novalidate>
    ${FACILITIES.map(row).join("")}
    <label class="check upd-visit"><input type="checkbox" name="visited"> I visited in the last 6 months</label>
    <p class="err" role="alert" hidden></p><button class="btn upd-send">Send update</button></form>`);
  const f = wrap.querySelector("form");
  f.addEventListener("submit", async e => {
    e.preventDefault();
    const answers = {};
    for (const x of FACILITIES) { const v = f.querySelector(`input[name=${x.key}]:checked`)?.value; if (v && v !== (known[x.key] || "")) answers[x.key] = v; }
    const err = f.querySelector(".err");
    if (!Object.keys(answers).length) { err.textContent = "Change at least one answer, or tap Back."; err.hidden = false; return; }
    await submit(l, { kind: "facilities", facilities: answers, visited_recently: f.elements.visited.checked }, f, answers);
  });
}
function textForm(l, kind) {
  const closed = kind === "closed";
  screen(head(l, closed ? "It's closed down" : "Something's changed", closed ? "Thanks for letting us know. Anything else we should know?" : "Tell us what's different, e.g. new prices or opening times.", true) + `<form class="upd-body" novalidate>
    <label class="field">${closed ? "Details (optional)" : "What's changed?"}<textarea name="message" rows="4" maxlength="1000" placeholder="${closed ? "e.g. Closed for good in October" : "e.g. Entry is now £8 per child, and they're closed on Mondays"}"></textarea></label>
    <p class="err" role="alert" hidden></p><button class="btn upd-send">Send update</button></form>`);
  const f = wrap.querySelector("form");
  f.addEventListener("submit", async e => {
    e.preventDefault();
    const msg = f.elements.message.value.trim(), err = f.querySelector(".err");
    if (!closed && !msg) { err.textContent = "Please tell us what's changed."; err.hidden = false; return; }
    await submit(l, { kind, message: msg || null }, f);
  });
}
async function submit(l, data, f, answers) {
  const btn = f.querySelector(".upd-send"), err = f.querySelector(".err");
  btn.disabled = true; btn.textContent = "Sending…"; err.hidden = true;
  try { await sendReport({ listing_id: l.id, ...data }); }
  catch { btn.disabled = false; btn.textContent = "Send update"; err.textContent = "Sorry, that didn't send. Please try again in a moment."; err.hidden = false; return; }
  const yes = answers ? Object.keys(answers).filter(k => answers[k] === "yes").slice(0, 6) : [];
  screen(`<div class="upd-thanks">${X}<span class="upd-tick"><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#2E9E6B" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4 10-10"/></svg></span>
    <h2>Thanks! You've helped other Bristol parents</h2><p>We'll check your update and add it to ${esc(l.name)}.</p>
    ${yes.length ? `<div class="upd-yes">${yes.map(k => facBubble(k, 34, 19)).join("")}</div>` : ""}
    <button type="button" class="btn upd-done">Back to the listing</button></div>`);
  wrap.querySelector(".upd-done").addEventListener("click", close);
}
export async function openUpdate(l, startOnFacilities = false) {
  close();
  wrap = document.createElement("div"); wrap.className = "upd-wrap"; wrap.setAttribute("role", "dialog"); wrap.setAttribute("aria-modal", "true"); wrap.setAttribute("aria-label", "Update info or facilities");
  wrap.innerHTML = '<div class="upd-sheet"></div>';
  document.body.append(wrap); document.addEventListener("keydown", onKey);
  const known = (await facilitiesIndex([l])).get(String(l.id)) || {};
  wrap.addEventListener("click", e => {
    if (e.target === wrap || e.target.closest(".upd-x")) return close();
    if (e.target.closest(".upd-back")) return choices(l);
    const go = e.target.closest("[data-go]")?.dataset.go;
    if (go === "fac") facForm(l, known); else if (go) textForm(l, go);
  });
  startOnFacilities ? facForm(l, known) : choices(l);
  wrap.querySelector(".upd-sheet").focus?.();
}
