// Admin: "I'd love a family deal here" wishes, ranked, for pitching businesses.
import { DEMO, CATS, dealIndex } from "./data.js";
import { $, esc } from "./ui.js";

let client = null, rows = [], ready = true;
const DEMO_ROWS = [
  { listing_id: "l1", name: "Meadowbank Adventure Park", category: "outdoors", area: "North Bristol", total: 47, members: 31, last_at: new Date().toISOString() },
  { listing_id: "l2", name: "Splash Academy", category: "sport", area: "South Bristol", total: 23, members: 9, last_at: new Date().toISOString() },
  { listing_id: "l3", name: "Beanbag Coffee House", category: "cafes", area: "Central Bristol", total: 6, members: 2, last_at: new Date().toISOString() },
];

async function load() {
  if (DEMO) { rows = DEMO_ROWS; return; }
  const { data, error } = await client.rpc("wish_stats");
  ready = !error; rows = error ? [] : data;
}

function csv() {
  const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [["Business", "Category", "Area", "Families wishing", "Of which card holders", "Last wish"].map(q).join(",")]
    .concat(rows.map(r => [r.name, CATS[r.category]?.n || r.category, r.area, r.total, r.members, new Date(r.last_at).toLocaleDateString("en-GB")].map(q).join(",")));
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv" }));
  a.download = `deal-wishes-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

async function render() {
  $("#wcount").textContent = rows.length ? `(${rows.length})` : "";
  if (!ready) { $("#wish-summary").innerHTML = '<p class="note">Run <b>update-11-deal-wishes.sql</b> in Supabase to switch this on.</p>'; return; }
  const find = await dealIndex();
  const total = rows.reduce((a, r) => a + r.total, 0), members = rows.reduce((a, r) => a + r.members, 0);
  const byCat = {};
  rows.forEach(r => { const n = CATS[r.category]?.n || r.category; byCat[n] = (byCat[n] || 0) + r.total; });
  $("#wish-summary").innerHTML = rows.length ? `
    <div class="int-stats">
      <div><b>${total}</b><span>wishes in all</span></div>
      <div><b>${members}</b><span>from card holders</span></div>
      <div><b>${rows.length}</b><span>places wished for</span></div>
      <div><b>${rows.filter(r => r.total >= 10).length}</b><span>places with 10+</span></div>
    </div>
    <div class="panel" style="margin-bottom:14px"><h3 style="margin:0 0 8px">By category</h3><ol class="int-top">${Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([c, n]) => `<li><span>${esc(c)}</span><b>${n}</b></li>`).join("")}</ol></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin:0 0 14px"><button type="button" class="btn" id="wish-csv">Download as a spreadsheet (CSV)</button></div>` : "";
  $("#list-wishes").innerHTML = rows.length ? rows.map((r, i) => {
    const has = find({ id: r.listing_id, name: r.name });
    return `<div class="adm-row"><div class="grow"><b>${i + 1}. ${esc(r.name)}</b>${has ? ' <span class="badge open">Has a deal now</span>' : ""}
      <span class="sub">${esc(CATS[r.category]?.n || r.category)} · ${esc(r.area)} · last wish ${new Date(r.last_at).toLocaleDateString("en-GB")}</span>
      <span class="sub"><b style="display:inline">${r.total} local ${r.total === 1 ? "family" : "families"}</b> would love a deal here (${r.members} with a family card)</span></div>
      <button type="button" class="btn ghost" data-pitch="${esc(r.name)}|${r.total}|${r.members}">Copy pitch line</button></div>`;
  }).join("") : '<div class="empty">No wishes yet. They\'ll appear here as parents tap "I\'d love a family deal here".</div>';
  $("#wish-csv")?.addEventListener("click", csv);
}

document.addEventListener("click", async e => {
  const b = e.target.closest("[data-pitch]"); if (!b) return;
  const [name, total, members] = b.dataset.pitch.split("|");
  const line = `${total} local families have asked for a family deal at ${name} on Bristol Free & Affordable${+members ? ` (${members} of them already have our family card)` : ""}. We're a 27,000-member Bristol parents' group, and listing a deal is free.`;
  try { await navigator.clipboard.writeText(line); b.textContent = "Copied!"; } catch { b.textContent = "Couldn't copy"; }
  setTimeout(() => { b.textContent = "Copy pitch line"; }, 1800);
});

async function init(detail) {
  if (client !== null || (!DEMO && !detail.client)) return;
  client = detail.client || false;
  await load(); render();
}
if (window.__admin) init(window.__admin);
window.addEventListener("admin-ready", e => init(e.detail));
