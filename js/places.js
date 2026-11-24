// Bristol neighbourhoods and nearby towns, with a rough centre point for each.
// Typing one into search ("cafés in Bedminster") shows everything within a radius of that centre,
// so places just over a "border" are included. r = starting radius in miles (towns start wider).
export const PLACES = [
  // Central
  { n: "Bristol city centre", a: ["city centre", "centre", "broadmead", "cabot circus"], lat: 51.4545, lng: -2.5930 },
  { n: "Harbourside", a: ["harbour", "wapping wharf", "spike island"], lat: 51.4480, lng: -2.5990 },
  { n: "Clifton", a: ["clifton village"], lat: 51.4560, lng: -2.6200 },
  { n: "Hotwells", a: [], lat: 51.4485, lng: -2.6150 },
  { n: "Redcliffe", a: ["temple meads"], lat: 51.4480, lng: -2.5870 },
  { n: "Cotham", a: [], lat: 51.4650, lng: -2.5990 },
  { n: "Redland", a: [], lat: 51.4700, lng: -2.6030 },
  { n: "Montpelier", a: [], lat: 51.4665, lng: -2.5855 },
  { n: "St Pauls", a: ["st paul's"], lat: 51.4635, lng: -2.5830 },
  { n: "St Werburghs", a: ["st werburgh's"], lat: 51.4700, lng: -2.5770 },
  // North
  { n: "Bishopston", a: ["gloucester road"], lat: 51.4790, lng: -2.5910 },
  { n: "Horfield", a: [], lat: 51.4900, lng: -2.5850 },
  { n: "Henleaze", a: [], lat: 51.4870, lng: -2.6060 },
  { n: "Westbury-on-Trym", a: ["westbury on trym", "westbury"], lat: 51.4930, lng: -2.6170 },
  { n: "Stoke Bishop", a: [], lat: 51.4840, lng: -2.6290 },
  { n: "Sea Mills", a: [], lat: 51.4840, lng: -2.6430 },
  { n: "Shirehampton", a: ["shire"], lat: 51.4870, lng: -2.6790 },
  { n: "Lawrence Weston", a: [], lat: 51.5000, lng: -2.6650 },
  { n: "Henbury", a: [], lat: 51.5070, lng: -2.6340 },
  { n: "Southmead", a: [], lat: 51.5030, lng: -2.5970 },
  { n: "Lockleaze", a: [], lat: 51.4880, lng: -2.5660 },
  { n: "Filton", a: [], lat: 51.5080, lng: -2.5770 },
  { n: "Patchway", a: [], lat: 51.5290, lng: -2.5630 },
  { n: "Stoke Gifford", a: ["parkway"], lat: 51.5160, lng: -2.5440 },
  { n: "Cribbs Causeway", a: ["cribbs"], lat: 51.5240, lng: -2.5960 },
  // East
  { n: "Easton", a: [], lat: 51.4630, lng: -2.5650 },
  { n: "Eastville", a: [], lat: 51.4740, lng: -2.5630 },
  { n: "Fishponds", a: [], lat: 51.4800, lng: -2.5280 },
  { n: "Stapleton", a: [], lat: 51.4850, lng: -2.5550 },
  { n: "Frenchay", a: [], lat: 51.4980, lng: -2.5200 },
  { n: "Downend", a: [], lat: 51.4880, lng: -2.5000 },
  { n: "Staple Hill", a: [], lat: 51.4800, lng: -2.5030 },
  { n: "Emersons Green", a: ["emerson's green"], lat: 51.5010, lng: -2.4880 },
  { n: "Kingswood", a: [], lat: 51.4570, lng: -2.5050 },
  { n: "Hanham", a: [], lat: 51.4430, lng: -2.5150 },
  { n: "St George", a: [], lat: 51.4590, lng: -2.5400 },
  { n: "Redfield", a: [], lat: 51.4610, lng: -2.5520 },
  // South
  { n: "Bedminster", a: ["bemmy", "north street", "east street"], lat: 51.4400, lng: -2.6020 },
  { n: "Southville", a: [], lat: 51.4440, lng: -2.6060 },
  { n: "Ashton", a: ["ashton gate", "ashton court"], lat: 51.4420, lng: -2.6200 },
  { n: "Totterdown", a: [], lat: 51.4410, lng: -2.5740 },
  { n: "Windmill Hill", a: [], lat: 51.4380, lng: -2.5880 },
  { n: "Knowle", a: [], lat: 51.4330, lng: -2.5650 },
  { n: "Brislington", a: [], lat: 51.4330, lng: -2.5440 },
  { n: "Bedminster Down", a: [], lat: 51.4250, lng: -2.6170 },
  { n: "Bishopsworth", a: [], lat: 51.4150, lng: -2.6250 },
  { n: "Hengrove", a: [], lat: 51.4160, lng: -2.5800 },
  { n: "Whitchurch", a: [], lat: 51.4080, lng: -2.5620 },
  { n: "Hartcliffe", a: [], lat: 51.4090, lng: -2.5990 },
  { n: "Withywood", a: [], lat: 51.4110, lng: -2.6150 },
  { n: "Stockwood", a: [], lat: 51.4110, lng: -2.5470 },
  { n: "Long Ashton", a: [], lat: 51.4300, lng: -2.6550, r: 2 },
  // Towns
  { n: "Bradley Stoke", a: [], lat: 51.5310, lng: -2.5430, r: 2 },
  { n: "Winterbourne", a: [], lat: 51.5220, lng: -2.5050, r: 2 },
  { n: "Thornbury", a: [], lat: 51.6080, lng: -2.5230, r: 2 },
  { n: "Yate", a: [], lat: 51.5400, lng: -2.4140, r: 2 },
  { n: "Chipping Sodbury", a: ["sodbury"], lat: 51.5380, lng: -2.3940, r: 2 },
  { n: "Keynsham", a: [], lat: 51.4130, lng: -2.4970, r: 2 },
  { n: "Portishead", a: [], lat: 51.4830, lng: -2.7650, r: 2 },
  { n: "Nailsea", a: [], lat: 51.4320, lng: -2.7570, r: 2 },
  { n: "Clevedon", a: [], lat: 51.4380, lng: -2.8540, r: 2 },
];

// lower case, accents removed: "Café" -> "cafe"
export const fold = s => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, "'");

// Finds the longest place name in the search text and returns it with what's left of the search.
// "cafes in bedminster" -> { place: Bedminster, rest: "cafes" }
export function findPlace(q) {
  const t = ` ${fold(q).replace(/[^a-z0-9' -]/g, " ").replace(/\s+/g, " ").trim()} `;
  let best = null, hit = "";
  for (const p of PLACES) for (const name of [p.n, ...p.a]) {
    const k = ` ${fold(name)} `;
    if (t.includes(k) && k.length > hit.length) { best = p; hit = k; }
  }
  if (!best) return null;
  const rest = t.replace(hit, " ").replace(/\b(in|near|around|at|close to|by)\b/g, " ").replace(/\s+/g, " ").trim();
  return { place: best, rest };
}

// UK postcode (full, e.g. BS3 4AA) or district (BS3) -> centre point, using the free postcodes.io lookup
export async function findPostcode(q) {
  const s = q.trim().toUpperCase().replace(/\s+/g, " ");
  const full = s.match(/^([A-Z]{1,2}\d[A-Z\d]?) ?(\d[A-Z]{2})$/), out = s.match(/^[A-Z]{1,2}\d[A-Z\d]?$/);
  if (!full && !out) return null;
  try {
    const url = full ? `https://api.postcodes.io/postcodes/${encodeURIComponent(full[1] + full[2])}` : `https://api.postcodes.io/outcodes/${encodeURIComponent(s)}`;
    const r = await fetch(url); if (!r.ok) return null;
    const j = (await r.json()).result;
    return j && typeof j.latitude === "number" ? { n: full ? `${full[1]} ${full[2]}` : s, lat: j.latitude, lng: j.longitude, r: full ? 1 : 2 } : null;
  } catch { return null; }
}
