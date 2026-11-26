// Cloudflare Pages Function for /event/<slug>.
// fb, WhatsApp and others don't run the page's JavaScript when they build a link preview,
// so this fills in the event's own title, description and photo before the page is sent.
// Visitors get the normal event page; if anything here fails, they still get it unchanged.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../../js/config.js";

const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

// UK local date parts without needing Intl time zones
function ukDate(iso) {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const lastSun = m => { const t = new Date(Date.UTC(y, m + 1, 0)); t.setUTCDate(t.getUTCDate() - t.getUTCDay()); return t; };
  const bstStart = lastSun(2), bstEnd = lastSun(9);
  bstStart.setUTCHours(1); bstEnd.setUTCHours(1);
  const local = new Date(d.getTime() + (d >= bstStart && d < bstEnd ? 3600000 : 0));
  return `${DAYS[local.getUTCDay()]} ${local.getUTCDate()} ${MONTHS[local.getUTCMonth()]}`;
}

export function previewTags(e, url) {
  const when = e.repeat_until ? `Every ${ukDate(e.starts_at).split(" ")[0]}` : ukDate(e.starts_at);
  const where = e.venue || e.listing?.name || e.area;
  const price = e.price_band === 0 ? "Free" : (e.price_note || "");
  const title = `${e.title} · ${when}`;
  const desc = [[where, e.area !== where ? e.area : ""].filter(Boolean).join(", "), price, e.description].filter(Boolean).join(" · ").slice(0, 200);
  const img = e.image_url || e.listing?.image_url;
  return { title, desc, img, url };
}

export function injectTags(html, t) {
  const swap = (re, tag) => re.test(html) ? (html = html.replace(re, tag)) : (html = html.replace("</head>", tag + "\n</head>"));
  swap(/<title>[^<]*<\/title>/, `<title>${esc(t.title)} · Bristol Free &amp; Affordable</title>`);
  swap(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(t.desc)}">`);
  swap(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(t.title)}">`);
  swap(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(t.desc)}">`);
  if (t.img && /^https:\/\//.test(t.img)) swap(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${esc(t.img)}">`);
  swap(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${esc(t.url)}">`);
  return html;
}

export async function onRequestGet({ request, params, env }) {
  const page = await env.ASSETS.fetch(new URL("/event", request.url));
  try {
    const slug = String(params.slug || "");
    if (!/^[a-z0-9-]{1,100}$/.test(slug)) return page;
    const api = `${SUPABASE_URL}/rest/v1/events?slug=eq.${slug}&status=eq.published&select=title,description,starts_at,repeat_until,venue,area,price_band,price_note,image_url,listing:listings(name,image_url)&limit=1`;
    const r = await fetch(api, { headers: { apikey: SUPABASE_ANON_KEY }, cf: { cacheTtl: 300 } });
    const [e] = r.ok ? await r.json() : [];
    if (!e) return page;
    const url = new URL(request.url); url.search = "";
    const html = injectTags(await page.text(), previewTags(e, url.href));
    const headers = new Headers(page.headers);
    headers.set("Content-Type", "text/html; charset=utf-8");
    headers.set("Cache-Control", "public, max-age=300");
    headers.delete("Content-Length"); headers.delete("ETag");
    return new Response(html, { status: 200, headers });
  } catch {
    return page;
  }
}
