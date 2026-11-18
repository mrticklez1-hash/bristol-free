import { submitInterest, AREAS } from "./data.js";
import { $, initHeader, readForm, validEmail, esc } from "./ui.js";

initHeader();
const f = $("#int-form");
f.elements.area.insertAdjacentHTML("beforeend", [...AREAS, "Somewhere else"].map(a => `<option>${esc(a)}</option>`).join(""));
// where they came from, e.g. /join?src=fb
const src = (new URLSearchParams(location.search).get("src") || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40) || null;

f.addEventListener("submit", async e => {
  e.preventDefault();
  const err = f.querySelector(".err"), btn = f.querySelector("button");
  const d = readForm(f);
  if (d.website_hp) return;
  const use = f.querySelector("input[name=would_use]:checked")?.value;
  const problem = !d.first_name ? "Please add your first name." : !validEmail(d.email) ? "Please add a valid email address." : !use ? "Please choose Yes or Maybe." : !f.elements.consent.checked ? "Please tick the box so we can email you when it launches." : "";
  if (problem) { err.textContent = problem; err.hidden = false; return; }
  err.hidden = true; btn.disabled = true; btn.textContent = "Joining…";
  try {
    const r = await submitInterest({ first_name: d.first_name.slice(0, 40), email: d.email.trim(), would_use: use, places: (d.places || "").trim().slice(0, 500) || null, area: d.area || null, consent: true, source: src });
    f.innerHTML = `<div class="ok" role="status"><h2 style="margin:0 0 6px">${r.already ? `You're already on the list, ${esc(d.first_name)}!` : `You're on the list, ${esc(d.first_name)}!`}</h2>We'll email you as soon as the family card launches.${r.demo ? " (Demo mode: nothing was saved.)" : ""}</div>
      <p class="note">Know other Bristol parents who'd like it?</p>
      <button type="button" class="btn ghost" data-share="/join" data-title="The Bristol family card is coming">Share with a friend</button>`;
    f.querySelector("[data-share]").addEventListener("click", ev => import("./ui.js").then(m => m.share(ev.currentTarget)));
  } catch {
    err.textContent = "Sorry, that didn't send. Please try again in a moment."; err.hidden = false;
    btn.disabled = false; btn.textContent = "Join the waiting list";
  }
});
