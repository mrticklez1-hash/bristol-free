import { DEMO, sb, AREAS, CATS, PRICE, listingUrl } from "./data.js";
import { DEMO_LISTINGS } from "./demo-data.js";
import { $, esc, initHeader, readForm } from "./ui.js";

initHeader();

let client = null, listings = [], requests = [], editing = null;
const demoStore = { listings: structuredClone(DEMO_LISTINGS), requests: [] };

/* ---------- auth ---------- */
async function start() {
  if (DEMO) {
    $("#who").textContent = "Demo mode: changes are kept on this page only until the database is connected.";
    return showApp();
  }
  client = await sb();
  const { data: { session } } = await client.auth.getSession();
  if (session) return checkAdmin(session.user);
  $("#login").hidden = false;
}
$("#login-form").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target, err = f.querySelector(".err"), d = readForm(f);
  err.hidden = true;
  const { data, error } = await client.auth.signInWithPassword({ email: d.email, password: d.password });
  if (error) { err.textContent = "That email and password didn't match."; err.hidden = false; return; }
  checkAdmin(data.user);
});
async function checkAdmin(user) {
  const { data } = await client.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!data) {
    $("#login").hidden = false;
    const err = $("#login-form .err");
    err.textContent = "You're signed in, but this account isn't an admin yet. See the README for the one-line setup.";
    err.hidden = false;
    return;
  }
  $("#who").textContent = `Signed in as ${user.email}`;
  $("#login").hidden = true;
  showApp();
}
$("#logout").addEventListener("click", async () => { if (client) await client.auth.signOut(); location.reload(); });

/* ---------- data ---------- */
async function loadAll() {
  if (DEMO) { listings = demoStore.listings; requests = demoStore.requests; return; }
  const [l, r] = await Promise.all([
    client.from("listings").select("*").order("name"),
    client.from("claim_requests").select("*").order("created_at", { ascending: false }),
  ]);
  if (l.error) throw l.error;
  listings = l.data; requests = r.data || [];
}
async function saveListing(row) {
  if (DEMO) {
    if (editing?.id) Object.assign(demoStore.listings.find(x => x.id === editing.id), row);
    else demoStore.listings.push({ ...row, id: "demo-" + Date.now() });
    return;
  }
  const q = editing?.id ? client.from("listings").update(row).eq("id", editing.id) : client.from("listings").insert(row);
  const { error } = await q;
  if (error) throw error;
}
async function deleteListing(id) {
  if (DEMO) { demoStore.listings = demoStore.listings.filter(x => x.id !== id); return; }
  const { error } = await client.from("listings").delete().eq("id", id);
  if (error) throw error;
}
async function uploadImage(file) {
  if (DEMO) return URL.createObjectURL(file);
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await client.storage.from("listing-images").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return client.storage.from("listing-images").getPublicUrl(path).data.publicUrl;
}

/* ---------- lists ---------- */
async function showApp() {
  $("#app").hidden = false;
  try { await loadAll(); } catch { $("#alist").innerHTML = '<div class="empty">Couldn\'t load listings. Check the Supabase details in js/config.js.</div>'; return; }
  renderListings(); renderRequests();
  window.__admin = { client, listings };
  window.dispatchEvent(new CustomEvent("admin-ready", { detail: window.__admin }));
}
let statusFilter = "";
function renderListings() {
  const q = $("#aq").value.toLowerCase().trim();
  const drafts = listings.filter(l => l.status === "draft").length;
  $("#dcount").textContent = drafts ? `(${drafts})` : "";
  const list = listings.filter(l => (!q || `${l.name} ${l.area}`.toLowerCase().includes(q)) && (!statusFilter || l.status === statusFilter));
  $("#alist").innerHTML = list.length ? list.map(l => `<div class="adm-row">
      ${l.image_url ? `<img src="${esc(l.image_url)}" alt="">` : '<span class="ph"></span>'}
      <div class="grow"><b>${esc(l.name)}</b><span class="sub">${esc(l.area)} · ${esc(CATS[l.category]?.n || l.category)} · ${PRICE[l.price_band]}</span></div>
      ${l.status === "draft" ? '<span class="badge draft">Draft</span>' : ""}${l.featured ? '<span class="badge">Featured</span>' : ""}${l.claimed ? '<span class="badge">Claimed</span>' : ""}${l.lat == null ? '<span class="badge draft">No map pin</span>' : ""}
      ${l.status === "draft" ? `<button class="btn" data-pub="${esc(l.id)}">Publish</button>` : `<a class="btn ghost" href="${listingUrl(l)}" target="_blank" rel="noopener">View page</a>`}<button class="btn ghost" data-edit="${esc(l.id)}">Edit</button></div>`).join("")
    : '<div class="empty">No listings yet. Click "Add listing" to create the first one.</div>';
}
function renderRequests() {
  const open = requests.filter(r => r.status === "new").length;
  $("#rcount").textContent = open ? `(${open})` : "";
  $("#rlist").innerHTML = requests.length ? requests.map(r => `<div class="adm-row">
      <div class="grow"><b>${esc(r.business_name)}</b><span class="sub">${esc(r.contact_name)} · <a href="mailto:${esc(r.email)}">${esc(r.email)}</a>${r.phone ? ` · ${esc(r.phone)}` : ""} · ${new Date(r.created_at).toLocaleDateString("en-GB")}</span>
      ${r.message ? `<p class="note" style="margin-top:4px">${esc(r.message)}</p>` : ""}
      <span class="note">${r.listing_id ? "Claim for an existing listing" : "New business wants to be listed"}</span></div>
      ${r.status === "new" ? `<span class="badge new">New</span><button class="btn ghost" data-done="${esc(r.id)}">Mark done</button>` : '<span class="badge">Done</span>'}
    </div>`).join("") : '<div class="empty">No requests yet. Claims and "list my business" forms will appear here.</div>';
}
$("#aq").addEventListener("input", renderListings);
$("#sfilter").addEventListener("click", e => {
  const b = e.target.closest("[data-s]"); if (!b) return;
  statusFilter = b.dataset.s;
  $("#sfilter").querySelectorAll("[data-s]").forEach(x => { const on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-pressed", String(on)); });
  renderListings();
});
$("#alist").addEventListener("click", async e => {
  const ed = e.target.closest("[data-edit]"); if (ed) return openEditor(listings.find(l => String(l.id) === ed.dataset.edit));
  const pb = e.target.closest("[data-pub]"); if (!pb) return;
  const l = listings.find(x => String(x.id) === pb.dataset.pub);
  pb.disabled = true; pb.textContent = "Publishing…";
  try {
    if (DEMO) l.status = "published";
    else { const { error } = await client.from("listings").update({ status: "published" }).eq("id", l.id); if (error) throw error; l.status = "published"; }
    renderListings();
  } catch { pb.disabled = false; pb.textContent = "Publish"; $("#pins-msg").textContent = `Couldn't publish ${l.name}. Please try again.`; }
});

/* fill in map pins from postcodes (postcodes.io, free, no key) */
$("#pins").addEventListener("click", async () => {
  const msg = $("#pins-msg"), btn = $("#pins");
  const todo = listings.filter(l => l.lat == null && l.postcode);
  if (!todo.length) { msg.textContent = "Every listing with a postcode already has a map pin."; return; }
  btn.disabled = true; msg.textContent = `Looking up ${todo.length} postcode${todo.length > 1 ? "s" : ""}…`;
  try {
    const r = await fetch("https://api.postcodes.io/postcodes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postcodes: todo.map(l => l.postcode) }) });
    const j = await r.json();
    let ok = 0; const missed = [];
    for (const [i, res] of (j.result || []).entries()) {
      const l = todo[i];
      if (!res.result) { missed.push(l.name); continue; }
      const lat = +res.result.latitude.toFixed(6), lng = +res.result.longitude.toFixed(6);
      if (!DEMO) { const { error } = await client.from("listings").update({ lat, lng }).eq("id", l.id); if (error) { missed.push(l.name); continue; } }
      l.lat = lat; l.lng = lng; ok++;
    }
    msg.textContent = `Placed ${ok} pin${ok === 1 ? "" : "s"}.` + (missed.length ? ` Couldn't find: ${missed.join(", ")}. Open those and tap the map instead.` : " Check them in each listing's editor if you want to fine-tune the position.");
    renderListings();
  } catch { msg.textContent = "Couldn't reach the postcode service. Please try again in a moment."; }
  finally { btn.disabled = false; }
});
$("#rlist").addEventListener("click", async e => {
  const b = e.target.closest("[data-done]"); if (!b) return;
  const r = requests.find(x => String(x.id) === b.dataset.done);
  if (!DEMO) { const { error } = await client.from("claim_requests").update({ status: "done" }).eq("id", r.id); if (error) return alert("Couldn't update that request."); }
  r.status = "done"; renderRequests();
});
// tabs
$("#tabs").addEventListener("click", e => {
  const b = e.target.closest("[data-tab]"); if (!b) return;
  $("#tabs").querySelectorAll("[data-tab]").forEach(x => { const on = x === b; x.setAttribute("aria-selected", String(on)); x.classList.toggle("on", on); document.getElementById("pane-" + x.dataset.tab).hidden = !on; });
});
$("#tabs [data-tab=l]").classList.add("on");

/* ---------- editor ---------- */
$("#e-cat").innerHTML = Object.entries(CATS).map(([k, c]) => `<option value="${k}">${esc(c.n)}</option>`).join("");
$("#e-area").innerHTML = AREAS.map(a => `<option>${esc(a)}</option>`).join("");
let emap = null, pin = null, pendingFile = null;
async function ensureMap() {
  if (!window.L) await new Promise((res, rej) => { const s = document.createElement("script"); s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; s.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="; s.crossOrigin = ""; s.onload = res; s.onerror = rej; document.head.append(s); });
  if (emap) return;
  emap = L.map("emap").setView([51.47, -2.6], 10);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(emap);
  emap.on("click", e => setPin(e.latlng.lat, e.latlng.lng));
}
function setPin(lat, lng, zoom) {
  if (!pin) { pin = L.marker([lat, lng], { draggable: true }).addTo(emap); }
  else pin.setLatLng([lat, lng]);
  if (zoom) emap.setView([lat, lng], zoom);
  $("#pin-note").textContent = `Pin placed at ${lat.toFixed(5)}, ${lng.toFixed(5)}. Drag it to adjust.`;
}
async function openEditor(l) {
  editing = l || null; pendingFile = null;
  const f = $("#eform"); f.reset(); f.querySelector(".err").hidden = true;
  $("#e-title").textContent = l ? `Edit ${l.name}` : "Add a listing";
  $("#e-del").hidden = !l;
  const v = l || { category: "outdoors", area: AREAS[0], price_band: 0, ages: [], status: "published" };
  for (const k of ["name", "description", "address", "postcode", "website", "phone", "opening_hours", "image_url", "photo_credit"]) f.elements[k].value = v[k] || "";
  f.elements.category.value = v.category; f.elements.area.value = v.area; f.elements.price_band.value = String(v.price_band ?? 0);
  f.querySelectorAll("input[name=ages]").forEach(c => c.checked = (v.ages || []).includes(c.value));
  f.elements.published.checked = v.status !== "draft"; f.elements.claimed.checked = !!v.claimed; f.elements.featured.checked = !!v.featured;
  showPreview(v.image_url);
  $("#emodal").classList.add("on");
  f.elements.name.focus();
  await ensureMap();
  setTimeout(() => {
    emap.invalidateSize();
    if (pin) { pin.remove(); pin = null; }
    if (typeof v.lat === "number") setPin(v.lat, v.lng, 15);
    else { emap.setView([51.47, -2.6], 10); $("#pin-note").textContent = "Tap the map or use Find to place the pin. You can drag the pin to adjust it."; }
  }, 60);
}
function showPreview(src) { const i = $("#e-prev"); i.hidden = !src; if (src) i.src = src; }
const closeEditor = () => $("#emodal").classList.remove("on");
$("#add").addEventListener("click", () => openEditor(null));
$("#ex").addEventListener("click", closeEditor);
$("#e-cancel").addEventListener("click", closeEditor);
$("#emodal").addEventListener("click", e => { if (e.target.id === "emodal") closeEditor(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeEditor(); });
$("#e-file").addEventListener("change", e => {
  const file = e.target.files[0]; if (!file) return;
  if (file.size > 5 * 1024 * 1024) { const er = $("#eform .err"); er.textContent = "Please choose a photo under 5 MB."; er.hidden = false; e.target.value = ""; return; }
  pendingFile = file; showPreview(URL.createObjectURL(file));
});
$("#pc-find").addEventListener("click", async () => {
  const pc = $("#eform").elements.postcode.value.trim(), er = $("#eform .err");
  if (!pc) { er.textContent = "Type a postcode first."; er.hidden = false; return; }
  try {
    const r = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`);
    const j = await r.json();
    if (j.status !== 200) throw 0;
    er.hidden = true; setPin(j.result.latitude, j.result.longitude, 16);
  } catch { er.textContent = "Couldn't find that postcode. Tap the map to place the pin instead."; er.hidden = false; }
});
$("#eform").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target, er = f.querySelector(".err"), btn = $("#e-save");
  const d = readForm(f);
  if (!d.name) { er.textContent = "Please add a name."; er.hidden = false; return; }
  if (d.website && !/^https?:\/\//i.test(d.website)) d.website = "https://" + d.website;
  btn.disabled = true; btn.textContent = "Saving…"; er.hidden = true;
  try {
    let image_url = d.image_url || null;
    if (pendingFile) image_url = await uploadImage(pendingFile);
    const ll = pin ? pin.getLatLng() : null;
    const row = {
      name: d.name, category: d.category, area: d.area, description: d.description || null,
      address: d.address || null, postcode: d.postcode ? d.postcode.toUpperCase() : null,
      website: d.website || null, phone: d.phone || null, opening_hours: d.opening_hours || null,
      price_band: +d.price_band, ages: [...f.querySelectorAll("input[name=ages]:checked")].map(c => c.value),
      image_url, photo_credit: d.photo_credit || null, lat: ll ? +ll.lat.toFixed(6) : null, lng: ll ? +ll.lng.toFixed(6) : null,
      status: f.elements.published.checked ? "published" : "draft",
      claimed: f.elements.claimed.checked, featured: f.elements.featured.checked,
    };
    await saveListing(row);
    closeEditor(); await loadAll(); renderListings();
  } catch (x) {
    er.textContent = "Couldn't save. " + (x?.message || "Please try again."); er.hidden = false;
  } finally { btn.disabled = false; btn.textContent = "Save"; }
});
$("#e-del").addEventListener("click", async () => {
  if (!editing) return;
  if (!confirm(`Delete ${editing.name}? This can't be undone.`)) return;
  try { await deleteListing(editing.id); closeEditor(); await loadAll(); renderListings(); }
  catch { const er = $("#eform .err"); er.textContent = "Couldn't delete that listing."; er.hidden = false; }
});

start();
