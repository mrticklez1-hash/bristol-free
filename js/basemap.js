// "Pastel Quiet" base map: OpenFreeMap vector tiles drawn with MapLibre inside Leaflet.
// Falls back to standard OpenStreetMap tiles if anything fails to load (old browser, no WebGL, CDN down).
const MLV = "5.24.1";
const ML_CSS = `https://unpkg.com/maplibre-gl@${MLV}/dist/maplibre-gl.css`;
const ML_JS = `https://unpkg.com/maplibre-gl@${MLV}/dist/maplibre-gl.js`;
const BIND_JS = "https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.1.4/leaflet-maplibre-gl.js";
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

const C = {
  land: "#FCFAF6", residential: "#F7F2EB", building: "#F4EEE6", buildingLine: "#EEE6DB",
  park: "#E4F3E9", wood: "#DCEFE2", water: "#DDEBF7",
  minor: "#FFFFFF", path: "#F1EBE2", major: "#FFF4D6", majorCase: "#F1E3BE", rail: "#E8E1D7",
  label: "#7A8796", labelStrong: "#5E6B7A", waterLabel: "#7F9DBB", roadLabel: "#9AA4AF", halo: "#FCFAF6",
};

function paintFor(id, type) {
  if (type === "background") return { "background-color": C.land };
  if (type === "fill") {
    if (id === "park") return { "fill-color": C.park };
    if (id === "water") return { "fill-color": C.water };
    if (id === "landcover_wood") return { "fill-color": C.wood };
    if (id === "landuse_residential") return { "fill-color": C.residential };
    if (id === "building") return { "fill-color": C.building, "fill-outline-color": C.buildingLine };
    if (id === "road_area_pier") return { "fill-color": C.land };
    return null;
  }
  if (type === "line") {
    if (id === "waterway") return { "line-color": C.water };
    if (id === "road_pier") return { "line-color": C.land };
    if (id.startsWith("railway")) return { "line-color": id.endsWith("dashline") ? C.land : C.rail };
    if (id === "highway_path") return { "line-color": C.path };
    if (id === "highway_minor") return { "line-color": C.minor };
    if (/casing|subtle/.test(id) && /highway|motorway/.test(id)) return { "line-color": C.majorCase };
    if (/inner/.test(id) && /highway|motorway/.test(id)) return { "line-color": C.major };
    return null;
  }
  if (type === "symbol") {
    if (/water/.test(id)) return { "text-color": C.waterLabel, "text-halo-color": C.halo };
    if (/^highway-name/.test(id)) return { "text-color": C.roadLabel, "text-halo-color": C.halo };
    if (/^label_(city|town)/.test(id)) return { "text-color": C.labelStrong, "text-halo-color": C.halo };
    if (/^label_|airport/.test(id)) return { "text-color": C.label, "text-halo-color": C.halo };
    return null;
  }
  return null;
}

function loadScript(src) {
  return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.crossOrigin = ""; s.onload = res; s.onerror = rej; document.head.append(s); });
}
function loadCss(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.append(l);
}
function webglOk() {
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
}
let ready;
async function loadPastelStyle() {
  loadCss(ML_CSS);
  if (!window.maplibregl) await loadScript(ML_JS);
  if (!(window.L && L.maplibreGL)) await loadScript(BIND_JS);
  const r = await fetch(STYLE_URL);
  if (!r.ok) throw new Error("style " + r.status);
  const style = await r.json();
  for (const layer of style.layers || []) {
    if (layer.id === "ne2_shaded" || layer.source === "ne2_shaded") { layer.layout = { ...(layer.layout || {}), visibility: "none" }; continue; }
    const p = paintFor(layer.id, layer.type);
    if (p) layer.paint = { ...(layer.paint || {}), ...p };
  }
  return style;
}

function osmFallback(map) {
  return L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
}

// Adds the base map to a Leaflet map. Never throws.
export async function addBasemap(map) {
  map.getContainer().style.background = C.land;
  if (!webglOk()) return osmFallback(map);
  try {
    ready = ready || loadPastelStyle();
    const style = await ready;
    return L.maplibreGL({ style: JSON.parse(JSON.stringify(style)), maxZoom: 19, attributionControl: { customAttribution: '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors' } }).addTo(map);
  } catch (e) {
    console.warn("Pastel map unavailable, using OpenStreetMap tiles", e);
    ready = null;
    return osmFallback(map);
  }
}
