import { eventCard } from "./event-cal.js";
import { fetchListings, fetchEvents, fetchDeals, fetchRecipes, occurrences, AREAS, CATS, CAT_GROUPS, PRICE, listingUrl, eventUrl, dealIndex } from "./data.js";
import { facilitiesIndex, yesKeys } from "./facilities.js";
import { $, card, initHeader, openListing, wireModal, esc, dealCard, recipeCard } from "./ui.js";
import { handleClaim } from "./claim.js";
import { startTour } from "./home-map.js";

initHeader();
wireModal();

const over = () => document.body.classList.toggle("over", window.scrollY < 40);
window.addEventListener("scroll", over, { passive: true });
over();

$("#h-area").insertAdjacentHTML("beforeend", AREAS.map(a => `<option>${esc(a)}</option>`).join(""));
const ARROW = '<svg class="loc-arrow" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M20.6 3.4 3.9 10.2c-.8.3-.7 1.5.1 1.7l6.6 1.5 1.5 6.6c.2.8 1.4.9 1.7.1l6.8-16.7c.3-.7-.4-1.3-1-1Z" fill="currentColor"/></svg>';
$("#area-links").innerHTML = `<a class="chip chip-near" href="/directory.html?near=1">${ARROW}Use my location</a>` + AREAS.map(a => `<a class="chip" href="/directory.html?area=${encodeURIComponent(a)}">${esc(a)}</a>`).join("");
$("#cat-links").innerHTML = CAT_GROUPS.map(g => `<div class="cat-group"><h3><a href="/directory.html?group=${g.key}">${esc(g.n)}</a></h3><div class="chips">${g.cats.map(k => `<a class="chip" href="/directory.html?cat=${k}">${esc(CATS[k].n)}</a>`).join("")}</div></div>`).join("");

let all = [];
try {
  all = await fetchListings();
  await Promise.all([dealIndex().then(find => all.forEach(x => { x._deal = !!find(x); })), facilitiesIndex(all).then(m => all.forEach(x => { x._fac = yesKeys(m.get(String(x.id))); }))]).catch(() => {});
} catch (e) {
  $("#free").innerHTML = '<div class="empty">Listings are taking a moment to load. Please refresh.</div>';
}
startTour(all, $("#tour-map"));
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
  $("#h-events").innerHTML = list.length ? `<div class="ev-cards">${list.map(eventCard).join("")}</div>`
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
