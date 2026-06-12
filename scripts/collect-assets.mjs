import { chromium } from "playwright";
import fs from "node:fs";

const URL = "https://www.farfetch.com/kz/shopping/men/items.aspx";
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--disable-blink-features=AutomationControlled"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "en-US",
  timezoneId: "Asia/Almaty",
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
});
const page = await context.newPage();
await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(7000);

// ---- Promo modal capture BEFORE dismissing ----
const modal = await page.evaluate(() => {
  const dlg = document.querySelector('[role="dialog"], [data-testid*="modal"], [aria-modal="true"]');
  if (!dlg) return { found: false };
  return {
    found: true,
    text: dlg.innerText?.slice(0, 600),
    imgs: [...dlg.querySelectorAll("img")].map((i) => ({ src: i.currentSrc || i.src, w: i.naturalWidth, h: i.naturalHeight })),
    rect: (() => { const r = dlg.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; })(),
    html: dlg.outerHTML.slice(0, 5000),
  };
});
fs.writeFileSync("docs/research/farfetch/promo-modal.json", JSON.stringify(modal, null, 2));
try { await page.screenshot({ path: "docs/design-references/sec-promo-modal.png" }); } catch {}

for (const sel of ['button[aria-label="Close"]', 'button:has-text("Dismiss")', "#onetrust-accept-btn-handler"]) {
  try {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 1200 })) { await el.click(); await page.waitForTimeout(600); }
  } catch {}
}

// ---- SVG sprite symbols ----
const sprites = await page.evaluate(() => {
  const symbols = [...document.querySelectorAll("symbol")].map((s) => ({ id: s.id, html: s.outerHTML }));
  // also standalone inline svgs that don't use <use>
  const inline = [];
  const seen = new Set();
  [...document.querySelectorAll("svg")].forEach((svg) => {
    if (svg.querySelector("use") || svg.closest("symbol")) return;
    const key = svg.outerHTML.replace(/\s+/g, "").slice(0, 120);
    if (seen.has(key)) return;
    seen.add(key);
    inline.push({
      context: svg.closest("[aria-label]")?.getAttribute("aria-label") || svg.closest("a,button")?.getAttribute("aria-label") || svg.parentElement?.getAttribute("data-testid") || "",
      html: svg.outerHTML,
    });
  });
  return { symbols, inline };
});
fs.writeFileSync("docs/research/farfetch/svg-sprites.json", JSON.stringify(sprites, null, 1));

// ---- Mega menus for every nav item ----
const navLabels = await page.evaluate(() =>
  [...document.querySelectorAll("header a, header button")]
    .map((a) => a.textContent?.trim())
    .filter((t) => ["Sale", "New in", "Vacation", "Brands", "Clothing", "Shoes", "Bags", "Accessories", "Watches", "Lifestyle"].includes(t))
);
const megas = {};
for (const label of [...new Set(navLabels)]) {
  try {
    await page.locator(`header a:has-text("${label}"), header button:has-text("${label}")`).first().hover({ timeout: 3000 });
    await page.waitForTimeout(1300);
    megas[label] = await page.evaluate(() => {
      const cands = [...document.querySelectorAll("div, section")].filter((d) => {
        const r = d.getBoundingClientRect();
        const cs = getComputedStyle(d);
        return r.height > 250 && r.width > 1000 && r.top > 100 && r.top < 260 && cs.backgroundColor === "rgb(255, 255, 255)";
      });
      const p = cands.sort((a, b) => a.getBoundingClientRect().height - b.getBoundingClientRect().height)[0];
      if (!p) return { found: false };
      const cols = [...p.querySelectorAll("ul")].map((ul) => ({
        heading: ul.previousElementSibling?.textContent?.trim() || ul.closest("div")?.querySelector("h2,h3,h4,p")?.textContent?.trim() || "",
        links: [...ul.querySelectorAll("a")].map((a) => ({ text: a.textContent?.trim(), href: a.getAttribute("href") })),
      }));
      const tiles = [...p.querySelectorAll("img")].map((i) => ({
        src: i.currentSrc || i.src,
        label: i.closest("a")?.innerText?.trim().slice(0, 80),
        href: i.closest("a")?.getAttribute("href"),
      }));
      return { found: true, h: Math.round(p.getBoundingClientRect().height), cols, tiles, fullText: p.innerText.slice(0, 1200) };
    });
  } catch (e) {
    megas[label] = { error: e.message.slice(0, 80) };
  }
  await page.mouse.move(720, 700);
  await page.waitForTimeout(400);
}
fs.writeFileSync("docs/research/farfetch/meganav.json", JSON.stringify(megas, null, 1));

// ---- Full-page asset manifest ----
await page.evaluate(async () => {
  for (let y = 0; y <= document.body.scrollHeight; y += 400) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 280));
  }
});
await page.waitForTimeout(2500);
const manifest = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll("img")]
    .map((img) => ({
      src: img.currentSrc || img.src,
      srcset: img.srcset || null,
      alt: img.alt || "",
      w: img.naturalWidth,
      h: img.naturalHeight,
      section: img.closest("[data-testid]")?.getAttribute("data-testid") || img.closest("footer") ? "footer" : null,
      sectionTestid: img.closest("[data-testid]")?.getAttribute("data-testid") || null,
    }))
    .filter((i) => i.src && !i.src.startsWith("data:") && !i.src.includes("bat.bing") && i.w > 10);
  return { imgs, count: imgs.length };
});
fs.writeFileSync("docs/research/farfetch/assets-manifest.json", JSON.stringify(manifest, null, 1));

// ---- Footer styles + payment icons ----
const footerInfo = await page.evaluate(() => {
  const f = document.querySelector("footer");
  const pay = [...document.querySelectorAll('img, svg')].filter((el) => {
    const ctx = (el.closest("[aria-label]")?.getAttribute("aria-label") || "") + (el.getAttribute("aria-label") || "") + ((el.tagName === "IMG" ? el.src : "") || "");
    return /visa|master|amex|paypal|payment|american/i.test(ctx);
  }).map((el) => el.tagName === "IMG" ? { type: "img", src: el.src } : { type: "svg", html: el.outerHTML.slice(0, 1500), aria: el.closest("[aria-label]")?.getAttribute("aria-label") });
  const social = [...(f?.querySelectorAll("a svg, a img") || [])].slice(0, 12).map((el) => ({
    aria: el.closest("a")?.getAttribute("aria-label"),
    href: el.closest("a")?.getAttribute("href"),
    tag: el.tagName.toLowerCase(),
    html: el.tagName === "svg" ? el.outerHTML.slice(0, 1200) : el.src,
  }));
  return { pay: pay.slice(0, 12), social };
});
fs.writeFileSync("docs/research/farfetch/footer-icons.json", JSON.stringify(footerInfo, null, 1));

await browser.close();
console.log(
  "COLLECT_DONE symbols=" + sprites.symbols.length +
  " inline=" + sprites.inline.length +
  " imgs=" + manifest.count +
  " megas=" + Object.keys(megas).filter((k) => megas[k].found).length +
  " modal=" + modal.found
);
