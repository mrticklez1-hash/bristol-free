// Bristol neighbourhoods and nearby towns, with a rough centre point for each.
// Typing one into search ("cafés in Bedminster") shows everything within a radius of that centre,
// so places just over a "border" are included. r = starting radius in miles (towns start wider).
export const PLACES = [
  // Central
  { g: "Central", n: "Bristol city centre", a: ["city centre", "centre", "broadmead", "cabot circus"], lat: 51.4545, lng: -2.5930 },
  { g: "Central", n: "Harbourside", a: ["harbour", "wapping wharf", "spike island"], lat: 51.4480, lng: -2.5990 },
  { g: "Central", n: "Clifton", a: ["clifton village"], lat: 51.4560, lng: -2.6200 },
  { g: "Central", n: "Hotwells", a: [], lat: 51.4485, lng: -2.6150 },
  { g: "Central", n: "Redcliffe", a: ["temple meads"], lat: 51.4480, lng: -2.5870 },
  { g: "Central", n: "Cotham", a: [], lat: 51.4650, lng: -2.5990 },
  { g: "Central", n: "Redland", a: [], lat: 51.4700, lng: -2.6030 },
  { g: "Central", n: "Montpelier", a: [], lat: 51.4665, lng: -2.5855 },
  { g: "Central", n: "St Pauls", a: ["st paul's"], lat: 51.4635, lng: -2.5830 },
  { g: "Central", n: "St Werburghs", a: ["st werburgh's"], lat: 51.4700, lng: -2.5770 },
  { g: "Central", n: "Barton Hill", a: [], lat: 51.4560, lng: -2.5650 },
  { g: "Central", n: "Lawrence Hill", a: [], lat: 51.4590, lng: -2.5700 },
  // North
  { g: "North", n: "Bishopston", a: ["gloucester road"], lat: 51.4790, lng: -2.5910 },
  { g: "North", n: "Horfield", a: [], lat: 51.4900, lng: -2.5850 },
  { g: "North", n: "Henleaze", a: [], lat: 51.4870, lng: -2.6060 },
  { g: "North", n: "Westbury-on-Trym", a: ["westbury on trym", "westbury"], lat: 51.4930, lng: -2.6170 },
  { g: "North", n: "Stoke Bishop", a: [], lat: 51.4840, lng: -2.6290 },
  { g: "North", n: "Sea Mills", a: [], lat: 51.4840, lng: -2.6430 },
  { g: "North", n: "Shirehampton", a: ["shire"], lat: 51.4870, lng: -2.6790 },
  { g: "North", n: "Lawrence Weston", a: [], lat: 51.5000, lng: -2.6650 },
  { g: "North", n: "Henbury", a: [], lat: 51.5070, lng: -2.6340 },
  { g: "North", n: "Southmead", a: [], lat: 51.5030, lng: -2.5970 },
  { g: "North", n: "Lockleaze", a: [], lat: 51.4880, lng: -2.5660 },
  { g: "North", n: "Filton", a: [], lat: 51.5080, lng: -2.5770 },
  { g: "North", n: "Patchway", a: [], lat: 51.5290, lng: -2.5630 },
  { g: "North", n: "Stoke Gifford", a: ["parkway"], lat: 51.5160, lng: -2.5440 },
  { g: "North", n: "Cribbs Causeway", a: ["cribbs"], lat: 51.5240, lng: -2.5960 },
  { g: "North", n: "Kingsweston", a: ["kings weston"], lat: 51.4990, lng: -2.6550 },
  { g: "North", n: "Coombe Dingle", a: [], lat: 51.4940, lng: -2.6330 },
  // East
  { g: "East", n: "Easton", a: [], lat: 51.4630, lng: -2.5650 },
  { g: "East", n: "Eastville", a: [], lat: 51.4740, lng: -2.5630 },
  { g: "East", n: "Fishponds", a: [], lat: 51.4800, lng: -2.5280 },
  { g: "East", n: "Stapleton", a: [], lat: 51.4850, lng: -2.5550 },
  { g: "East", n: "Frenchay", a: [], lat: 51.4980, lng: -2.5200 },
  { g: "East", n: "Downend", a: [], lat: 51.4880, lng: -2.5000 },
  { g: "East", n: "Staple Hill", a: [], lat: 51.4800, lng: -2.5030 },
  { g: "East", n: "Emersons Green", a: ["emerson's green"], lat: 51.5010, lng: -2.4880 },
  { g: "East", n: "Kingswood", a: [], lat: 51.4570, lng: -2.5050 },
  { g: "East", n: "Hanham", a: [], lat: 51.4430, lng: -2.5150 },
  { g: "East", n: "St George", a: [], lat: 51.4590, lng: -2.5400 },
  { g: "East", n: "Redfield", a: [], lat: 51.4610, lng: -2.5520 },
  { g: "East", n: "Speedwell", a: [], lat: 51.4720, lng: -2.5230 },
  { g: "East", n: "Whitehall", a: [], lat: 51.4690, lng: -2.5370 },
  { g: "East", n: "St Annes", a: ["st anne's"], lat: 51.4480, lng: -2.5440 },
  { g: "East", n: "Warmley", a: [], lat: 51.4620, lng: -2.4720, r: 2 },
  { g: "East", n: "Pucklechurch", a: [], lat: 51.4860, lng: -2.4390, r: 2 },
  // South
  { g: "South", n: "Bedminster", a: ["bemmy", "north street", "east street"], lat: 51.4400, lng: -2.6020 },
  { g: "South", n: "Southville", a: [], lat: 51.4440, lng: -2.6060 },
  { g: "South", n: "Ashton", a: ["ashton gate", "ashton court"], lat: 51.4420, lng: -2.6200 },
  { g: "South", n: "Totterdown", a: [], lat: 51.4410, lng: -2.5740 },
  { g: "South", n: "Windmill Hill", a: [], lat: 51.4380, lng: -2.5880 },
  { g: "South", n: "Knowle", a: [], lat: 51.4330, lng: -2.5650 },
  { g: "South", n: "Brislington", a: [], lat: 51.4330, lng: -2.5440 },
  { g: "South", n: "Bedminster Down", a: [], lat: 51.4250, lng: -2.6170 },
  { g: "South", n: "Bishopsworth", a: [], lat: 51.4150, lng: -2.6250 },
  { g: "South", n: "Hengrove", a: [], lat: 51.4160, lng: -2.5800 },
  { g: "South", n: "Whitchurch", a: [], lat: 51.4080, lng: -2.5620 },
  { g: "South", n: "Hartcliffe", a: [], lat: 51.4090, lng: -2.5990 },
  { g: "South", n: "Withywood", a: [], lat: 51.4110, lng: -2.6150 },
  { g: "South", n: "Stockwood", a: [], lat: 51.4110, lng: -2.5470 },
  { g: "South", n: "Long Ashton", a: [], lat: 51.4300, lng: -2.6550, r: 2 },
  { g: "South", n: "Headley Park", a: [], lat: 51.4200, lng: -2.6100 },
  // Towns
  { g: "Towns", n: "Bradley Stoke", a: [], lat: 51.5310, lng: -2.5430, r: 2 },
  { g: "Towns", n: "Winterbourne", a: [], lat: 51.5220, lng: -2.5050, r: 2 },
  { g: "Towns", n: "Thornbury", a: [], lat: 51.6080, lng: -2.5230, r: 2 },
  { g: "Towns", n: "Yate", a: [], lat: 51.5400, lng: -2.4140, r: 2 },
  { g: "Towns", n: "Chipping Sodbury", a: ["sodbury"], lat: 51.5380, lng: -2.3940, r: 2 },
  { g: "Towns", n: "Keynsham", a: [], lat: 51.4130, lng: -2.4970, r: 2 },
  { g: "Towns", n: "Portishead", a: [], lat: 51.4830, lng: -2.7650, r: 2 },
  { g: "Towns", n: "Nailsea", a: [], lat: 51.4320, lng: -2.7570, r: 2 },
  { g: "Towns", n: "Clevedon", a: [], lat: 51.4380, lng: -2.8540, r: 2 },
  { g: "Towns", n: "Abbots Leigh", a: [], lat: 51.4600, lng: -2.6600, r: 2 },
  { g: "Towns", n: "Pill", a: [], lat: 51.4810, lng: -2.6890, r: 2 },
  { g: "Towns", n: "Portbury", a: [], lat: 51.4730, lng: -2.7200, r: 2 },
  { g: "Towns", n: "Saltford", a: [], lat: 51.4040, lng: -2.4500, r: 2 },
  { g: "Towns", n: "Frampton Cotterell", a: [], lat: 51.5390, lng: -2.4810, r: 2 },
];

export const PLACE_GROUPS = ["Central", "North", "East", "South", "Towns"];

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
