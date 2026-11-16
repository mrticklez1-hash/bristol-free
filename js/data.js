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
  play:      { n: "Soft play & days out",   c: "#FFE6D6" },
  classes:   { n: "Classes & clubs",        c: "#E3EEFF" },
  cafes:     { n: "Family cafés",           c: "#FFF0CC" },
  parties:   { n: "Parties",                c: "#F6E0EC" },
  childcare: { n: "Nurseries & childcare",  c: "#FCE7DA" },
  health:    { n: "Health & wellbeing",     c: "#DDF2E7" },
  shops:     { n: "Shops",                  c: "#EFE6FB" },
  sport:     { n: "Sport & swimming",       c: "#D9ECFA" },
  outdoors:  { n: "Parks & outdoors",       c: "#DDF2E7" },
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
