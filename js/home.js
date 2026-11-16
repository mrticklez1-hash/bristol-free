import { fetchListings, AREAS, CATS } from "./data.js";
import { $, card, initHeader, openListing, wireModal, esc } from "./ui.js";
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
