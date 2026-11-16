// Admin: What's on, Deals, Recipes, Suggestions and Members.
import { DEMO, AREAS, PRICE } from "./data.js";
import { DEMO_EVENTS, DEMO_DEALS, DEMO_RECIPES } from "./demo-extra.js";
import { $, esc } from "./ui.js";

let client = null, listings = [];
const store = { events: [], deals: [], recipes: [], suggestions: [], members: [] };
const demo = {
  events: structuredClone(DEMO_EVENTS).map(x => ({ ...x, status: "published" })),
  deals: structuredClone(DEMO_DEALS).map(x => ({ ...x, status: "published" })),
  recipes: structuredClone(DEMO_RECIPES).map(x => ({ ...x, status: "published" })),
  suggestions: [{ id: "s1", kind: "event", status: "new", contact_name: "Jo", email: "jo@example.com", created_at: new Date().toISOString(), data: { title: "Toddler disco", date: new Date().toISOString().slice(0, 10), time: "10:00", weekly: true, venue: "Hanham Folk Centre", area: "East Bristol", price: "£3 per child" } }],
  members: [{ user_id: "m1", first_name: "Sam", status: "active", created_at: new Date().toISOString() }],
};

/* ---------- small helpers ---------- */
const pad = n => String(n).padStart(2, "0");
const localDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const localTime = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fmt = d => new Date(d).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const lines = s => String(s || "").split("\n").map(x => x.trim()).filter(Boolean);
const fixUrl = u => (u && !/^https?:\/\//i.test(u) ? "https://" + u : u) || null;
const listingOptions = () => `<option value="">Not linked</option>` + listings.slice().sort((a, b) => a.name.localeCompare(b.name)).map(l => `<option value="${esc(l.id)}">${esc(l.name)} (${esc(l.area)})</option>`).join("");
const areaOptions = () => AREAS.map(a => `<option>${esc(a)}</option>`).join("");
const priceOptions = () => PRICE.map((p, i) => `<option value="${i}">${p}</option>`).join("");
const ageBoxes = () => [["baby", "Babies"], ["toddler", "Toddlers"], ["kids", "Kids"], ["teen", "Teens"]].map(([v, t]) => `<label class="check"><input type="checkbox" name="ages" value="${v}"> ${t}</label>`).join("");

/* ---------- forms for each type ---------- */
const TYPES = {
  events: {
    label: "event",
    form: () => `
      <label class="field">Event name<input name="title" required maxlength="200"></label>
      <div class="claim-two"><label class="field">Linked listing (optional)<select name="listing_id">${listingOptions()}</select></label><label class="field">Area<select name="area">${areaOptions()}</select></label></div>
      <label class="field">Venue<input name="venue" maxlength="200" placeholder="e.g. Central Library, College Green"></label>
      <div class="claim-two"><label class="field">Date<input name="date" type="date" required></label><label class="field">Repeats weekly until (leave blank for a one-off)<input name="repeat_until" type="date"></label></div>
      <div class="claim-two"><label class="field">Starts<input name="start" type="time"></label><label class="field">Ends<input name="end" type="time"></label></div>
      <div class="claim-two"><label class="field">Price<select name="price_band">${priceOptions()}</select></label><label class="field">Price details (optional)<input name="price_note" maxlength="120" placeholder="e.g. £3 per child, under-2s free"></label></div>
      <fieldset class="field"><legend>Ages</legend><div class="chips" style="gap:12px">${ageBoxes()}</div></fieldset>
      <label class="field">Description<textarea name="description" rows="3" maxlength="2000"></textarea></label>
      <label class="field">Link for more info<input name="website" maxlength="300" placeholder="https://…"></label>`,
    fill: (f, v) => {
      const at = v.starts_at ? new Date(v.starts_at) : null, end = v.ends_at ? new Date(v.ends_at) : null;
      set(f, { title: v.title, listing_id: v.listing_id || "", area: v.area || AREAS[0], venue: v.venue, date: at ? localDate(at) : v.date || "", start: at ? localTime(at) : v.time || "", end: end ? localTime(end) : "", repeat_until: v.repeat_until || "", price_band: String(v.price_band ?? 0), price_note: v.price_note, description: v.description, website: v.website });
      f.querySelectorAll("input[name=ages]").forEach(c => c.checked = (v.ages || []).includes(c.value));
    },
    read: (f, d) => {
      if (!d.title) return "Please add the event name.";
      if (!d.date) return "Please add the date.";
      const starts = new Date(`${d.date}T${d.start || "00:00"}`), ends = d.end ? new Date(`${d.date}T${d.end}`) : null;
      if (ends && ends < starts) return "The end time is before the start time.";
      if (d.repeat_until && d.repeat_until < d.date) return "'Repeats weekly until' is before the first date.";
      return { title: d.title, listing_id: d.listing_id || null, area: d.area, venue: d.venue || null, starts_at: starts.toISOString(), ends_at: ends ? ends.toISOString() : null, repeat_until: d.repeat_until || null, price_band: +d.price_band, price_note: d.price_note || null, ages: [...f.querySelectorAll("input[name=ages]:checked")].map(c => c.value), description: d.description || null, website: fixUrl(d.website) };
    },
    row: v => {
      const past = new Date(v.repeat_until ? v.repeat_until + "T23:59" : v.ends_at || v.starts_at) < new Date();
      return { cls: past ? "past" : "", title: v.title, sub: `${fmt(v.starts_at)}${v.repeat_until ? `, weekly until ${new Date(v.repeat_until).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""} · ${v.venue ? v.venue + " · " : ""}${v.area}`, badges: (past ? '<span class="badge">Past</span>' : "") + (v.price_band === 0 ? '<span class="badge open">Free</span>' : "") };
    },
    sort: (a, b) => new Date(a.starts_at) - new Date(b.starts_at),
  },
  deals: {
    label: "deal",
    form: () => `
      <div class="claim-two"><label class="field">Linked listing (optional)<select name="listing_id">${listingOptions()}</select></label><label class="field">Area<select name="area">${areaOptions()}</select></label></div>
      <label class="field">Business name<input name="business_name" required maxlength="200"></label>
      <div class="claim-two"><label class="field">Big badge (up to 8 characters)<input name="badge" required maxlength="8" placeholder="10%, FREE, £20"></label><label class="field">Offer<input name="offer" required maxlength="120" placeholder="10% off weekday entry"></label></div>
      <label class="field">Details and conditions<textarea name="details" rows="3" maxlength="1000" placeholder="e.g. Term time only. One per family per visit."></textarea></label>
      <div class="claim-two"><label class="field">Ends on (optional)<input name="valid_until" type="date"></label><label class="field">Website<input name="website" maxlength="300" placeholder="https://…"></label></div>
      <label class="check"><input type="checkbox" name="members_only" checked> Members only: show the family card to claim</label>`,
    fill: (f, v) => { set(f, { listing_id: v.listing_id || "", area: v.area || AREAS[0], business_name: v.business_name || v.business, badge: v.badge, offer: v.offer, details: v.details, valid_until: v.valid_until || "", website: v.website }); f.elements.members_only.checked = v.members_only !== false; },
    read: (f, d) => {
      if (!d.business_name) return "Please add the business name.";
      if (!d.badge || !d.offer) return "Please add the badge and the offer.";
      return { listing_id: d.listing_id || null, area: d.area, business_name: d.business_name, badge: d.badge.toUpperCase(), offer: d.offer, details: d.details || null, valid_until: d.valid_until || null, website: fixUrl(d.website), members_only: f.elements.members_only.checked };
    },
    row: v => { const ended = v.valid_until && v.valid_until < localDate(new Date()); return { cls: ended ? "past" : "", title: `${v.badge} · ${v.offer}`, sub: `${v.business_name} · ${v.area}${v.valid_until ? ` · ends ${new Date(v.valid_until).toLocaleDateString("en-GB")}` : ""}`, badges: (ended ? '<span class="badge">Ended</span>' : "") + (v.members_only ? '<span class="badge">Card</span>' : '<span class="badge open">Everyone</span>') }; },
    sort: (a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")),
  },
  recipes: {
    label: "recipe",
    form: () => `
      <label class="field">Recipe name<input name="title" required maxlength="200"></label>
      <label class="field">Short intro<textarea name="summary" rows="2" maxlength="600"></textarea></label>
      <div class="claim-two"><label class="field">Serves<input name="serves" type="number" min="1" max="20"></label><label class="field">Cost per portion (£)<input name="cost_per_serving" type="number" step="0.01" min="0" max="99"></label></div>
      <div class="claim-two"><label class="field">Prep (minutes)<input name="prep_mins" type="number" min="0" max="600"></label><label class="field">Cook (minutes)<input name="cook_mins" type="number" min="0" max="600"></label></div>
      <label class="field">Ingredients (one per line)<textarea name="ingredients" rows="6"></textarea></label>
      <label class="field">Method (one step per line)<textarea name="method" rows="6"></textarea></label>
      <label class="field">Tags (comma separated)<input name="tags" maxlength="200" placeholder="Vegetarian, Under 20 mins, Freezer friendly"></label>
      <div class="claim-two"><label class="field">Photo<input type="file" name="file" accept="image/jpeg,image/png,image/webp"></label><label class="field">…or photo link<input name="image_url" maxlength="500"></label></div>
      <label class="field">Photo credit (if needed)<input name="photo_credit" maxlength="300"></label>`,
    fill: (f, v) => set(f, { title: v.title, summary: v.summary, serves: v.serves ?? "", cost_per_serving: v.cost_per_serving ?? "", prep_mins: v.prep_mins ?? "", cook_mins: v.cook_mins ?? "", ingredients: (v.ingredients || []).join("\n"), method: (v.method || []).join("\n"), tags: (v.tags || []).join(", "), image_url: v.image_url, photo_credit: v.photo_credit }),
    read: (f, d) => {
      if (!d.title) return "Please add the recipe name.";
      const num = k => (d[k] === "" ? null : +d[k]);
      return { title: d.title, summary: d.summary || null, serves: num("serves"), cost_per_serving: num("cost_per_serving"), prep_mins: num("prep_mins"), cook_mins: num("cook_mins"), ingredients: lines(d.ingredients), method: lines(d.method), tags: d.tags.split(",").map(t => t.trim()).filter(Boolean), image_url: d.image_url || null, photo_credit: d.photo_credit || null };
    },
    row: v => ({ title: v.title, sub: [v.serves && `Serves ${v.serves}`, v.cost_per_serving != null && `£${Number(v.cost_per_serving).toFixed(2)} a portion`, (v.tags || []).join(", ")].filter(Boolean).join(" · "), badges: "", link: v.slug && v.status === "published" ? `/recipe/${encodeURIComponent(v.slug)}` : "" }),
    sort: (a, b) => a.title.localeCompare(b.title),
  },
};
function set(f, vals) { for (const [k, v] of Object.entries(vals)) if (f.elements[k]) f.elements[k].value = v ?? ""; }

/* ---------- data ---------- */
async function load(table) {
  if (DEMO) { store[table] = demo[table]; return; }
  const q = table === "members" ? client.from("members").select("user_id, first_name, status, created_at").order("created_at", { ascending: false })
    : client.from(table).select("*").order("created_at", { ascending: false });
  const { data, error } = await q;
  store[table] = error ? [] : data;
}
async function save(table, id, row) {
  if (DEMO) {
    if (id) Object.assign(demo[table].find(x => x.id === id), row);
    else demo[table].push({ ...row, id: "demo-" + Date.now(), slug: row.title ? row.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") : undefined });
    return;
  }
  const { error } = id ? await client.from(table).update(row).eq("id", id) : await client.from(table).insert(row);
  if (error) throw error;
}
async function remove(table, id) {
  if (DEMO) { demo[table] = demo[table].filter(x => x.id !== id); return; }
  const { error } = await client.from(table).delete().eq("id", id);
  if (error) throw error;
}
async function uploadImage(file) {
  if (DEMO) return URL.createObjectURL(file);
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `recipes/${crypto.randomUUID()}.${ext}`;
  const { error } = await client.storage.from("listing-images").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return client.storage.from("listing-images").getPublicUrl(path).data.publicUrl;
}

/* ---------- lists ---------- */
function renderList(table) {
  const T = TYPES[table], items = store[table].slice().sort(T.sort);
  $(`#list-${table}`).innerHTML = items.length ? items.map(v => {
    const r = T.row(v);
    return `<div class="adm-row ${r.cls || ""}"><div class="grow"><b>${esc(r.title)}</b><span class="sub">${esc(r.sub)}</span></div>${r.badges}
      ${v.status === "draft" ? `<span class="badge draft">Draft</span><button class="btn" data-pub="${table}:${esc(v.id)}">Publish</button>` : r.link ? `<a class="btn ghost" href="${r.link}" target="_blank" rel="noopener">View</a>` : ""}
      <button class="btn ghost" data-edit="${table}:${esc(v.id)}">Edit</button></div>`;
  }).join("") : `<div class="empty">No ${T.label}s yet.</div>`;
}
function renderSugg() {
  const s = store.suggestions, open = s.filter(x => x.status === "new").length;
  $("#scount").textContent = open ? `(${open})` : "";
  $("#list-sugg").innerHTML = s.length ? s.map(x => {
    const d = x.data || {}, title = x.kind === "event" ? d.title : `${d.business}: ${d.offer}`;
    const rest = Object.entries(d).filter(([k]) => !["title", "business", "offer"].includes(k) && d[k] !== "" && d[k] !== false).map(([k, v]) => `${k}: ${v === true ? "yes" : v}`).join("\n");
    return `<div class="adm-row ${x.status === "done" ? "past" : ""}"><div class="grow"><b>${x.kind === "event" ? "Event" : "Deal"} · ${esc(title)}</b>
      <span class="sub">From ${esc(x.contact_name)} · <a href="mailto:${esc(x.email)}">${esc(x.email)}</a> · ${new Date(x.created_at).toLocaleDateString("en-GB")}</span><pre>${esc(rest)}</pre></div>
      ${x.status === "new" ? `<button class="btn" data-use="${esc(x.id)}">Add as ${x.kind}</button><button class="btn ghost" data-sdone="${esc(x.id)}">Mark done</button>` : '<span class="badge">Done</span>'}</div>`;
  }).join("") : '<div class="empty">No suggestions yet. The "Suggest an event" and "Offer a deal" forms send them here.</div>';
}
function renderMembers() {
  const m = store.members;
  $("#mcount").textContent = m.length ? `(${m.length})` : "";
  $("#list-members").innerHTML = m.length ? m.map(x => `<div class="adm-row ${x.status !== "active" ? "past" : ""}"><div class="grow"><b>${esc(x.first_name)}</b><span class="sub">Joined ${new Date(x.created_at).toLocaleDateString("en-GB")}</span></div>
    ${x.status === "active" ? `<button class="btn ghost" data-pause="${esc(x.user_id)}">Pause card</button>` : `<span class="badge draft">Paused</span><button class="btn ghost" data-unpause="${esc(x.user_id)}">Unpause</button>`}</div>`).join("")
    : '<div class="empty">No family cards yet. Families get one at /card.html.</div>';
}

/* ---------- editor ---------- */
let editing = null; // { table, item, fromSuggestion }
function openEditor(table, item, fromSuggestion) {
  const T = TYPES[table], f = $("#cform");
  editing = { table, item, fromSuggestion };
  f.innerHTML = `<h2 id="c-title">${item?.id ? `Edit ${T.label}` : `Add ${T.label === "event" ? "an" : "a"} ${T.label}`}</h2>${T.form()}
    <label class="check"><input type="checkbox" name="published"> Published (visible on the site)</label>
    <p class="err" role="alert" hidden></p>
    <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:space-between">
      <button type="button" class="btn danger" id="c-del" ${item?.id ? "" : "hidden"}>Delete</button>
      <span style="display:flex;gap:10px"><button type="button" class="btn ghost" id="c-cancel">Cancel</button><button class="btn" id="c-save">Save</button></span>
    </div>`;
  T.fill(f, item || {});
  f.elements.published.checked = item?.id ? item.status !== "draft" : true;
  // linking a listing fills in the area (and business name for deals)
  f.elements.listing_id?.addEventListener("change", () => {
    const l = listings.find(x => String(x.id) === f.elements.listing_id.value); if (!l) return;
    f.elements.area.value = l.area;
    if (f.elements.business_name && !f.elements.business_name.value) f.elements.business_name.value = l.name;
    if (f.elements.venue && !f.elements.venue.value) f.elements.venue.value = l.name;
  });
  $("#c-cancel").addEventListener("click", close);
  $("#c-del").addEventListener("click", async () => {
    if (!confirm(`Delete this ${T.label}? This can't be undone.`)) return;
    try { await remove(table, item.id); close(); await load(table); renderList(table); } catch { showErr("Couldn't delete it."); }
  });
  $("#cmodal").classList.add("on");
  f.querySelector("input:not([type=hidden]),select").focus();
}
const close = () => $("#cmodal").classList.remove("on");
const showErr = m => { const e = $("#cform .err"); e.textContent = m; e.hidden = false; };
$("#cx").addEventListener("click", close);
$("#cmodal").addEventListener("click", e => { if (e.target.id === "cmodal") close(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });

$("#cform").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target, { table, item, fromSuggestion } = editing, T = TYPES[table], btn = $("#c-save");
  const d = Object.fromEntries([...new FormData(f).entries()].filter(([, v]) => typeof v === "string").map(([k, v]) => [k, v.trim()]));
  const row = T.read(f, d);
  if (typeof row === "string") return showErr(row);
  row.status = f.elements.published.checked ? "published" : "draft";
  btn.disabled = true; btn.textContent = "Saving…";
  try {
    const file = f.elements.file?.files?.[0];
    if (file) { if (file.size > 5 * 1024 * 1024) throw new Error("Please choose a photo under 5 MB."); row.image_url = await uploadImage(file); }
    await save(table, item?.id, row);
    if (fromSuggestion) await markDone(fromSuggestion);
    close(); await load(table); renderList(table);
  } catch (x) { showErr("Couldn't save. " + (x?.message || "Please try again.")); }
  finally { btn.disabled = false; btn.textContent = "Save"; }
});

async function markDone(id) {
  if (!DEMO) { const { error } = await client.from("suggestions").update({ status: "done" }).eq("id", id); if (error) throw error; }
  store.suggestions.find(x => x.id === id).status = "done"; renderSugg();
}
async function setMember(id, status) {
  if (!DEMO) { const { error } = await client.from("members").update({ status }).eq("user_id", id); if (error) return alert("Couldn't change that card."); }
  store.members.find(x => x.user_id === id).status = status; renderMembers();
}

document.addEventListener("click", async e => {
  const n = e.target.closest("[data-new]"); if (n) return openEditor(n.dataset.new, null);
  const ed = e.target.closest("[data-edit]");
  if (ed && ed.dataset.edit.includes(":")) { const [t, id] = ed.dataset.edit.split(":"); if (TYPES[t]) return openEditor(t, store[t].find(x => String(x.id) === id)); }
  const pb = e.target.closest("[data-pub]");
  if (pb && pb.dataset.pub.includes(":")) {
    const [t, id] = pb.dataset.pub.split(":"); pb.disabled = true;
    try { await save(t, id, { status: "published" }); await load(t); renderList(t); } catch { pb.disabled = false; }
    return;
  }
  const u = e.target.closest("[data-use]");
  if (u) {
    const s = store.suggestions.find(x => x.id === u.dataset.use), d = s.data || {};
    if (s.kind === "event") openEditor("events", { title: d.title, date: d.date, time: d.time, venue: d.venue, area: d.area, price_band: !d.price || /free/i.test(d.price) ? 0 : 1, price_note: d.price && !/^free$/i.test(d.price) ? d.price : "", website: d.website, description: d.details, status: "draft" }, s.id);
    else openEditor("deals", { business_name: d.business, area: d.area, offer: d.offer, details: d.details, website: d.website, members_only: true, status: "draft" }, s.id);
    if (s.kind === "event" && d.weekly) showErr("They said this happens every week: set 'Repeats weekly until'.");
    return;
  }
  const sd = e.target.closest("[data-sdone]"); if (sd) return markDone(sd.dataset.sdone).catch(() => alert("Couldn't update that suggestion."));
  const p = e.target.closest("[data-pause]"); if (p) return setMember(p.dataset.pause, "suspended");
  const up = e.target.closest("[data-unpause]"); if (up) return setMember(up.dataset.unpause, "active");
});

/* ---------- start once admin.js has signed in ---------- */
async function init(detail) {
  if (client !== null || (!DEMO && !detail.client)) return;
  client = detail.client || false; listings = detail.listings || [];
  await Promise.all(["events", "deals", "recipes", "suggestions", "members"].map(load));
  ["events", "deals", "recipes"].forEach(renderList); renderSugg(); renderMembers();
}
if (window.__admin) init(window.__admin);
window.addEventListener("admin-ready", e => init(e.detail));
