import { submitClaim } from "./data.js";
import { readForm, validEmail } from "./ui.js";

// Shared handler for the "Claim this listing" form inside the listing pop-up.
export async function handleClaim(e, listing) {
  e.preventDefault();
  const f = e.target, err = f.querySelector(".err"), btn = f.querySelector("button");
  const d = readForm(f);
  if (d.website_hp) return; // bot trap
  const problem = !d.contact_name ? "Please add your name." : !validEmail(d.email) ? "Please add a valid email address." : "";
  if (problem) { err.textContent = problem; err.hidden = false; return; }
  err.hidden = true; btn.disabled = true; btn.textContent = "Sending…";
  try {
    const r = await submitClaim({
      listing_id: String(listing.id).startsWith("demo-") ? null : listing.id,
      business_name: listing.name, contact_name: d.contact_name, email: d.email,
      phone: d.phone || null, message: d.message || null,
    });
    f.outerHTML = `<div class="ok" role="status">Thanks, ${d.contact_name.replace(/[<>&]/g, "")}! We'll be in touch to confirm you own ${listing.name.replace(/[<>&]/g, "")}.${r.demo ? " (Demo mode: nothing was sent.)" : ""}</div>`;
  } catch (x) {
    err.textContent = "Sorry, that didn't send. Please try again in a moment."; err.hidden = false;
    btn.disabled = false; btn.textContent = "Send claim request";
  }
}
