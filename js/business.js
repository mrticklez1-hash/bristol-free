import { submitClaim } from "./data.js";
import { $, initHeader, readForm, validEmail, esc } from "./ui.js";

initHeader();

$("#biz-form").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target, err = f.querySelector(".err"), btn = f.querySelector("button");
  const d = readForm(f);
  if (d.website_hp) return;
  const problem = !d.business_name ? "Please add the business name." : !d.contact_name ? "Please add your name." : !validEmail(d.email) ? "Please add a valid email address." : "";
  if (problem) { err.textContent = problem; err.hidden = false; return; }
  err.hidden = true; btn.disabled = true; btn.textContent = "Sending…";
  try {
    const r = await submitClaim({ listing_id: null, business_name: d.business_name, contact_name: d.contact_name, email: d.email, phone: d.phone || null, message: d.message || null });
    f.innerHTML = `<div class="ok" role="status">Thanks ${esc(d.contact_name)}! We'll add ${esc(d.business_name)} to the directory and email you when it's live.${r.demo ? " (Demo mode: nothing was sent.)" : ""}</div>`;
  } catch {
    err.textContent = "Sorry, that didn't send. Please try again in a moment."; err.hidden = false;
    btn.disabled = false; btn.textContent = "Send";
  }
});
