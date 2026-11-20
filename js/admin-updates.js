// Admin: updates parents sent with "Update info or facilities".
import { DEMO, listingUrl } from "./data.js";
import { $, esc } from "./ui.js";
import { FAC, facBubble } from "./facilities.js";

let client = null, rows = [], ready = true, showDone = false;
const KIND = { facilities: "Facilities", change: "Something's changed", closed: "Closed down" };
const DEMO_ROWS = [
  { id: "u1", kind: "facilities", facilities: { toilets: "yes", step_free: "no", high_chairs: "yes" }, visited_recently: true, status: "new", created_at: new Date().toISOString(), listings: { id: "l1", name: "Jumping Jellybeans", slug: "jumping-jellybeans" } },
  { id: "u2", kind: "change", message: "Entry is now £8 per child, and they're closed on Mondays.", status: "new", created_at: new Date().toISOString(), listings: { id: "l2", name: "Splash Academy", slug: "splash-academy" } },
  { id: "u3", kind: "closed", message: "Closed for good in October.", status: "new", created_at: new Date().toISOString(), listings: { id: "l3", name: "Toybox Corner", slug: "toybox-corner" } },
];

async function load() {
  if (DEMO) { rows = rows.length ? rows : DEMO_ROWS; return; }
  const { data, error } = await client.from("listing_reports").select("*, listings(id, name, slug)").order("created_at", { ascending: false }).limit(300);
  ready = !error; rows = error ? [] : data;
}

function render() {
  const open = rows.filter(r => r.status === "new");
  $("#ucount").textContent = open.length ? `(${open.length})` : "";
  if (!ready) { $("#list-updates").innerHTML = '<p class="note">Run <b>update-13-listing-updates.sql</b> in Supabase to switch this on.</p>'; return; }
  const list = showDone ? rows : open;
  const toggle = `<button type="button" class="btn ghost" id="upd-toggle" style="margin-bottom:12px">${showDone ? "Hide finished updates" : `Show finished updates (${rows.length - open.length})`}</button>`;
  $("#list-updates").innerHTML = toggle + (list.length ? list.map(r => {
    const l = r.listings || {}, facs = Object.entries(r.facilities || {});
    return `<div class="adm-row ${r.status !== "new" ? "past" : ""}"><div class="grow">
      <b>${esc(l.name || "A listing")}</b> <span class="badge ${r.kind === "closed" ? "" : "open"}">${KIND[r.kind]}</span>${r.status !== "new" ? ` <span class="badge">${r.status === "done" ? "Done" : "Dismissed"}</span>` : ""}
      <span class="sub">${new Date(r.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}${r.visited_recently ? " · visited in the last 6 months" : ""}${l.slug ? ` · <a href="${listingUrl(l)}" target="_blank" rel="noopener">View listing</a>` : ""}</span>
      ${facs.length ? `<span class="upd-adm-facs">${facs.map(([k, v]) => `<span class="upd-adm-f ${v}">${facBubble(k, 26, 15)}${esc(v === "yes" ? (FAC[k]?.label || k) : "No " + (FAC[k]?.label || k).toLowerCase())}</span>`).join("")}</span>` : ""}
      ${r.message ? `<span class="sub" style="color:var(--navy)">“${esc(r.message)}”</span>` : ""}</div>
      ${r.status === "new" ? (r.kind === "facilities"
        ? `<button class="btn" data-uapprove="${esc(r.id)}">Approve</button><button class="btn ghost" data-udismiss="${esc(r.id)}">Dismiss</button>`
        : `<button class="btn" data-udone="${esc(r.id)}">Mark done</button><button class="btn ghost" data-udismiss="${esc(r.id)}">Dismiss</button>`) : ""}
    </div>`;
  }).join("") : '<div class="empty">No new updates. They\'ll appear here when parents use "Update info or facilities".</div>');
}

async function setStatus(r, status) {
  if (!DEMO) { const { error } = await client.from("listing_reports").update({ status }).eq("id", r.id); if (error) throw error; }
  r.status = status;
}
async function approve(r) {
  if (!DEMO) {
    const lid = r.listings?.id || r.listing_id, keys = Object.keys(r.facilities || {});
    const { data: existing } = await client.from("listing_facilities").select("facility, confirmed_by").eq("listing_id", lid).in("facility", keys);
    const business = new Set((existing || []).filter(x => x.confirmed_by === "business").map(x => x.facility));
    const today = new Date().toISOString().slice(0, 10);
    const up = keys.filter(k => !business.has(k)).map(k => ({ listing_id: lid, facility: k, value: r.facilities[k], confirmed_by: "parent", checked_on: today, source: r.visited_recently ? "Parent update (visited recently)" : "Parent update" }));
    if (up.length) { const { error } = await client.from("listing_facilities").upsert(up, { onConflict: "listing_id,facility" }); if (error) throw error; }
    await client.from("listings").update({ last_checked: today }).eq("id", lid);
  }
  await setStatus(r, "done");
}

document.addEventListener("click", async e => {
  if (e.target.closest("#upd-toggle")) { showDone = !showDone; return render(); }
  const b = e.target.closest("[data-uapprove],[data-udone],[data-udismiss]"); if (!b) return;
  const r = rows.find(x => x.id === (b.dataset.uapprove || b.dataset.udone || b.dataset.udismiss));
  b.disabled = true;
  try {
    if (b.dataset.uapprove) await approve(r);
    else await setStatus(r, b.dataset.udone ? "done" : "dismissed");
    render();
  } catch { b.disabled = false; alert("That didn't save. Please try again."); }
});

async function init(detail) {
  if (client !== null || (!DEMO && !detail.client)) return;
  client = detail.client || false;
  await load(); render();
}
if (window.__admin) init(window.__admin);
window.addEventListener("admin-ready", e => init(e.detail));
