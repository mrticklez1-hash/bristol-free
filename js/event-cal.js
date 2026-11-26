// Shared by What's on and the event pages: times, "add to my calendar" links and .ics downloads.
export const fmtDay = d => d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
export const fmtTime = d => { const h = d.getHours(), m = d.getMinutes(); return `${h % 12 || 12}${m ? ":" + String(m).padStart(2, "0") : ""}${h < 12 ? "am" : "pm"}`; };
// midnight start with no end time = no time was given
export const hasTime = o => !!(o.end || o.at.getHours() || o.at.getMinutes());

const pad = n => String(n).padStart(2, "0");
const icsTime = d => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
const endOf = o => o.end || new Date(o.at.getTime() + 60 * 60 * 1000);
export const where = o => [o.venue || o.listing?.name, o.postcode || o.listing?.postcode, o.area].filter(Boolean).join(", ");

export function gcalUrl(o, pageUrl) {
  const p = new URLSearchParams({ action: "TEMPLATE", text: o.title, dates: `${icsTime(o.at)}/${icsTime(endOf(o))}`, details: [o.description, pageUrl || o.website].filter(Boolean).join("\n\n"), location: where(o) });
  return `https://calendar.google.com/calendar/render?${p}`;
}
const icsEscape = s => String(s || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
export function downloadIcs(o, pageUrl) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Bristol Free & Affordable//EN", "BEGIN:VEVENT",
    `UID:${o.id || "ev"}-${icsTime(o.at)}@bristolfree`, `DTSTAMP:${icsTime(new Date())}`, `DTSTART:${icsTime(o.at)}`, `DTEND:${icsTime(endOf(o))}`,
    `SUMMARY:${icsEscape(o.title)}`, `LOCATION:${icsEscape(where(o))}`, `DESCRIPTION:${icsEscape([o.description, pageUrl || o.website].filter(Boolean).join("\n\n"))}`,
    ...(pageUrl ? [`URL:${pageUrl}`] : []), "END:VEVENT", "END:VCALENDAR"];
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
  a.download = (o.title || "event").replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".ics"; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// the "Add to my calendar" dropdown; `idx` is looked up by the page's own click handler via data-ics
export const calMenu = (o, idx, pageUrl) => `<details class="dir cal-add"><summary class="linkish">Add to my calendar</summary><div class="dir-menu" role="menu">
  <button type="button" role="menuitem" data-ics="${idx}">Apple or Outlook calendar</button>
  <a role="menuitem" href="${gcalUrl(o, pageUrl)}" target="_blank" rel="noopener">Google Calendar</a></div></details>`;
