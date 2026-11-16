import { fetchRecipe } from "./data.js";
import { $, esc, initHeader, recipeThumb, recipeTime, share } from "./ui.js";

initHeader();
const slug = decodeURIComponent(location.pathname.split("/recipe/")[1] || new URLSearchParams(location.search).get("r") || "").replace(/\/$/, "");
let r = null;
try { r = slug ? await fetchRecipe(slug) : null; } catch {}

if (!r) {
  $("#crumb").textContent = "Not found";
  $("#rp").innerHTML = 'We couldn\'t find that recipe. <a href="/recipes.html">See all recipes</a>.';
} else {
  document.title = `${r.title} · Bristol Free & Affordable`;
  $("#crumb").textContent = r.title;
  const facts = [r.serves && ["Serves", r.serves], r.prep_mins && ["Prep", `${r.prep_mins} mins`], r.cook_mins && ["Cook", `${r.cook_mins} mins`], r.cost_per_serving != null && ["Cost", `about £${Number(r.cost_per_serving).toFixed(2)} a portion`]].filter(Boolean);
  $("#rp").outerHTML = `<article class="lp-grid">
    <div class="lp-main">
      ${recipeThumb(r, "lp-hero")}
      ${r.photo_credit ? `<p class="note" style="margin-top:6px">${esc(r.photo_credit)}</p>` : ""}
      <span class="sub" style="font-weight:700;color:#1C5C8C;display:block;margin-top:18px">${esc((r.tags || []).join(" · ") || "Family recipe")}</span>
      <h1 class="lp-title">${esc(r.title)}</h1>
      ${r.summary ? `<p class="lp-desc">${esc(r.summary)}</p>` : ""}
      <h2 class="rp-h">Method</h2>
      <ol class="method">${(r.method || []).map(s => `<li>${esc(s)}</li>`).join("")}</ol>
      <div class="lp-actions"><button type="button" class="btn ghost" id="rp-print">Print</button><button type="button" class="btn ghost" id="rp-share" data-share="/recipe/${esc(encodeURIComponent(r.slug))}" data-title="${esc(r.title)}">Share</button></div>
    </div>
    <aside class="lp-side">
      <div class="panel lp-facts"><h2>${esc(recipeTime(r) || "At a glance")}</h2><dl>${facts.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl></div>
      <div class="panel"><h2 class="rp-h" style="margin-top:0">Ingredients</h2>
        <ul class="ingredients">${(r.ingredients || []).map((x, i) => `<li><label class="check"><input type="checkbox" id="ing${i}"> ${esc(x)}</label></li>`).join("")}</ul>
        <p class="note">Tick things off as you go.</p></div>
    </aside>
  </article>`;
  $("#rp-print").addEventListener("click", () => print());
  $("#rp-share").addEventListener("click", e => share(e.currentTarget));
}
