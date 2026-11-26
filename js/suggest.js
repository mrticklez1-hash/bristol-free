import { submitSuggestion, uploadSuggestionPhoto, AREAS } from "./data.js";
import { compressImage } from "./compress.js";
import { $, esc, readForm, validEmail } from "./ui.js";

// Public "suggest an event" / "offer a deal" form. Goes to admin > Suggestions; nothing is published automatically.
const FORMS = {
  event: {
    title: "Suggest an event",
    intro: "Tell us what's happening and we'll add it to What's on once we've checked it.",
    fields: `
      <label class="field">Event name<input name="title" required maxlength="200"></label>
      <div class="two">
        <label class="field">Date<input name="date" type="date" required></label>
        <label class="field">Time<input name="time" type="time"></label>
      </div>
      <label class="check"><input type="checkbox" name="weekly"> It happens every week</label>
      <div class="two">
        <label class="field">Venue<input name="venue" maxlength="200"></label>
        <label class="field">Postcode (optional)<input name="postcode" maxlength="10" autocomplete="off" placeholder="e.g. BS3 4EA"></label>
      </div>
      <div class="two">
        <label class="field">Area<select name="area">${AREAS.map(a => `<option>${esc(a)}</option>`).join("")}</select></label>
        <label class="field">Price<input name="price" maxlength="120" placeholder="e.g. Free, or £3 per child"></label>
      </div>
      <label class="field">Link for more info (optional)<input name="website" maxlength="300" placeholder="https://…"></label>
      <label class="field">Anything else? (optional)<textarea name="details" rows="3" maxlength="1500"></textarea></label>
      <label class="field">Photo (optional)<input type="file" name="photo" accept="image/jpeg,image/png,image/webp"><span class="note" style="font-weight:400;display:block;margin-top:6px">A photo helps your event stand out and is shown big on the event's page. We check every photo before it goes on the site.</span></label>
      <label class="check sg-photo-ok" hidden><input type="checkbox" name="photo_ok"> I took this photo or have permission to share it, and anyone who can be recognised in it (or their parent, for children) is happy for it to be on the site</label>`,
    check: d => !d.title ? "Please add the event name." : !d.date ? "Please add the date." : "",
  },
  deal: {
    title: "Offer a deal",
    intro: "Give our members money off and we'll feature you on the Deals page and in the group. We'll be in touch to confirm the details.",
    fields: `
      <label class="field">Business name<input name="business" required maxlength="200"></label>
      <label class="field">Area<select name="area">${AREAS.map(a => `<option>${esc(a)}</option>`).join("")}</select></label>
      <label class="field">Your offer<input name="offer" required maxlength="120" placeholder="e.g. 10% off weekday entry"></label>
      <label class="field">Any conditions? (optional)<textarea name="details" rows="3" maxlength="1000" placeholder="e.g. Term time only, one per family"></textarea></label>
      <label class="field">Website (optional)<input name="website" maxlength="300" placeholder="https://…"></label>`,
    check: d => !d.business ? "Please add your business name." : !d.offer ? "Please describe the offer." : "",
  },
};

export function openSuggest(kind) {
  const F = FORMS[kind], last = document.activeElement;
  $("#sheet").innerHTML = `<button class="x" aria-label="Close">✕</button>
    <form class="in" id="sg-form" novalidate>
      <h2 id="m-title">${F.title}</h2><p class="note" style="font-size:15px">${F.intro}</p>
      <input class="hp" name="website_hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      ${F.fields}
      <div class="two">
        <label class="field">Your name<input name="contact_name" required maxlength="200" autocomplete="name"></label>
        <label class="field">Your email<input name="email" type="email" required maxlength="320" autocomplete="email"></label>
      </div>
      <p class="note">We only use your email to ask about this ${kind}. It isn't shown on the site.</p>
      <p class="err" role="alert" hidden></p>
      <button class="btn">Send</button>
    </form>`;
  const m = $("#modal"), close = () => { m.classList.remove("on"); last?.focus?.(); };
  m.classList.add("on");
  m.querySelector(".x").addEventListener("click", close);
  m.onclick = e => { if (e.target === m) close(); };
  document.addEventListener("keydown", function k(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", k); } });
  const f = $("#sg-form");
  f.querySelector("input:not(.hp)").focus();
  const photoIn = f.elements.photo, okRow = f.querySelector(".sg-photo-ok");
  photoIn?.addEventListener("change", () => { okRow.hidden = !photoIn.files.length; });
  f.addEventListener("submit", async e => {
    e.preventDefault();
    const d = readForm(f), err = f.querySelector(".err"), btn = f.querySelector("button.btn");
    if (d.website_hp) return;
    const problem = F.check(d) || (!d.contact_name ? "Please add your name." : !validEmail(d.email) ? "Please add a valid email address." : "");
    if (problem) { err.textContent = problem; err.hidden = false; return; }
    const file = photoIn?.files?.[0];
    if (file && !f.elements.photo_ok.checked) { err.textContent = "Please tick the box to confirm you can share this photo, or remove the photo."; err.hidden = false; return; }
    if (file && file.size > 30 * 1024 * 1024) { err.textContent = "That photo is very large. Please choose one under 30 MB."; err.hidden = false; return; }
    const { contact_name, email, website_hp, photo, photo_ok, ...data } = d;
    if (kind === "event") data.weekly = !!f.elements.weekly.checked;
    err.hidden = true; btn.disabled = true; btn.textContent = "Sending…";
    try {
      if (file) {
        btn.textContent = "Sending photo…";
        const { file: small } = await compressImage(file);
        data.photo = await uploadSuggestionPhoto(small);
        btn.textContent = "Sending…";
      }
      const r = await submitSuggestion(kind, data, contact_name, email);
      f.innerHTML = `<h2 id="m-title">Thank you!</h2><div class="ok" role="status">We've got it, ${esc(contact_name)}. We'll check the details and add it to the site.${r.demo ? " (Demo mode: nothing was sent.)" : ""}</div><button type="button" class="btn ghost" id="sg-done">Close</button>`;
      $("#sg-done").addEventListener("click", close);
    } catch {
      err.textContent = "Sorry, that didn't send. Please try again in a moment."; err.hidden = false;
      btn.disabled = false; btn.textContent = "Send";
    }
  });
}
