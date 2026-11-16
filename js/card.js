import { DEMO, sb, fetchDeals } from "./data.js";
import { $, esc, initHeader, readForm, validEmail } from "./ui.js";

initHeader();
const app = $("#card-app");
let client = null, timer = null, clock = null, preview = false;

const LOGO = `<svg width="40" height="40" viewBox="0 0 46 46" aria-hidden="true"><rect width="46" height="46" rx="14" fill="#fff"/><path d="M8 28 Q23 12 38 28" stroke="#1C5C8C" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M8 28 H38" stroke="#0F2A44" stroke-width="2.6" stroke-linecap="round"/><path d="M14 28 V23 M23 28 V20 M32 28 V23" stroke="#0F2A44" stroke-width="2" stroke-linecap="round"/><path d="M8 34 q3.75-2.5 7.5 0 t7.5 0 t7.5 0 t7.5 0" stroke="#1C5C8C" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;

function signInView(msg = "") {
  app.innerHTML = `<div class="card-intro">
    <div>
      <span class="pill" style="background:var(--mint-band);color:var(--mint-ink)">Free for every family</span>
      <h1>Your family card</h1>
      <p class="lead2">One card on your phone for money off at local family businesses. No app to download and nothing to pay.</p>
      <ul class="ticks"><li>Show it at the till to claim <a href="/deals.html">member deals</a></li><li>The code changes every 30 seconds, so it can't be copied</li><li>Sign in with just your email: no password to remember</li></ul>
    </div>
    <form class="panel card-form" id="signin" novalidate>
      <h2>Get your card</h2>
      <p class="note" style="font-size:15px">Enter your email and we'll send you a link. Tap it on this phone and your card appears. Already have one? Same thing: we'll send a link to sign you back in.</p>
      <label class="field">Email address<input name="email" type="email" required autocomplete="email" inputmode="email"></label>
      <p class="err" role="alert" ${msg ? "" : "hidden"}>${esc(msg)}</p>
      <button class="btn">Email me a link</button>
      <p class="note">We'll only email you about your card. We never share your details.</p>
      <button type="button" class="linkish" id="sample" style="justify-self:start">Or see a sample card first</button>
    </form>
  </div>`;
  $("#sample").addEventListener("click", showSample);
  $("#signin").addEventListener("submit", async e => {
    e.preventDefault();
    const f = e.target, err = f.querySelector(".err"), btn = f.querySelector("button"), { email } = readForm(f);
    if (!validEmail(email)) { err.textContent = "Please check your email address."; err.hidden = false; return; }
    btn.disabled = true; btn.textContent = "Sending…"; err.hidden = true;
    const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + "/card.html" } });
    if (error) {
      err.textContent = /rate|seconds/i.test(error.message) ? "Please wait a minute before asking for another link." : "Sorry, we couldn't send that. Please try again in a moment.";
      err.hidden = false; btn.disabled = false; btn.textContent = "Email me a link"; return;
    }
    f.innerHTML = `<h2>Check your email</h2><div class="ok" role="status">We've sent a link to ${esc(email)}. Open it on this phone to see your card.</div><p class="note">Nothing there after a few minutes? Check your junk folder, or <button type="button" class="linkish" id="again">try again</button>.</p>`;
    $("#again").addEventListener("click", () => signInView());
  });
}

function nameView(isChange = false, current = "") {
  app.innerHTML = `<form class="panel card-form" id="name" style="max-width:480px;margin:40px auto" novalidate>
    <h2>${isChange ? "Change the name on your card" : "Nearly there!"}</h2>
    <p class="note" style="font-size:15px">${isChange ? "" : "What name should go on your card? "}Staff will see this when they check it, so use the name you'd give at the till.</p>
    <label class="field">First name<input name="first_name" required maxlength="40" autocomplete="given-name" value="${esc(current)}"></label>
    <p class="err" role="alert" hidden></p>
    <button class="btn">${isChange ? "Save" : "Create my card"}</button>
  </form>`;
  const f = $("#name"); f.elements.first_name.focus();
  f.addEventListener("submit", async e => {
    e.preventDefault();
    const { first_name } = readForm(f), err = f.querySelector(".err");
    if (!first_name) { err.textContent = "Please add a name."; err.hidden = false; return; }
    const { error } = await client.rpc("join_card", { p_first_name: first_name });
    if (error) { err.textContent = "Sorry, that didn't save. Please try again."; err.hidden = false; return; }
    loadCard();
  });
}

function qrSvg(text) {
  const q = window.qrcode(0, "M"); q.addData(text); q.make();
  return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
}

function cardView(c) {
  const since = new Date(c.since).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  app.innerHTML = `<div class="fcard-wrap">
    <div class="fcard" aria-label="Family card for ${esc(c.first_name)}">
      <div class="fcard-top">${LOGO}<span><b>Bristol Free</b><small>Family card</small></span></div>
      <div class="fcard-name">${esc(c.first_name)}</div>
      <div class="fcard-since">Member since ${since}</div>
      <div class="fcard-qr" id="qr" role="img" aria-label="Card code for staff to scan"></div>
      <div class="fcard-live"><span class="dot" aria-hidden="true"></span><span id="clock"></span><span id="fresh">Live code</span></div>
      <div class="shimmer" aria-hidden="true"></div>
    </div>
    <p class="note" style="text-align:center">Show this screen at the till. The code changes every 30 seconds, so screenshots won't work.</p>
    <div class="fcard-actions">${preview ? '<button type="button" class="btn" id="out">Get my own card</button><a class="btn ghost" href="/deals.html">See member deals</a>' : '<a class="btn" href="/deals.html">See member deals</a><button type="button" class="btn ghost" id="rename">Change name</button><button type="button" class="btn ghost" id="out">Sign out</button>'}</div>
    <section class="panel savings" id="savings" aria-label="Your savings"><div class="lp-loading" style="padding:10px 0">Loading your savings…</div></section>
    <details class="panel tip"><summary>Tip: open your card in one tap</summary><p class="note">On iPhone, tap Share then "Add to Home Screen". On Android, tap the ⋮ menu then "Add to Home screen". Your card then opens like an app.</p></details>
  </div>`;
  let lastOk = Date.now();
  const draw = tok => { $("#qr").innerHTML = qrSvg(`${location.origin}/v?t=${tok}`); lastOk = Date.now(); };
  draw(c.token);
  clearInterval(clock); clearInterval(timer);
  clock = setInterval(() => {
    const el = $("#clock"); if (!el) return clearInterval(clock);
    el.textContent = new Date().toLocaleTimeString("en-GB");
    const stale = Date.now() - lastOk > 100000;
    $("#fresh").textContent = stale ? "Offline: reconnect to refresh" : "Live code";
    $(".fcard").classList.toggle("stale", stale);
  }, 1000);
  $("#out").addEventListener("click", async () => {
    if (preview) { preview = false; clearInterval(clock); return DEMO ? null : signInView(); }
    if (DEMO) return; await client.auth.signOut(); clearInterval(timer); signInView();
  });
  $("#rename")?.addEventListener("click", () => { if (DEMO) return; clearInterval(timer); nameView(true, c.first_name); });
  initSavings();
  if (DEMO || preview) return;
  timer = setInterval(async () => {
    if (document.hidden) return;
    const { data } = await client.rpc("my_card");
    if (data?.token) draw(data.token);
    refreshSavings();
  }, 15000);
  document.addEventListener("visibilitychange", async () => { if (!document.hidden) { const { data } = await client.rpc("my_card"); if (data?.token) draw(data.token); } });
}

/* ---------- sample card (no account needed) ---------- */
function showSample() {
  preview = true;
  const w = Math.floor(Date.now() / 30000);
  cardView({ first_name: "Sam", since: new Date(Date.now() - 40 * 86400000).toISOString(), token: `sample.${w}.sample` });
  app.insertAdjacentHTML("afterbegin", '<div class="sample-bar"><b>Sample card</b> This is what your card and savings tracker look like. Try adding a saving: nothing is saved.</div>');
  scrollTo(0, 0);
}

/* ---------- savings tracker ---------- */
const ago = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
const SAMPLE_SAVINGS = [
  { id: "s1", label: "Soft play: 10% off weekday entry", amount: 1.20, saved_on: ago(2) },
  { id: "s2", label: "Art club: first class free", amount: 8.00, saved_on: ago(9) },
  { id: "s3", label: "Swim school: sibling half price", amount: 27.50, saved_on: ago(21) },
  { id: "s4", label: "Party: £20 off weekend party", amount: 20.00, saved_on: ago(34) },
];
let savings = [], dealOpts = [];
const money = n => "£" + Number(n).toFixed(2).replace(/\.00$/, "");

async function initSavings() {
  try { dealOpts = await fetchDeals(); } catch { dealOpts = []; }
  if (preview || DEMO) savings = structuredClone(SAMPLE_SAVINGS);
  else {
    const { data, error } = await client.from("member_savings").select("*").order("saved_on", { ascending: false }).order("created_at", { ascending: false });
    if (error) { $("#savings").innerHTML = '<p class="note">Your savings tracker is taking a moment to load. Please refresh.</p>'; return; }
    savings = data;
  }
  renderSavings();
}

// Picks up savings that staff record when they scan this card
async function refreshSavings() {
  if (preview || DEMO || !client) return;
  const { data } = await client.from("member_savings").select("*").order("saved_on", { ascending: false }).order("created_at", { ascending: false });
  if (!data || data.length === savings.length) return;
  const typing = $("#sv-form") && [...$("#sv-form").querySelectorAll("input")].some(i => i.value);
  savings = data;
  if (!typing) renderSavings();
  const fresh = data[0];
  if (fresh?.source === "scan") $("#savings")?.insertAdjacentHTML("afterbegin", `<div class="ok" role="status">Nice! ${money(fresh.amount)} saved at ${esc(fresh.label.split(":")[0])} has been added.</div>`);
}

function renderSavings() {
  const box = $("#savings"); if (!box) return;
  const total = savings.reduce((t, x) => t + Number(x.amount), 0);
  const now = new Date(), monthKey = now.toISOString().slice(0, 7);
  const month = savings.filter(x => x.saved_on.startsWith(monthKey)).reduce((t, x) => t + Number(x.amount), 0);
  box.innerHTML = `
    <div class="sv-top">
      <div><span class="note">You've saved</span><b class="sv-total">${money(total)}</b><span class="note">${savings.length ? `using ${savings.length} deal${savings.length === 1 ? "" : "s"}` : "Add a saving each time you use a deal"}</span></div>
      <div class="sv-month"><span class="note">This month</span><b>${money(month)}</b></div>
    </div>
    <form id="sv-form" class="sv-form" novalidate>
      <label class="field">What did you use?<select name="deal">${dealOpts.map(d => `<option value="${esc(d.id)}">${esc(d.business_name)}: ${esc(d.offer)}</option>`).join("")}<option value="">Something else…</option></select></label>
      <label class="field" id="sv-label-wrap" ${dealOpts.length ? "hidden" : ""}>Describe it<input name="label" maxlength="120" placeholder="e.g. Half-price soft play"></label>
      <label class="field">Saved (£)<input name="amount" type="number" inputmode="decimal" min="0.01" max="1000" step="0.01" placeholder="5.00"></label>
      <p class="err" role="alert" hidden></p>
      <button class="btn">Add saving</button>
    </form>
    ${savings.length ? `<ul class="sv-list">${savings.map(x => `<li><span><b>${esc(x.label)}</b><span class="note">${new Date(x.saved_on).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}${x.source === "scan" ? ' · <span class="scanned">Recorded at the till</span>' : ""}</span></span><span class="sv-amt">${money(x.amount)}</span><button type="button" class="sv-del" data-del="${esc(x.id)}" aria-label="Remove ${esc(x.label)}">✕</button></li>`).join("")}</ul>` : ""}`;
  const f = $("#sv-form");
  f.elements.deal.value = dealOpts.length ? String(dealOpts[0].id) : "";
  f.elements.deal.addEventListener("change", () => { $("#sv-label-wrap").hidden = !!f.elements.deal.value; });
  f.addEventListener("submit", addSaving);
}
$("#card-app").addEventListener("click", async e => {
  const b = e.target.closest("[data-del]"); if (!b) return;
  if (!(preview || DEMO)) { const { error } = await client.from("member_savings").delete().eq("id", b.dataset.del); if (error) return; }
  savings = savings.filter(x => String(x.id) !== b.dataset.del); renderSavings();
});
async function addSaving(e) {
  e.preventDefault();
  const f = e.target, err = f.querySelector(".err"), d = readForm(f), deal = dealOpts.find(x => String(x.id) === d.deal);
  const amount = Math.round(parseFloat(d.amount) * 100) / 100, label = deal ? `${deal.business_name}: ${deal.offer}` : d.label;
  if (!label) { err.textContent = "Please describe what you saved on."; err.hidden = false; return; }
  if (!(amount > 0 && amount <= 1000)) { err.textContent = "Please enter how much you saved, e.g. 4.50"; err.hidden = false; return; }
  const row = { label: label.slice(0, 120), amount, deal_id: deal && !(preview || DEMO) ? deal.id : null };
  if (preview || DEMO) savings.unshift({ ...row, id: "x" + Date.now(), saved_on: new Date().toISOString().slice(0, 10) });
  else {
    const { data, error } = await client.from("member_savings").insert(row).select().single();
    if (error) { err.textContent = "Sorry, that didn't save. Please try again."; err.hidden = false; return; }
    savings.unshift(data);
  }
  renderSavings();
}

async function loadCard() {
  const { data, error } = await client.rpc("my_card");
  if (error) { app.innerHTML = '<div class="empty">Your card is taking a moment to load. Please refresh.</div>'; return; }
  if (!data) return nameView();
  if (data.status !== "active") { app.innerHTML = '<div class="empty">This card has been paused. Please contact us through the Facebook group.</div>'; return; }
  cardView(data);
}

async function start() {
  if (DEMO) {
    const w = Math.floor(Date.now() / 30000);
    cardView({ first_name: "Sam", since: new Date().toISOString(), token: `demo.${w}.demo` });
    app.insertAdjacentHTML("afterbegin", '<p class="note" style="text-align:center;margin-top:16px">Demo mode: this is a sample card. Once the database is connected, families sign in with their email.</p>');
    return;
  }
  client = await sb();
  const { data: { session } } = await client.auth.getSession();
  if (session) return loadCard();
  const hashErr = new URLSearchParams(location.hash.slice(1)).get("error_description");
  signInView(hashErr ? "That link has expired or was already used. Please ask for a new one." : "");
  client.auth.onAuthStateChange((ev, s) => { if (ev === "SIGNED_IN" && s) { history.replaceState(null, "", "/card.html"); loadCard(); } });
}
start();
