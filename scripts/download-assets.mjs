import fs from "node:fs";
import path from "node:path";

const R = (p) => JSON.parse(fs.readFileSync(`docs/research/farfetch/${p}`, "utf8"));

const urls = new Map(); // url -> local path

function add(url, dir, name) {
  if (!url || url.startsWith("data:")) return;
  try {
    const u = new URL(url);
    const base = name || path.basename(u.pathname);
    if (!urls.has(url)) urls.set(url, path.join(dir, base));
  } catch {}
}

// Fonts
const fonts = [
  "https://cdn-static.farfetch-contents.com/assets/portal-core-appportal/desktop/public/fonts/v3.00/FarfetchBasis-Regular.woff2",
  "https://cdn-static.farfetch-contents.com/assets/portal-core-appportal/desktop/public/fonts/v3.00/FarfetchBasis-Bold.woff2",
  "https://cdn-static.farfetch-contents.com/assets/portal-core-appportal/desktop/public/fonts/v3.00/NimbusRomanD-Regular.woff2",
];
fonts.forEach((f) => add(f, "public/fonts"));

// Favicons
const recon = R("recon-desktop.json");
recon.favicons.forEach((f) => add(f.href, "public/seo"));

// Images: recon + assets manifest + meganav tiles + modal
recon.images.forEach((i) => {
  if (i.src.includes("bat.bing")) return;
  const dir = i.src.includes("cdn-images") ? "public/images/products" : "public/images/cms";
  add(i.src, dir);
});
const manifest = R("assets-manifest.json");
manifest.imgs.forEach((i) => {
  const dir = i.src.includes("cdn-images") ? "public/images/products" : "public/images/cms";
  add(i.src, dir);
  // srcset variants (480w)
  if (i.srcset) {
    i.srcset.split(",").map((s) => s.trim().split(" ")[0]).forEach((u) => add(u, dir));
  }
});
const megas = R("meganav.json");
Object.values(megas).forEach((m) => {
  (m.tiles || []).forEach((t) => add(t.src, "public/images/meganav"));
});
const modal = R("promo-modal.json");
(modal.imgs || []).forEach((i) => add(i.src, "public/images/cms"));

// interactions.json assets too
try {
  const inter = R("../farfetch/interactions.json".replace("../farfetch/", ""));
  (inter.assets?.imgs || []).forEach((i) => {
    const dir = i.src.includes("cdn-images") ? "public/images/products" : "public/images/cms";
    add(i.src, dir);
    if (i.srcset) i.srcset.split(",").map((s) => s.trim().split(" ")[0]).forEach((u) => add(u, dir));
  });
} catch {}

console.log("Total unique assets:", urls.size);

const entries = [...urls.entries()];
const failures = [];
const mapping = {};

async function fetchOne(url, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) { mapping[url] = "/" + dest.replace(/^public\//, ""); return; }
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
      Referer: "https://www.farfetch.com/",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  mapping[url] = "/" + dest.replace(/^public\//, "");
}

for (let i = 0; i < entries.length; i += 4) {
  const batch = entries.slice(i, i + 4);
  await Promise.all(
    batch.map(([url, dest]) =>
      fetchOne(url, dest).catch((e) => {
        failures.push({ url, error: e.message });
      })
    )
  );
  process.stdout.write(`\r${Math.min(i + 4, entries.length)}/${entries.length}`);
}
console.log();
fs.writeFileSync("docs/research/farfetch/asset-mapping.json", JSON.stringify(mapping, null, 2));
if (failures.length) {
  console.log("FAILURES:", JSON.stringify(failures, null, 2));
}
console.log("DOWNLOAD_DONE ok=" + Object.keys(mapping).length + " fail=" + failures.length);
