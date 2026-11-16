import { DEMO, sb } from "./data.js";
import { $, esc, initHeader } from "./ui.js";

// A business opens its private link (/staff.html?k=...) once on its till phone or tablet.
// From then on, scanning a family card on that phone shows "Apply deal" buttons.
initHeader();
const box = $("#staff");
const money = n => "£" + Number(n).toFixed(2);
const qs = new URLSearchParams(location.search);
let key = null;
try {
  if (qs.get("k")) { localStorage.setItem("bf_staff_key", qs.get("k")); history.replaceState(null, "", "/staff.html"); }
  key = localStorage.getItem("bf_staff_key");
} catch { key = qs.get("k"); }

function noKey(msg = "") {
  box.innerHTML = `<div class="panel" style="max-width:560px;margin:40px auto;display:grid;gap:12px">
    <h1 style="font-size:30px">Staff page</h1>
    ${msg ? `<p class="err">${esc(msg)}</p>` : ""}
    <p>Businesses taking part in our member deals get a private link that sets up their till phone or tablet. Once it's set up, scanning a family card shows your deals with an <b>Apply</b> button, and the savings are counted here.</p>
    <p class="note">Don't have a link yet? Message us through the Facebook group or the <a href="/business.html">For businesses</a> page.</p>
  </div>`;
}

async function run() {
  if (!key) return noKey();
  let s;
  if (DEMO) s = { key_ok: true, business: "Demo business", month_uses: 47, month_saved: 386.4, all_uses: 112, all_saved: 905.1, families: 63, deals: [{ badge: "£20", offer: "£20 off weekend parties", month_uses: 12, all_uses: 30 }, { badge: "10%", offer: "10% off café bill", month_uses: 35, all_uses: 82 }] };
  else {
    try { const c = await sb(); const { data, error } = await c.rpc("staff_stats", { p_key: key }); if (error) throw error; s = data; }
    catch { box.innerHTML = '<div class="empty">Couldn\'t load your numbers. Please check your connection and refresh.</div>'; return; }
  }
  if (!s.key_ok) { try { localStorage.removeItem("bf_staff_key"); } catch {} return noKey("This staff link has been switched off. Ask us for a new one."); }
  const month = new Date().toLocaleDateString("en-GB", { month: "long" });
  box.innerHTML = `
    <div class="staff-head"><span class="pill" style="background:var(--mint-band);color:var(--mint-ink)">This phone is set up for staff</span><h1>${esc(s.business)}</h1></div>
    <div class="stat-row">
      <div class="stat"><b>${s.month_uses}</b><span>member visits in ${month}</span></div>
      <div class="stat"><b>${money(s.month_saved)}</b><span>saved by families in ${month}</span></div>
      <div class="stat"><b>${s.families}</b><span>different families so far</span></div>
      <div class="stat"><b>${s.all_uses}</b><span>member visits in total</span></div>
    </div>
    <div class="panel" style="display:grid;gap:4px">
      <h2 style="font-size:20px">Your deals</h2>
      ${s.deals.length ? s.deals.map(d => `<div class="apply-row"><span class="deal-badge">${esc(d.badge)}</span><span class="grow"><b>${esc(d.offer)}</b><span class="note">${d.month_uses} this month · ${d.all_uses} in total</span></span></div>`).join("") : '<p class="note">No deals are live for your business yet.</p>'}
    </div>
    <div class="panel how">
      <h2 style="font-size:20px">How to apply a deal</h2>
      <ol><li>Ask to see the family's card on their phone.</li><li>Open your camera and point it at the QR code, then tap the link that pops up.</li><li>You'll see a green tick and your deals. Tap <b>Apply</b> (for bill deals, type the bill total first).</li></ol>
      <p class="note">The saving appears on the family's card straight away and is added to your numbers above.</p>
    </div>
    <p class="note" style="text-align:center"><button type="button" class="linkish" id="forget">Remove staff access from this phone</button></p>`;
  $("#forget").addEventListener("click", () => {
    if (!confirm("Remove staff access from this phone? You'll need your link again to set it back up.")) return;
    try { localStorage.removeItem("bf_staff_key"); } catch {}
    key = null; noKey();
  });
}
run();
