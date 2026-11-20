// Turns the site into an installable app: registers the service worker and
// offers "Add to your home screen" (a real Install button on Android, simple steps on iPhone).
const ls = (() => { try { localStorage.setItem("__a", "1"); localStorage.removeItem("__a"); return localStorage; } catch { return null; } })();
const get = k => ls?.getItem(k), put = (k, v) => ls?.setItem(k, v);

if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
  window.addEventListener("load", () => navigator.serviceWorker?.register("/sw.js").catch(() => {}));
}

const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const quietPage = /\/(admin|staff|verify|offline)(\.html)?$|^\/v$/.test(location.pathname);
let deferred = null;

const ICON = '<img src="/img/app/icon-192.png" alt="" width="48" height="48">';
const SHARE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-label="the Share button"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';

function closeBanner(remember) {
  document.querySelector(".app-banner")?.remove();
  if (remember) put("bf_app_dismissed", String(Date.now()));
}
function banner(html) {
  closeBanner(false);
  const el = document.createElement("div");
  el.className = "app-banner"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Add to home screen");
  el.innerHTML = html;
  document.body.append(el);
  el.querySelector("[data-app-close]")?.addEventListener("click", () => closeBanner(true));
  el.querySelector("[data-app-install]")?.addEventListener("click", async () => {
    if (!deferred) return;
    deferred.prompt();
    const r = await deferred.userChoice.catch(() => null);
    deferred = null; closeBanner(r?.outcome !== "accepted");
  });
}
export function showInstall(force = false) {
  if (standalone()) return force && alert("You're already using the Bristol Free app.");
  const head = `${ICON}<div class="app-txt"><b>Add Bristol Free to your home screen</b><span>It opens like an app, which is handy for your family card at the till.</span></div><button type="button" class="app-x" data-app-close aria-label="Not now">×</button>`;
  if (deferred) return banner(`${head}<div class="app-acts"><button type="button" class="btn" data-app-install>Install app</button><button type="button" class="btn ghost" data-app-close>Not now</button></div>`);
  if (isIOS) return banner(`${head}<ol class="app-steps"><li>Tap ${SHARE} <b>Share</b> at the bottom of the screen (top right on iPad)</li><li>Scroll down and tap <b>Add to Home Screen</b></li><li>Tap <b>Add</b></li></ol>`);
  if (force) return banner(`${head}<p class="app-steps">Open this site in Chrome or Safari on your phone, then use the browser menu and choose <b>Add to Home Screen</b> or <b>Install app</b>.</p>`);
}

function eligible() {
  if (quietPage || standalone()) return false;
  const d = +get("bf_app_dismissed") || 0;
  if (Date.now() - d < 30 * 864e5) return false;
  const visits = +get("bf_visits") || 0;
  return visits >= 2 && !/\/card(\.html)?$/.test(location.pathname); // never pop up over the card at the till
}
if (!sessionStorage.getItem?.("bf_counted")) { try { sessionStorage.setItem("bf_counted", "1"); } catch {} put("bf_visits", String((+get("bf_visits") || 0) + 1)); }

window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault(); deferred = e;
  if (eligible()) setTimeout(() => showInstall(), 4000);
});
window.addEventListener("appinstalled", () => { closeBanner(false); put("bf_app_dismissed", String(Date.now() + 3650 * 864e5)); });
if (isIOS && eligible()) setTimeout(() => showInstall(), 6000);

// "Get the app" link in the footer, so people can always find it
function addFooterLink() {
  if (quietPage || standalone()) return;
  const nav = document.querySelector("footer.site nav") || document.querySelector("footer.site");
  if (!nav || nav.querySelector("[data-get-app]")) return;
  const a = document.createElement("a"); a.href = "#"; a.dataset.getApp = ""; a.textContent = "Get the app";
  a.addEventListener("click", e => { e.preventDefault(); showInstall(true); });
  nav.append(a);
}
if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", addFooterLink); else addFooterLink();
