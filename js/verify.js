import { DEMO, sb } from "./data.js";
import { $, esc, initHeader } from "./ui.js";

// Staff land here when they scan a family card's QR code.
// A phone set up for a business (via its private /staff link) also gets "Apply deal" buttons.
initHeader();
const t = new URLSearchParams(location.search).get("t") || "";
const box = $("#verify");
let staffKey = null;
try { staffKey = localStorage.getItem("bf_staff_key"); } catch {}
const money = n => "£" + Number(n).toFixed(2);

const show = (kind, title, body, after = "") => {
  box.className = `verify ${kind}`;
  box.innerHTML = `<div class="v-icon" aria-hidden="true">${kind === "good" ? "✓" : kind === "warn" ? "!" : "✕"}</div><h1>${title}</h1>${body}
    <p class="note">Checked at <b id="vclock"></b></p>${after}
    <p class="note">${staffKey ? `This phone is set up for staff. <a href="/staff.html">See your numbers</a>` : `This page checks Bristol Free &amp; Affordable family cards. Members get the deals listed on our <a href="/deals.html">Deals page</a>.`}</p>`;
  const tick = () => { const el = $("#vclock"); if (el) el.textContent = new Date().toLocaleTimeString("en-GB"); };
  tick(); clearInterval(window.__vt); window.__vt = setInterval(tick, 1000);
};

const REASONS = {
  used_today: "This deal has already been used on this card today.",
  expired: "The code has expired. Ask them to open their card again and scan the new code.",
  need_bill: "Please type the bill total first.",
  not_your_deal: "That deal isn't set up for this business.",
  suspended: "This card is paused.",
  bad_key: "This phone's staff link has been switched off. Ask Bristol Free for a new one.",
};

function dealButtons(r) {
  if (!r.deals?.length) return '<div class="apply"><p class="note">No deals are set up for your business yet.</p></div>';
  return `<div class="apply" id="apply"><h2>Apply a deal</h2>${r.deals.map(d => `
    <div class="apply-row">
      <span class="deal-badge">${esc(d.badge)}</span>
      <span class="grow"><b>${esc(d.offer)}</b><span class="note">${d.kind === "percent_bill" ? `${Number(d.value)}% of the bill` : `Saves ${money(d.estimate)}`}</span></span>
      ${d.used_today ? '<span class="badge">Used today</span>' : d.kind === "percent_bill"
        ? `<span class="bill"><label class="field">Bill £<input type="number" inputmode="decimal" step="0.01" min="0" data-bill="${esc(d.id)}" data-pct="${Number(d.value)}"></label><button type="button" class="btn" data-apply="${esc(d.id)}" disabled>Apply</button></span>`
        : `<button type="button" class="btn" data-apply="${esc(d.id)}">Apply</button>`}
    </div>`).join("")}<p class="err" role="alert" hidden></p></div>`;
}

async function staffRun() {
  let r;
  if (DEMO) r = t.startsWith("demo.") || t.startsWith("sample.") ? { key_ok: true, business: "Demo business", valid: true, first_name: "Sam", deals: [
    { id: "x1", badge: "£20", offer: "£20 off weekend parties", kind: "fixed", value: 20, estimate: 20 },
    { id: "x2", badge: "10%", offer: "10% off café bill", kind: "percent_bill", value: 10 }] } : { key_ok: true, valid: false, reason: "not_a_card" };
  else {
    try { const c = await sb(); const { data, error } = await c.rpc("staff_check", { p_key: staffKey, p_token: t }); if (error) throw error; r = data; }
    catch { return show("warn", "Couldn't check right now", "<p>Please check your internet connection and scan again.</p>"); }
  }
  if (!r.key_ok) { try { localStorage.removeItem("bf_staff_key"); } catch {} staffKey = null; return publicRun(); }
  if (!r.valid) return showResult(r);
  show("good", "Valid family card", `<p class="v-name">${esc(r.first_name)}</p>`, dealButtons(r));
  const ap = $("#apply"); if (!ap) return;
  ap.addEventListener("input", e => {
    const i = e.target.closest("[data-bill]"); if (!i) return;
    const b = ap.querySelector(`[data-apply="${CSS.escape(i.dataset.bill)}"]`), v = parseFloat(i.value);
    b.disabled = !(v > 0);
    b.textContent = v > 0 ? `Apply · saves ${money(Math.round(v * i.dataset.pct) / 100)}` : "Apply";
  });
  ap.addEventListener("click", async e => {
    const b = e.target.closest("[data-apply]"); if (!b) return;
    const id = b.dataset.apply, billIn = ap.querySelector(`[data-bill="${CSS.escape(id)}"]`), err = ap.querySelector(".err");
    const bill = billIn ? parseFloat(billIn.value) : null;
    b.disabled = true; b.textContent = "Saving…";
    let res;
    if (DEMO) res = { ok: true, amount: bill ? Math.round(bill * billIn.dataset.pct) / 100 : 20, first_name: r.first_name };
    else {
      try { const c = await sb(); const { data, error } = await c.rpc("staff_redeem", { p_key: staffKey, p_token: t, p_deal: id, p_bill: bill }); if (error) throw error; res = data; }
      catch { res = { ok: false, reason: "network" }; }
    }
    if (res.ok) {
      show("good", "Deal applied", `<p class="v-name">${money(res.amount)} saved</p><p>Recorded on ${esc(res.first_name)}'s card and in your numbers.</p>`, '<p class="note" style="font-weight:700">Ready for the next card: just scan it.</p>');
    } else {
      err.textContent = REASONS[res.reason] || "That didn't go through. Please check your connection and try again.";
      err.hidden = false; b.disabled = false; b.textContent = "Apply";
    }
  });
}

function showResult(r) {
  if (r.valid) {
    const since = new Date(r.since).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    show("good", "Valid family card", `<p class="v-name">${esc(r.first_name)}</p><p>Member since ${since}</p><p class="note">The name should match the card on their screen.</p>`);
  } else if (r.reason === "expired") {
    show("warn", "This code has expired", "<p>It may be a screenshot. Ask them to open their card again and scan the new code.</p>");
  } else if (r.reason === "suspended") {
    show("bad", "This card is paused", "<p>Please don't apply the member deal with this card.</p>");
  } else {
    show("bad", "Not a valid card", "<p>This code isn't from a Bristol Free &amp; Affordable family card.</p>");
  }
}

async function publicRun() {
  if (t.startsWith("sample.")) return show("good", "Valid family card", '<p class="v-name">Sam</p><p>This is the sample card, so a business can see what a scan looks like.</p>');
  let r;
  if (DEMO) r = t.startsWith("demo.") ? { valid: true, first_name: "Sam", since: new Date().toISOString() } : { valid: false, reason: "not_a_card" };
  else {
    try { const c = await sb(); const { data, error } = await c.rpc("verify_card", { t }); if (error) throw error; r = data; }
    catch { return show("warn", "Couldn't check right now", "<p>Please check your internet connection and scan again.</p>"); }
  }
  showResult(r);
}

staffKey ? staffRun() : publicRun();
