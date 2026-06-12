import { chromium } from "playwright";
import fs from "node:fs";

const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--disable-blink-features=AutomationControlled"] });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  locale: "en-US",
  timezoneId: "Asia/Almaty",
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
});
const page = await context.newPage();
await page.goto("https://www.farfetch.com/kz/shopping/men/items.aspx", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(7000);
for (const sel of ['button[aria-label="Close"]', 'button:has-text("Dismiss")']) {
  try { const el = page.locator(sel).first(); if (await el.isVisible({ timeout: 1200 })) { await el.click(); await page.waitForTimeout(600); } } catch {}
}
await page.evaluate(async () => {
  for (let y = 0; y <= document.body.scrollHeight; y += 350) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 320)); }
});
await page.waitForTimeout(2500);

// ---- Sale rail: scroll into view and extract ----
const saleData = await page.evaluate(async () => {
  const w = [...document.querySelectorAll('[data-testid="custom-module-wrapper"]')].find((x) => /20% off sale items/.test(x.innerText));
  if (!w) return { error: "sale wrapper not found" };
  w.scrollIntoView({ block: "center" });
  await new Promise((r) => setTimeout(r, 2000));
  const heading = w.querySelector("h2, h3");
  const cta = [...w.querySelectorAll("a")].find((a) => /shop now/i.test(a.textContent || "") && !/item-\d+/.test(a.getAttribute("href") || ""));
  const cards = [...w.querySelectorAll("a")].filter((a) => /item-\d+/.test(a.getAttribute("href") || ""));
  return {
    heading: heading?.textContent?.trim(),
    ctaLabel: cta?.textContent?.trim(),
    ctaHref: cta?.getAttribute("href"),
    ctaStyles: cta ? (() => { const c = getComputedStyle(cta); return { fontSize: c.fontSize, fontWeight: c.fontWeight, color: c.color, backgroundColor: c.backgroundColor, border: c.border, padding: `${c.paddingTop} ${c.paddingRight} ${c.paddingBottom} ${c.paddingLeft}`, height: c.height }; })() : null,
    products: cards.map((a) => ({
      href: a.getAttribute("href"),
      aria: a.getAttribute("aria-label"),
      img: a.querySelector("img") ? { src: a.querySelector("img").currentSrc || a.querySelector("img").src, srcset: a.querySelector("img").srcset } : null,
      texts: [...a.querySelectorAll("p")].map((p) => ({ t: p.textContent.trim(), fs: getComputedStyle(p).fontSize, fw: getComputedStyle(p).fontWeight, color: getComputedStyle(p).color, td: getComputedStyle(p).textDecoration.split(" ")[0] })),
      spans: [...a.querySelectorAll("span")].map((s) => ({ t: s.textContent.trim(), fs: getComputedStyle(s).fontSize, fw: getComputedStyle(s).fontWeight, color: getComputedStyle(s).color, td: getComputedStyle(s).textDecoration.split(" ")[0] })).filter((s) => s.t),
    })),
  };
});
fs.writeFileSync("docs/research/farfetch/sale-rail-final.json", JSON.stringify(saleData, null, 1));

// ---- Help bar full text ----
const helpData = await page.evaluate(() => {
  const hb = document.querySelector('[data-testid="help-bar"]');
  if (!hb) return null;
  return [...hb.querySelectorAll("a")].map((a) => ({
    href: a.getAttribute("href"),
    lines: a.innerText.split("\n").map((s) => s.trim()).filter(Boolean),
    iconUse: a.querySelector("use")?.getAttribute("xlink:href") || a.querySelector("use")?.getAttribute("href"),
    titleStyles: (() => { const t = [...a.querySelectorAll("*")].find((el) => /HOW TO SHOP|FAQS|NEED HELP/i.test(el.textContent) && el.children.length === 0); if (!t) return null; const c = getComputedStyle(t); return { fontSize: c.fontSize, fontWeight: c.fontWeight, textTransform: c.textTransform, letterSpacing: c.letterSpacing }; })(),
  }));
});
fs.writeFileSync("docs/research/farfetch/help-bar-final.json", JSON.stringify(helpData, null, 1));

// ---- Ad tiles: hide sticky chrome, then capture each ad container ----
await page.evaluate(() => {
  const h = document.querySelector("header");
  if (h) h.style.visibility = "hidden";
  const strip = document.querySelector('[data-testid="globalPos"]');
  if (strip) strip.style.visibility = "hidden";
});

const sections = await page.evaluate(() => {
  const secs = [...document.querySelectorAll('[data-component="Ads"]')];
  return secs.map((s, i) => {
    s.setAttribute("data-ad-sec", String(i));
    const r = s.getBoundingClientRect();
    return { i, w: Math.round(r.width), h: Math.round(r.height), y: Math.round(r.y + scrollY) };
  });
});
console.log("ad sections:", JSON.stringify(sections));

let captured = [];
for (const sec of sections) {
  try {
    await page.evaluate((y) => window.scrollTo(0, y - 180), sec.y);
    await page.waitForTimeout(2500);
    const loc = page.locator(`[data-ad-sec="${sec.i}"]`);
    const name = `public/images/ads/ad-slot-${sec.i}.png`;
    await loc.screenshot({ path: name, timeout: 15000 });
    captured.push(name);
  } catch (e) {
    console.error("ad capture fail", sec.i, e.message.slice(0, 70));
  }
}

await browser.close();
console.log("CATCHUP_DONE sale=" + (saleData.products?.length ?? "ERR") + " help=" + (helpData?.length ?? 0) + " ads=" + captured.length);
