// Admin: the family card waiting list (/join), with the most-requested places counted up.
import { DEMO } from "./data.js";
import { $, esc } from "./ui.js";

let client = null, rows = [], ready = true;
const DEMO_ROWS = [
  { id: "i1", first_name: "Jo", email: "jo@example.com", would_use: "yes", places: "Wookey Hole, Bristol Zoo, Jump Inc", area: "East Bristol", source: "fb", created_at: new Date().toISOString() },
  { id: "i2", first_name: "Priya", email: "priya@example.com", would_use: "yes", places: "bristol zoo and the lido", area: "North Bristol", source: "fb", created_at: new Date().toISOString() },
  { id: "i3", first_name: "Sam", email: "sam@example.com", would_use: "maybe", places: "Soft play\nBristol Zoo", area: "Keynsham", source: null, created_at: new Date().toISOString() },
];

async function load() {
  if (DEMO) { rows = DEMO_ROWS; return; }
  const { data, error } = await client.from("interest").select("*").order("created_at", { ascending: false });
  ready = !error; rows = error ? [] : data;
}

// "Wookey Hole, the zoo and Jump Inc" -> ["wookey hole", "zoo", "jump inc"], counted across everyone
function tally(list) {
  const counts = new Map();
  for (const r of list) {
    const seen = new Set();
    for (let p of String(r.places || "").split(/[,;\n/]+|\s+(?:and|&|or)\s+/i)) {
      p = p.trim().replace(/^(the|a|an)\s+/i, "").replace(/[.!?]+$/, "").replace(/\s+/g, " ");
      if (p.length < 3) continue;
      const k = p.toLowerCase();
      if (seen.has(k)) continue; seen.add(k);
      const c = counts.get(k) || { name: p, n: 0 }; c.n++; counts.set(k, c);
    }
  }
  return [...counts.values()].sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
}

function csv() {
  const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [["First name", "Email", "Would use", "Places", "Area", "Came from", "Joined"].map(q).join(",")]
    .concat(rows.map(r => [r.first_name, r.email, r.would_use, r.places, r.area, r.source, new Date(r.created_at).toLocaleString("en-GB")].map(q).join(",")));
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv" }));
  a.download = `waiting-list-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function render() {
  $("#icount").textContent = rows.length ? `(${rows.length})` : "";
  if (!ready) { $("#int-summary").innerHTML = '<p class="note">Run <b>update-10-register-interest.sql</b> in Supabase to switch this on.</p>'; return; }
  const yes = rows.filter(r => r.would_use === "yes").length, maybe = rows.length - yes, fb = rows.filter(r => r.source === "fb").length;
  const top = tally(rows).slice(0, 15), areas = {};
  rows.forEach(r => { if (r.area) areas[r.area] = (areas[r.area] || 0) + 1; });
  $("#int-summary").innerHTML = rows.length ? `
    <div class="int-stats">
      <div><b>${rows.length}</b><span>on the list</span></div>
      <div><b>${yes}</b><span>said yes</span></div>
      <div><b>${maybe}</b><span>said maybe</span></div>
      <div><b>${fb}</b><span>came from fb</span></div>
    </div>
    <div class="int-cols">
      <div class="panel"><h3>Most-wanted discounts</h3>${top.length ? `<ol class="int-top">${top.map(t => `<li><span>${esc(t.name)}</span><b>${t.n}</b></li>`).join("")}</ol><p class="note">Counted from what people typed, so similar names may show separately.</p>` : '<p class="note">No places suggested yet.</p>'}</div>
      <div class="panel"><h3>Where they are</h3>${Object.keys(areas).length ? `<ol class="int-top">${Object.entries(areas).sort((a, b) => b[1] - a[1]).map(([a, n]) => `<li><span>${esc(a)}</span><b>${n}</b></li>`).join("")}</ol>` : '<p class="note">No areas given yet.</p>'}</div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin:14px 0"><button type="button" class="btn" id="int-csv">Download as a spreadsheet (CSV)</button><button type="button" class="btn ghost" id="int-copy">Copy all emails</button></div>` : "";
  $("#list-interest").innerHTML = rows.length ? rows.map(r => `<div class="adm-row"><div class="grow"><b>${esc(r.first_name)}</b> <span class="badge ${r.would_use === "yes" ? "open" : ""}">${r.would_use === "yes" ? "Yes" : "Maybe"}</span>
      <span class="sub">${esc(r.email)}${r.area ? ` · ${esc(r.area)}` : ""}${r.source ? ` · from ${esc(r.source)}` : ""} · ${new Date(r.created_at).toLocaleDateString("en-GB")}</span>
      ${r.places ? `<span class="sub">Wants: ${esc(r.places)}</span>` : ""}</div>
      <button class="btn ghost" data-idel="${esc(r.id)}">Remove</button></div>`).join("")
    : '<div class="empty">Nobody on the waiting list yet. Share <b>/join?src=fb</b> in the group.</div>';
  $("#int-csv")?.addEventListener("click", csv);
  $("#int-copy")?.addEventListener("click", async e => {
    const b = e.currentTarget, list = rows.map(r => r.email).join(", ");
    try { await navigator.clipboard.writeText(list); b.textContent = "Copied!"; } catch { b.textContent = "Couldn't copy"; }
    setTimeout(() => { b.textContent = "Copy all emails"; }, 1800);
  });
}

document.addEventListener("click", async e => {
  const d = e.target.closest("[data-idel]"); if (!d) return;
  const r = rows.find(x => x.id === d.dataset.idel);
  if (!confirm(`Remove ${r.first_name} (${r.email}) from the waiting list? Do this if they ask to be taken off.`)) return;
  if (!DEMO) { const { error } = await client.from("interest").delete().eq("id", r.id); if (error) return alert("Couldn't remove them."); }
  rows = rows.filter(x => x.id !== r.id); render();
});

async function init(detail) {
  if (client !== null || (!DEMO && !detail.client)) return;
  client = detail.client || false;
  await load(); render();
}
if (window.__admin) init(window.__admin);
window.addEventListener("admin-ready", e => init(e.detail));
