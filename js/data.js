import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
import { DEMO_LISTINGS } from "./demo-data.js";

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
