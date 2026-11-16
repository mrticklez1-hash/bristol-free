import { fetchDeals, AREAS, listingUrl, DEMO, sb } from "./data.js";
import { $, esc, initHeader, safeUrl, dealCard } from "./ui.js";
import { openSuggest } from "./suggest.js";

initHeader();
$("#suggest-deal").addEventListener("click", () => openSuggest("deal"));

let deals = [], area = "";
try { deals = await fetchDeals(); }
catch { $("#deals").innerHTML = '<div class="empty">Deals are taking a moment to load. Please refresh.</div>'; }

// Card prompt: different for signed-in members
(async () => {
  let member = false;
  if (!DEMO) { try { const c = await sb(); const { data } = await c.auth.getSession(); member = !!data.session; } catch {} }
  $("#deals-cta").innerHTML = member
    ? `<div><b>Your card is ready.</b> <span class="note">Open it at the till and staff will scan it.</span></div><a class="btn" href="/card.html">Show my card</a>`
    : `<div><b>Get your free family card.</b> <span class="note">It lives on your phone. No app, no cost.</span></div><a class="btn" href="/card.html">Get my card</a>`;
})();

const areas = [...new Set(deals.map(d => d.area))];
$("#deal-areas").innerHTML = areas.length > 1 ? [`<button type="button" class="chip on" data-a="" aria-pressed="true">All areas</button>`, ...AREAS.filter(a => areas.includes(a)).map(a => `<button type="button" class="chip" data-a="${esc(a)}" aria-pressed="false">${esc(a)}</button>`)].join("") : "";
$("#deal-areas").addEventListener("click", e => {
  const b = e.target.closest("[data-a]"); if (!b) return;
  area = b.dataset.a;
  $("#deal-areas").querySelectorAll("[data-a]").forEach(x => { const on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-pressed", String(on)); });
  render();
});

function render() {
  const list = deals.filter(d => !area || d.area === area);
  $("#deals").innerHTML = list.length ? list.map(dealCard).join("") : '<div class="empty">No deals here yet. New ones are added every week.</div>';
}
render();

$("#deals").addEventListener("click", e => {
  const b = e.target.closest("[data-deal]"); if (!b) return;
  const d = deals.find(x => String(x.id) === b.dataset.deal), last = document.activeElement, web = safeUrl(d.website);
  $("#sheet").innerHTML = `<button class="x" aria-label="Close">✕</button><div class="in">
    <span class="deal-badge big">${esc(d.badge)}</span>
    <h2 id="m-title">${esc(d.offer)}</h2>
    <span class="sub" style="font-weight:700">${esc(d.business_name)} · ${esc(d.area)}</span>
    ${d.details ? `<p>${esc(d.details)}</p>` : ""}
    <div class="claim"><b>${d.members_only ? "How to claim: show your family card at the till." : "Open to everyone, no card needed."}</b>${d.valid_until ? `<span class="note">Ends ${new Date(d.valid_until).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.</span>` : ""}</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      ${d.members_only ? '<a class="btn" href="/card.html">Open my card</a>' : ""}
      ${d.listing ? `<a class="btn ghost" href="${listingUrl(d.listing)}">About ${esc(d.listing.name)}</a>` : ""}
      ${web ? `<a class="btn ghost" href="${esc(web)}" target="_blank" rel="noopener">Website</a>` : ""}
    </div></div>`;
  const m = $("#modal"), close = () => { m.classList.remove("on"); last?.focus?.(); };
  m.classList.add("on"); m.querySelector(".x").focus();
  m.querySelector(".x").addEventListener("click", close);
  m.onclick = ev => { if (ev.target === m) close(); };
});
document.addEventListener("keydown", e => { if (e.key === "Escape") $("#modal").classList.remove("on"); });
