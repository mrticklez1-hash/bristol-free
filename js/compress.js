// Shrinks photos in the browser before they're uploaded: max 1600px on the longest side,
// WebP (or JPEG where WebP isn't supported), and turned the right way up.
// A 4 MB phone photo usually ends up around 150-300 KB.
const MAX = 1600, QUALITY = 0.82;

export const prettySize = n => n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;

function toBlob(canvas, type, q) {
  return new Promise(res => canvas.toBlob(b => res(b), type, q));
}

async function decode(file) {
  try { return await createImageBitmap(file, { imageOrientation: "from-image" }); }
  catch {
    // older browsers: fall back to an <img>
    const url = URL.createObjectURL(file);
    try {
      const img = new Image(); img.decoding = "async"; img.src = url; await img.decode();
      return img;
    } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
  }
}

// Returns { file, before, after, changed }. Never throws: if anything fails, the original is used.
export async function compressImage(file) {
  const before = file.size;
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return { file, before, after: before, changed: false };
  try {
    const img = await decode(file);
    const w = img.width || img.naturalWidth, h = img.height || img.naturalHeight;
    const scale = Math.min(1, MAX / Math.max(w, h));
    const cw = Math.round(w * scale), ch = Math.round(h * scale);
    const canvas = document.createElement("canvas"); canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (file.type !== "image/jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cw, ch); } // no black backgrounds from transparent PNGs
    ctx.drawImage(img, 0, 0, cw, ch);
    if (img.close) img.close();
    let blob = await toBlob(canvas, "image/webp", QUALITY), type = "image/webp", ext = "webp";
    if (!blob || blob.type !== "image/webp") { blob = await toBlob(canvas, "image/jpeg", QUALITY); type = "image/jpeg"; ext = "jpg"; }
    if (!blob || (blob.size >= before && scale === 1)) return { file, before, after: before, changed: false };
    const name = (file.name.replace(/\.[^.]+$/, "") || "photo") + "." + ext;
    return { file: new File([blob], name, { type }), before, after: blob.size, changed: true };
  } catch {
    return { file, before, after: before, changed: false };
  }
}
