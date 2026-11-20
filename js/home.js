import { fetchListings, fetchEvents, fetchDeals, fetchRecipes, occurrences, AREAS, CATS, PRICE, listingUrl, dealIndex } from "./data.js";
import { $, card, initHeader, openListing, wireModal, esc, dealCard, recipeCard } from "./ui.js";
import { handleClaim } from "./claim.js";

initHeader();
wireModal();

const over = () => document.body.classList.toggle("over", window.scrollY < 40);
window.addEventListener("scroll", over, { passive: true });
over();

$("#h-area").insertAdjacentHTML("beforeend", AREAS.map(a => `<option>${esc(a)}</option>`).join(""));
$("#area-links").innerHTML = AREAS.map(a => `<a class="chip" href="/directory.html?area=${encodeURIComponent(a)}">${esc(a)}</a>`).join("");
$("#cat-links").innerHTML = Object.entries(CATS).map(([k, c]) => `<a class="chip" href="/directory.html?cat=${k}">${esc(c.n)}</a>`).join("");

let all = [];
try {
  all = await fetchListings();
  dealIndex().then(find => all.forEach(x => { x._deal = !!find(x); })).catch(() => {});
} catch (e) {
  $("#free").innerHTML = '<div class="empty">Listings are taking a moment to load. Please refresh.</div>';
}
const free = all.filter(l => l.price_band === 0).sort((a, b) => !!b.image_url - !!a.image_url).slice(0, 4);
const feat = all.filter(l => l.featured && l.price_band > 0).slice(0, 4);
$("#free").innerHTML = free.map(card).join("") || '<div class="empty">Free listings coming soon.</div>';
$("#featured").innerHTML = feat.map(card).join("") || '<div class="empty">Featured places coming soon.</div>';

document.addEventListener("click", e => {
  const b = e.target.closest(".card[data-id]");
  if (!b) return;
  const l = all.find(x => String(x.id) === b.dataset.id);
  if (l) openListing(l, { onClaim: handleClaim });
});

// What's on, deals and recipes strips (each fails quietly on its own)
const today = new Date(); today.setHours(0, 0, 0, 0);
fetchEvents().then(ev => {
  const week = new Date(today.getTime() + 8 * 86400000);
  const list = occurrences(ev, new Date(), week).slice(0, 4);
  $("#h-events").innerHTML = list.length ? `<div class="ev-strip">${list.map(o => `<a class="ev mini" href="/whats-on.html">
    <div class="ev-date" aria-hidden="true"><b>${o.at.getDate()}</b><span>${o.at.toLocaleDateString("en-GB", { month: "short" })}</span></div>
    <div class="ev-body"><h3>${esc(o.title)}</h3><span class="sub">${o.at.toLocaleDateString("en-GB", { weekday: "short" })} ${o.at.getHours() % 12 || 12}${o.at.getMinutes() ? ":" + String(o.at.getMinutes()).padStart(2, "0") : ""}${o.at.getHours() < 12 ? "am" : "pm"} · ${esc(o.area)}</span>
    ${o.price_band === 0 ? '<span class="tagpill free">Free</span>' : `<span class="tagpill">${esc(o.price_note || PRICE[o.price_band])}</span>`}</div></a>`).join("")}</div>`
    : '<div class="empty">New events are added every week. <a href="/whats-on.html">See the calendar</a>.</div>';
}).catch(() => $("#h-events").closest("section").remove());
fetchDeals().then(d => {
  if (!d.length) return $("#h-deals").closest("section").remove();
  $("#h-deals").innerHTML = d.slice(0, 3).map(dealCard).join("");
  $("#h-deals").addEventListener("click", () => location.href = "/deals.html");
}).catch(() => $("#h-deals").closest("section").remove());
fetchRecipes().then(r => {
  if (!r.length) return $("#h-recipes").closest("section").remove();
  $("#h-recipes").innerHTML = r.slice(0, 4).map(recipeCard).join("");
}).catch(() => $("#h-recipes").closest("section").remove());
