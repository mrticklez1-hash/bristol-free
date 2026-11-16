import { DEMO, sb } from "./data.js";
import { $, esc, initHeader } from "./ui.js";

// Staff land here when they scan a family card's QR code.
initHeader();
const t = new URLSearchParams(location.search).get("t") || "";
const box = $("#verify");

const show = (kind, title, body) => {
  box.className = `verify ${kind}`;
  box.innerHTML = `<div class="v-icon" aria-hidden="true">${kind === "good" ? "✓" : kind === "warn" ? "!" : "✕"}</div><h1>${title}</h1>${body}
    <p class="note">Checked at <b id="vclock"></b></p>
    <p class="note">This page checks Bristol Free &amp; Affordable family cards. Members get the deals listed on our <a href="/deals.html">Deals page</a>.</p>`;
  const tick = () => { const el = $("#vclock"); if (el) el.textContent = new Date().toLocaleTimeString("en-GB"); };
  tick(); setInterval(tick, 1000);
};

async function run() {
  let r;
  if (DEMO) r = t.startsWith("demo.") ? { valid: true, first_name: "Sam", since: new Date().toISOString() } : { valid: false, reason: "not_a_card" };
  else {
    try { const c = await sb(); const { data, error } = await c.rpc("verify_card", { t }); if (error) throw error; r = data; }
    catch { return show("warn", "Couldn't check right now", '<p>Please check your internet connection and scan again.</p>'); }
  }
  if (r.valid) {
    const since = new Date(r.since).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    show("good", "Valid family card", `<p class="v-name">${esc(r.first_name)}</p><p>Member since ${since}</p><p class="note">The name should match the card on their screen.</p>`);
  } else if (r.reason === "expired") {
    show("warn", "This code has expired", '<p>It may be a screenshot. Ask them to open their card again and scan the new code.</p>');
  } else if (r.reason === "suspended") {
    show("bad", "This card is paused", "<p>Please don't apply the member deal with this card.</p>");
  } else {
    show("bad", "Not a valid card", "<p>This code isn't from a Bristol Free &amp; Affordable family card.</p>");
  }
}
run();
