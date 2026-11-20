import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
import { DEMO_LISTINGS } from "./demo-data.js";
import { DEMO_EVENTS, DEMO_DEALS, DEMO_RECIPES } from "./demo-extra.js";

export const DEMO = !SUPABASE_URL || !SUPABASE_ANON_KEY;

let client = null;
export async function sb() {
  if (DEMO) return null;
  if (!client) {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return client;
}

export const AREAS = ["Central Bristol","North Bristol","South Bristol","East Bristol","Bradley Stoke","Keynsham","Portishead","Clevedon","Nailsea","Thornbury","Yate"];

export const CATS = {
  play:      { n: "Soft play & days out",   c: "#FFE7AE", deep: "#E0A83A" },
  classes:   { n: "Classes & clubs",        c: "#DCE5FF", deep: "#4C6FD6" },
  cafes:     { n: "Family cafés",           c: "#F7DDCB", deep: "#C2703D" },
  parties:   { n: "Parties",                c: "#F9D3E0", deep: "#D2557E" },
  childcare: { n: "Nurseries & childcare",  c: "#E8DDF8", deep: "#7E5BC2" },
  health:    { n: "Health & wellbeing",     c: "#CDEFE5", deep: "#1F9A7A" },
  shops:     { n: "Shops",                  c: "#D3EAF2", deep: "#3C8DAD" },
  sport:     { n: "Sport & swimming",       c: "#D5E6F5", deep: "#1C5C8C" },
  outdoors:  { n: "Parks & outdoors",       c: "#D2EDDD", deep: "#0B6B4F" },
};

export const PRICE = ["Free", "Under £5", "£5 to £10", "£10+"];
export const AGES = { baby: "Babies (0–1)", toddler: "Toddlers (1–4)", kids: "Kids (5–11)", teen: "Teens (12+)" };

export async function fetchListings() {
  if (DEMO) return DEMO_LISTINGS;
  const c = await sb();
  const { data, error } = await c
    .from("listings")
    .select("*")
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("name");
  if (error) throw error;
  return data;
}

export async function submitClaim(row) {
  if (DEMO) { await new Promise(r => setTimeout(r, 400)); return { demo: true }; }
  const c = await sb();
  const { error } = await c.from("claim_requests").insert(row);
  if (error) throw error;
  return {};
}

export const slugify = t => String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
export const listingUrl = l => `/place/${encodeURIComponent(l.slug || slugify(l.name))}`;

export async function fetchListing(slug) {
  if (DEMO) return DEMO_LISTINGS.find(l => slugify(l.name) === slug) || null;
  const c = await sb();
  const { data, error } = await c.from("listings").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  if (error) throw error;
  return data;
}

/* ---------- What's on, deals, recipes, suggestions ---------- */

export async function fetchEvents() {
  if (DEMO) return DEMO_EVENTS;
  const c = await sb();
  const since = new Date(Date.now() - 86400000).toISOString();
  const { data, error } = await c.from("events")
    .select("*, listing:listings(name, slug, area)")
    .eq("status", "published")
    .or(`starts_at.gte.${since},repeat_until.gte.${since.slice(0, 10)}`)
    .order("starts_at");
  if (error) throw error;
  return data;
}

// Weekly events are stored once; this spreads them into dated occurrences between from and to.
export function occurrences(events, from, to) {
  const out = [];
  for (const e of events) {
    const start = new Date(e.starts_at), len = e.ends_at ? new Date(e.ends_at) - start : 0;
    const last = e.repeat_until ? new Date(e.repeat_until + "T23:59:59") : start;
    for (let d = new Date(start); d <= last && d <= to; d.setDate(d.getDate() + 7)) {
      const end = len ? new Date(d.getTime() + len) : null;
      if ((end || d) >= from) out.push({ ...e, at: new Date(d), end });
      if (!e.repeat_until) break;
    }
  }
  return out.sort((a, b) => a.at - b.at);
}

export async function fetchDeals() {
  if (DEMO) return DEMO_DEALS;
  const c = await sb();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await c.from("deals")
    .select("*, listing:listings(name, slug, area)")
    .eq("status", "published")
    .or(`valid_until.is.null,valid_until.gte.${today}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchRecipes() {
  if (DEMO) return DEMO_RECIPES;
  const c = await sb();
  const { data, error } = await c.from("recipes").select("*").eq("status", "published").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchRecipe(slug) {
  if (DEMO) return DEMO_RECIPES.find(r => r.slug === slug) || null;
  const c = await sb();
  const { data, error } = await c.from("recipes").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  if (error) throw error;
  return data;
}

/* ---------- family card deals per listing (for the QR badge) ---------- */
let dealsP = null;
export function dealIndex() {
  dealsP = dealsP || fetchDeals().catch(() => []);
  return dealsP.then(deals => {
    const byId = new Map(), byName = new Map();
    for (const d of deals) {
      if (d.listing_id) byId.set(String(d.listing_id), d);
      if (d.business_name) byName.set(d.business_name.trim().toLowerCase(), d);
    }
    return l => (l && (byId.get(String(l.id)) || byName.get(String(l.name || "").trim().toLowerCase()))) || null;
  });
}

/* ---------- "I'd love a family deal here" wishes ---------- */
const store = (() => { try { const k = "__t"; localStorage.setItem(k, k); localStorage.removeItem(k); return localStorage; } catch { return null; } })();
const mem = {};
const get = k => (store ? store.getItem(k) : mem[k]) || null;
const put = (k, v) => { if (store) store.setItem(k, v); else mem[k] = v; };
function deviceId() {
  let d = get("bf_device");
  if (!d) { const a = new Uint8Array(12); crypto.getRandomValues(a); d = [...a].map(b => b.toString(16).padStart(2, "0")).join(""); put("bf_device", d); }
  return d;
}
export function myWishes() { try { return new Set(JSON.parse(get("bf_wished") || "[]")); } catch { return new Set(); } }
function saveWishes(set) { put("bf_wished", JSON.stringify([...set])); }
let countsP = null;
const DEMO_COUNTS = new Map();
export function wishCounts() {
  if (DEMO) return Promise.resolve(DEMO_COUNTS);
  countsP = countsP || sb().then(c => c.rpc("wish_counts")).then(({ data }) => new Map((data || []).map(r => [String(r.listing_id), r.n]))).catch(() => new Map());
  return countsP;
}
export async function toggleWish(listingId) {
  const id = String(listingId), mine = myWishes();
  if (DEMO) {
    const was = mine.has(id), base = DEMO_COUNTS.get(id) ?? 22;
    was ? mine.delete(id) : mine.add(id); saveWishes(mine);
    DEMO_COUNTS.set(id, base + (was ? -1 : 1));
    return { ok: true, wished: !was, n: DEMO_COUNTS.get(id) };
  }
  const c = await sb();
  const { data, error } = await c.rpc("toggle_wish", { p_listing: id, p_device: deviceId() });
  if (error || !data?.ok) return { ok: false, reason: data?.reason || "error" };
  data.wished ? mine.add(id) : mine.delete(id); saveWishes(mine);
  const counts = await wishCounts(); counts.set(id, data.n);
  return data;
}

export async function submitInterest(row) {
  if (DEMO) { await new Promise(r => setTimeout(r, 400)); return { demo: true }; }
  const c = await sb();
  const { error } = await c.from("interest").insert(row);
  if (error?.code === "23505") return { already: true }; // that email is already on the list
  if (error) throw error;
  return {};
}

export async function submitSuggestion(kind, data, contact_name, email) {
  if (DEMO) { await new Promise(r => setTimeout(r, 400)); return { demo: true }; }
  const c = await sb();
  const { error } = await c.from("suggestions").insert({ kind, data, contact_name, email });
  if (error) throw error;
  return {};
}
