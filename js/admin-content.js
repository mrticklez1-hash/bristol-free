// Admin: What's on, Deals, Recipes, Suggestions and Members.
import { DEMO, AREAS, PRICE } from "./data.js";
import { compressImage } from "./compress.js";
import { DEMO_EVENTS, DEMO_DEALS, DEMO_RECIPES } from "./demo-extra.js";
import { $, esc } from "./ui.js";

let client = null, listings = [], usage = {}, keys = [];
const store = { events: [], deals: [], recipes: [], suggestions: [], members: [] };
let invites = [], invitesReady = true;
const demo = {
  events: structuredClone(DEMO_EVENTS).map(x => ({ ...x, status: "published" })),
  deals: structuredClone(DEMO_DEALS).map(x => ({ ...x, status: "published" })),
  recipes: structuredClone(DEMO_RECIPES).map(x => ({ ...x, status: "published" })),
  suggestions: [{ id: "s1", kind: "event", status: "new", contact_name: "Jo", email: "jo@example.com", created_at: new Date().toISOString(), data: { title: "Toddler disco", date: new Date().toISOString().slice(0, 10), time: "10:00", weekly: true, venue: "Hanham Folk Centre", area: "East Bristol", price: "£3 per child" } }],
  members: [{ user_id: "m1", first_name: "Sam", status: "active", plan: "standard", created_at: new Date().toISOString() }, { user_id: "m2", first_name: "Jo", status: "active", plan: "lifetime", plan_note: "Founding tester", created_at: new Date().toISOString() }],
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
      <label class="field">Link for more info<input name="website" maxlength="300" placeholder="https://…"></label>
      <div class="claim-two"><label class="field">Photo <span class="sub">(optional; otherwise the linked listing's photo is used)</span><input type="file" name="file" accept="image/jpeg,image/png,image/webp"></label><label class="field">…or photo link<input name="image_url" maxlength="500"></label></div>`,
    fill: (f, v) => {
      const at = v.starts_at ? new Date(v.starts_at) : null, end = v.ends_at ? new Date(v.ends_at) : null;
      set(f, { title: v.title, listing_id: v.listing_id || "", area: v.area || AREAS[0], venue: v.venue, date: at ? localDate(at) : v.date || "", start: at ? localTime(at) : v.time || "", end: end ? localTime(end) : "", repeat_until: v.repeat_until || "", price_band: String(v.price_band ?? 0), price_note: v.price_note, description: v.description, website: v.website, image_url: v.image_url });
      f.querySelectorAll("input[name=ages]").forEach(c => c.checked = (v.ages || []).includes(c.value));
    },
    read: (f, d) => {
      if (!d.title) return "Please add the event name.";
      if (!d.date) return "Please add the date.";
      const starts = new Date(`${d.date}T${d.start || "00:00"}`), ends = d.end ? new Date(`${d.date}T${d.end}`) : null;
      if (ends && ends < starts) return "The end time is before the start time.";
      if (d.repeat_until && d.repeat_until < d.date) return "'Repeats weekly until' is before the first date.";
      return { title: d.title, listing_id: d.listing_id || null, area: d.area, venue: d.venue || null, starts_at: starts.toISOString(), ends_at: ends ? ends.toISOString() : null, repeat_until: d.repeat_until || null, price_band: +d.price_band, price_note: d.price_note || null, ages: [...f.querySelectorAll("input[name=ages]:checked")].map(c => c.value), description: d.description || null, website: fixUrl(d.website), image_url: d.image_url || null };
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
      <fieldset class="field kindset"><legend>How is the saving worked out when staff scan a card?</legend>
        <label class="check"><input type="radio" name="kind" value="fixed" checked> A fixed amount (e.g. £20 off, or a free class worth £8)</label>
        <label class="check"><input type="radio" name="kind" value="percent_item"> A percentage off something with a set price (e.g. 10% off £12 entry)</label>
        <label class="check"><input type="radio" name="kind" value="percent_bill"> A percentage off the bill (staff type the bill total)</label>
        <div class="claim-two">
          <label class="field"><span id="value-label">Amount saved (£)</span><input name="value" type="number" step="0.01" min="0.01"></label>
          <label class="field" id="item-wrap" hidden>Set price (£)<input name="item_price" type="number" step="0.01" min="0.01"></label>
        </div>
        <p class="note" id="saves-note"></p>
      </fieldset>
      <label class="field">Details and conditions<textarea name="details" rows="3" maxlength="1000" placeholder="e.g. Term time only. One per family per visit."></textarea></label>
      <div class="claim-two"><label class="field">Ends on (optional)<input name="valid_until" type="date"></label><label class="field">Website<input name="website" maxlength="300" placeholder="https://…"></label></div>
      <label class="check"><input type="checkbox" name="members_only" checked> Members only: show the family card to claim</label>`,
    fill: (f, v) => {
      set(f, { listing_id: v.listing_id || "", area: v.area || AREAS[0], business_name: v.business_name || v.business, badge: v.badge, offer: v.offer, details: v.details, valid_until: v.valid_until || "", website: v.website, value: v.value ?? "", item_price: v.item_price ?? "" });
      f.elements.members_only.checked = v.members_only !== false;
      const k = v.kind || "fixed"; f.querySelectorAll("input[name=kind]").forEach(r => r.checked = r.value === k);
      const upd = () => {
        const kind = f.querySelector("input[name=kind]:checked").value, val = parseFloat(f.elements.value.value), price = parseFloat(f.elements.item_price.value);
        $("#value-label").textContent = kind === "fixed" ? "Amount saved (£)" : "Percentage off (%)";
        $("#item-wrap").hidden = kind !== "percent_item";
        $("#saves-note").textContent = kind === "fixed" && val > 0 ? `Each scan records £${val.toFixed(2)} saved.`
          : kind === "percent_item" && val > 0 && price > 0 ? `Each scan records £${(Math.round(price * val) / 100).toFixed(2)} saved.`
          : kind === "percent_bill" && val > 0 ? `Staff type the bill; a £20 bill records £${(Math.round(20 * val) / 100).toFixed(2)} saved.` : "";
      };
      f.querySelector(".kindset").addEventListener("input", upd); upd();
    },
    read: (f, d) => {
      if (!d.business_name) return "Please add the business name.";
      if (!d.badge || !d.offer) return "Please add the badge and the offer.";
      const kind = f.querySelector("input[name=kind]:checked").value, value = parseFloat(d.value), item = parseFloat(d.item_price);
      if (!(value > 0)) return kind === "fixed" ? "Please add the amount saved, in pounds." : "Please add the percentage off.";
      if (kind !== "fixed" && value > 100) return "The percentage can't be more than 100.";
      if (kind === "percent_item" && !(item > 0)) return "Please add the set price the percentage comes off.";
      return { listing_id: d.listing_id || null, area: d.area, business_name: d.business_name, badge: d.badge.toUpperCase(), offer: d.offer, details: d.details || null, valid_until: d.valid_until || null, website: fixUrl(d.website), members_only: f.elements.members_only.checked, kind, value, item_price: kind === "percent_item" ? item : null };
    },
    row: v => { const ended = v.valid_until && v.valid_until < localDate(new Date()), u = usage[v.id]; return { cls: ended ? "past" : "", title: `${v.badge} · ${v.offer}`, sub: `${v.business_name} · ${v.area}${v.valid_until ? ` · ends ${new Date(v.valid_until).toLocaleDateString("en-GB")}` : ""}${u ? ` · used ${u.n} time${u.n === 1 ? "" : "s"}, £${u.amt.toFixed(2)} saved` : ""}${!v.value ? " · no saving amount set yet" : ""}`, badges: (ended ? '<span class="badge">Ended</span>' : "") + (v.members_only ? '<span class="badge">Card</span>' : '<span class="badge open">Everyone</span>') }; },
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
  const q = table === "members" ? client.from("members").select("user_id, first_name, status, plan, plan_note, created_at").order("created_at", { ascending: false })
    : client.from(table).select("*").order("created_at", { ascending: false });
  let { data, error } = await q;
  if (error && table === "members") // before update-09 has been run
    ({ data, error } = await client.from("members").select("user_id, first_name, status, created_at").order("created_at", { ascending: false }));
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

async function loadUsage() {
  usage = {}; keys = [];
  if (DEMO) return;
  const [r, k] = await Promise.all([client.from("redemptions").select("deal_id, amount"), client.from("business_keys").select("id, business_name, created_at, last_used_at, revoked").order("created_at", { ascending: false })]);
  for (const x of r.data || []) { const u = usage[x.deal_id] ||= { n: 0, amt: 0 }; u.n++; u.amt += Number(x.amount); }
  keys = k.data || [];
}
function renderKeys() {
  $("#list-keys").innerHTML = keys.length ? keys.map(k => `<div class="adm-row ${k.revoked ? "past" : ""}"><div class="grow"><b>${esc(k.business_name)}</b><span class="sub">Created ${new Date(k.created_at).toLocaleDateString("en-GB")} · ${k.last_used_at ? `last used ${new Date(k.last_used_at).toLocaleDateString("en-GB")}` : "not used yet"}</span></div>
    ${k.revoked ? '<span class="badge">Switched off</span>' : `<button class="btn ghost" data-revoke="${esc(k.id)}">Switch off</button>`}</div>`).join("")
    : '<div class="empty">No staff links yet.</div>';
}
$("#new-key").addEventListener("click", () => {
  const f = $("#cform"); editing = null;
  const names = [...new Set(store.deals.map(d => d.business_name))].sort();
  f.innerHTML = `<h2 id="c-title">Create a staff link</h2>
    <p class="note" style="font-size:15px">The link lets one business apply its own deals when it scans a family card. It works on any phone or tablet they open it on.</p>
    <label class="field">Business (must match the business name on its deals)<input name="business" list="biz-names" required maxlength="200"><datalist id="biz-names">${names.map(n => `<option value="${esc(n)}">`).join("")}</datalist></label>
    <p class="err" role="alert" hidden></p>
    <div style="display:flex;gap:10px;justify-content:flex-end"><button type="button" class="btn ghost" id="c-cancel">Cancel</button><button class="btn" id="c-save">Create link</button></div>`;
  $("#c-cancel").addEventListener("click", close);
  $("#cmodal").classList.add("on"); f.elements.business.focus();
});
async function createKey(f) {
  const name = f.elements.business.value.trim(); if (!name) return showErr("Please add the business name.");
  const l = listings.find(x => x.name.toLowerCase() === name.toLowerCase());
  let k;
  if (DEMO) k = "demo-" + Math.random().toString(16).slice(2);
  else { const { data, error } = await client.rpc("new_business_key", { p_business: name, p_listing: l?.id || null }); if (error) return showErr("Couldn't create the link. " + error.message); k = data; }
  const link = `${location.origin}/staff.html?k=${k}`;
  f.innerHTML = `<h2 id="c-title">Staff link for ${esc(name)}</h2>
    <div class="ok">Send this to the business. It's only shown once, so copy it now.</div>
    <label class="field">Their private link<input readonly value="${esc(link)}" id="key-link"></label>
    <p class="note">Ask them to open it on their till phone or tablet. If it ever gets shared by mistake, switch it off here and make a new one.</p>
    <div style="display:flex;gap:10px;justify-content:flex-end"><button type="button" class="btn ghost" id="copy-key">Copy link</button><button type="button" class="btn" id="c-cancel">Done</button></div>`;
  $("#copy-key").addEventListener("click", async () => { try { await navigator.clipboard.writeText(link); $("#copy-key").textContent = "Copied"; } catch { $("#key-link").select(); } });
  $("#c-cancel").addEventListener("click", close);
  await loadUsage(); renderKeys();
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
    const rest = Object.entries(d).filter(([k]) => !["title", "business", "offer", "photo"].includes(k) && d[k] !== "" && d[k] !== false).map(([k, v]) => `${k}: ${v === true ? "yes" : v}`).join("\n");
    return `<div class="adm-row ${x.status === "done" ? "past" : ""}"><div class="grow"><b>${x.kind === "event" ? "Event" : "Deal"} · ${esc(title)}</b>
      <span class="sub">From ${esc(x.contact_name)} · <a href="mailto:${esc(x.email)}">${esc(x.email)}</a> · ${new Date(x.created_at).toLocaleDateString("en-GB")}</span><pre>${esc(rest)}</pre>${d.photo ? `<img class="sugg-photo" data-sphoto="${esc(d.photo)}" alt="Photo sent with this suggestion">` : ""}</div>
      ${x.status === "new" ? `<button class="btn" data-use="${esc(x.id)}">Add as ${x.kind}</button><button class="btn ghost" data-sdone="${esc(x.id)}">Mark done</button>` : '<span class="badge">Done</span>'}</div>`;
  }).join("") : '<div class="empty">No suggestions yet. The "Suggest an event" and "Offer a deal" forms send them here.</div>';
  // photos sent with suggestions are private: show them through short-lived links
  $("#list-sugg").querySelectorAll("[data-sphoto]").forEach(async img => {
    if (DEMO) { img.src = "/img/art.jpg"; return; }
    const { data } = await client.storage.from("suggestion-photos").createSignedUrl(img.dataset.sphoto, 3600);
    if (data?.signedUrl) img.src = data.signedUrl; else img.remove();
  });
}
// Copies a suggestion's private photo into the public photos, so it can go on the site
async function copySuggestionPhoto(path) {
  if (DEMO) return "/img/art.jpg";
  const { data, error } = await client.storage.from("suggestion-photos").download(path);
  if (error || !data) throw error || new Error("no photo");
  return uploadImage(new File([data], path.split("/").pop(), { type: data.type || "image/jpeg" }));
}
function renderMembers() {
  const m = store.members;
  $("#mcount").textContent = m.length ? `(${m.length})` : "";
  $("#list-members").innerHTML = m.length ? m.map(x => `<div class="adm-row ${x.status !== "active" ? "past" : ""}"><div class="grow"><b>${esc(x.first_name)}</b><span class="sub">Joined ${new Date(x.created_at).toLocaleDateString("en-GB")}${x.plan_note ? ` · ${esc(x.plan_note)}` : ""}</span></div>
    ${x.plan === "lifetime" ? `<span class="badge open">Lifetime</span><button class="btn ghost" data-plan="${esc(x.user_id)}:standard">Make standard</button>` : x.plan === "standard" ? `<button class="btn ghost" data-plan="${esc(x.user_id)}:lifetime">Make lifetime</button>` : ""}
    ${x.status === "active" ? `<button class="btn ghost" data-pause="${esc(x.user_id)}">Pause card</button>` : `<span class="badge draft">Paused</span><button class="btn ghost" data-unpause="${esc(x.user_id)}">Unpause</button>`}</div>`).join("")
    : '<div class="empty">No family cards yet. Families get one at /card.html.</div>';
}

async function loadInvites() {
  if (DEMO) { invites = invites.length ? invites : [{ code: "TESTER-7K2P9Q", note: "Founding tester: Jo", created_at: new Date().toISOString(), used_at: new Date().toISOString() }]; return; }
  const { data, error } = await client.from("invite_codes").select("*").order("created_at", { ascending: false });
  invitesReady = !error; invites = error ? [] : data;
}
function renderInvites() {
  if (!invitesReady) { $("#invites").innerHTML = '<h3>Lifetime card invite codes</h3><p class="note">Run <b>update-09-lifetime-cards.sql</b> in Supabase to switch this on.</p>'; return; }
  $("#list-invites").innerHTML = invites.length ? invites.map(x => `<div class="adm-row ${x.used_at ? "past" : ""}"><div class="grow"><b class="mono">${esc(x.code)}</b><span class="sub">${x.note ? esc(x.note) + " · " : ""}made ${new Date(x.created_at).toLocaleDateString("en-GB")}</span></div>
    ${x.used_at ? `<span class="badge">Used ${new Date(x.used_at).toLocaleDateString("en-GB")}</span>` : `<span class="badge open">Not used yet</span><button class="btn ghost" data-copycode="${esc(x.code)}">Copy</button><button class="btn ghost" data-delcode="${esc(x.code)}">Delete</button>`}</div>`).join("")
    : '<div class="empty">No codes yet.</div>';
}
$("#inv-form")?.addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.currentTarget, err = $("#invites .err"), btn = f.querySelector("button"), note = f.elements.note.value.trim();
  err.hidden = true; btn.disabled = true;
  let code;
  if (DEMO) { code = "TESTER-" + Math.random().toString(36).slice(2, 8).toUpperCase(); invites.unshift({ code, note, created_at: new Date().toISOString() }); }
  else {
    const { data, error } = await client.rpc("new_invite_code", { p_note: note || null });
    if (error) { err.textContent = "Couldn't make a code. Has update-09 been run?"; err.hidden = false; btn.disabled = false; return; }
    code = data; await loadInvites();
  }
  btn.disabled = false; f.reset();
  $("#inv-new").innerHTML = `<div class="ok" role="status">New code: <b class="mono">${esc(code)}</b> <button type="button" class="btn ghost" data-copycode="${esc(code)}">Copy</button><br><span class="note">Send it to them with the link: ${esc(location.origin)}/card.html</span></div>`;
  renderInvites();
});
async function setPlan(id, plan) {
  const m = store.members.find(x => x.user_id === id);
  if (plan === "standard" && !confirm(`Take ${m.first_name}'s lifetime card back to a standard card?`)) return;
  const row = { plan, plan_note: plan === "lifetime" ? (m.plan_note || "Made lifetime in admin") : null };
  if (!DEMO) { const { error } = await client.from("members").update(row).eq("user_id", id); if (error) return alert("Couldn't change that card."); }
  Object.assign(m, row); renderMembers();
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
  if (!editing) return createKey(e.target);
  const f = e.target, { table, item, fromSuggestion } = editing, T = TYPES[table], btn = $("#c-save");
  const d = Object.fromEntries([...new FormData(f).entries()].filter(([, v]) => typeof v === "string").map(([k, v]) => [k, v.trim()]));
  const row = T.read(f, d);
  if (typeof row === "string") return showErr(row);
  row.status = f.elements.published.checked ? "published" : "draft";
  btn.disabled = true; btn.textContent = "Saving…";
  try {
    const file = f.elements.file?.files?.[0];
    if (file) {
      if (file.size > 30 * 1024 * 1024) throw new Error("That photo is very large. Please choose one under 30 MB.");
      const r = await compressImage(file); // shrink before uploading
      if (r.file.size > 5 * 1024 * 1024) throw new Error("Please choose a photo under 5 MB.");
      row.image_url = await uploadImage(r.file);
    }
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
    let image_url = "";
    if (d.photo) { u.disabled = true; u.textContent = "Copying photo…"; try { image_url = await copySuggestionPhoto(d.photo); } catch { alert("Couldn't copy their photo. You can add one in the editor."); } u.disabled = false; u.textContent = `Add as ${s.kind}`; }
    if (s.kind === "event") openEditor("events", { image_url, title: d.title, date: d.date, time: d.time, venue: d.venue, area: d.area, price_band: !d.price || /free/i.test(d.price) ? 0 : 1, price_note: d.price && !/^free$/i.test(d.price) ? d.price : "", website: d.website, description: d.details, status: "draft" }, s.id);
    else openEditor("deals", { business_name: d.business, area: d.area, offer: d.offer, details: d.details, website: d.website, members_only: true, status: "draft" }, s.id);
    if (s.kind === "event" && d.weekly) showErr("They said this happens every week: set 'Repeats weekly until'.");
    return;
  }
  const rv = e.target.closest("[data-revoke]");
  if (rv) {
    if (!confirm("Switch off this staff link? That business won't be able to apply deals until you send a new one.")) return;
    if (!DEMO) { const { error } = await client.from("business_keys").update({ revoked: true }).eq("id", rv.dataset.revoke); if (error) return alert("Couldn't switch it off."); }
    await loadUsage(); return renderKeys();
  }
  const sd = e.target.closest("[data-sdone]"); if (sd) return markDone(sd.dataset.sdone).catch(() => alert("Couldn't update that suggestion."));
  const pl = e.target.closest("[data-plan]"); if (pl) { const [id, plan] = pl.dataset.plan.split(":"); return setPlan(id, plan); }
  const cc = e.target.closest("[data-copycode]");
  if (cc) { try { await navigator.clipboard.writeText(cc.dataset.copycode); cc.textContent = "Copied!"; } catch { cc.textContent = cc.dataset.copycode; } return setTimeout(() => { cc.textContent = "Copy"; }, 1800); }
  const dc = e.target.closest("[data-delcode]");
  if (dc) {
    if (!confirm(`Delete code ${dc.dataset.delcode}? It won't work after this.`)) return;
    if (!DEMO) { const { error } = await client.from("invite_codes").delete().eq("code", dc.dataset.delcode).is("used_at", null); if (error) return alert("Couldn't delete that code."); }
    invites = invites.filter(x => x.code !== dc.dataset.delcode); return renderInvites();
  }
  const p = e.target.closest("[data-pause]"); if (p) return setMember(p.dataset.pause, "suspended");
  const up = e.target.closest("[data-unpause]"); if (up) return setMember(up.dataset.unpause, "active");
});

/* ---------- start once admin.js has signed in ---------- */
async function init(detail) {
  if (client !== null || (!DEMO && !detail.client)) return;
  client = detail.client || false; listings = detail.listings || [];
  await Promise.all([...["events", "deals", "recipes", "suggestions", "members"].map(load), loadUsage(), loadInvites()]);
  ["events", "deals", "recipes"].forEach(renderList); renderSugg(); renderMembers(); renderKeys(); renderInvites();
}
if (window.__admin) init(window.__admin);
window.addEventListener("admin-ready", e => init(e.detail));
