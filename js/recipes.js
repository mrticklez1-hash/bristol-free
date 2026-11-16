import { fetchRecipes } from "./data.js";
import { $, esc, initHeader, recipeCard } from "./ui.js";

initHeader();
let recipes = [], tag = "";
try { recipes = await fetchRecipes(); }
catch { $("#recipes").innerHTML = '<div class="empty">Recipes are taking a moment to load. Please refresh.</div>'; }

const tags = [...new Set(recipes.flatMap(r => r.tags || []))].sort();
if (tags.length) {
  $("#tags").innerHTML = [`<button type="button" class="chip on" data-t="" aria-pressed="true">All recipes</button>`, ...tags.map(t => `<button type="button" class="chip" data-t="${esc(t)}" aria-pressed="false">${esc(t)}</button>`)].join("");
  $("#tags").addEventListener("click", e => {
    const b = e.target.closest("[data-t]"); if (!b) return;
    tag = b.dataset.t;
    $("#tags").querySelectorAll("[data-t]").forEach(x => { const on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-pressed", String(on)); });
    render();
  });
}
function render() {
  const list = recipes.filter(r => !tag || (r.tags || []).includes(tag));
  $("#recipes").innerHTML = list.length ? list.map(recipeCard).join("") : '<div class="empty">Recipes coming soon.</div>';
}
render();
