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

// Dismiss promo modal + cookie banner
for (const sel of [
  '[data-testid="modal"] button[aria-label*="lose"]',
  'button[aria-label="Close"]',
  '[aria-label="Close"]',
  'button:has-text("Dismiss")',
  "#onetrust-accept-btn-handler",
]) {
  try {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 1200 })) {
      await el.click();
      await page.waitForTimeout(800);
    }
  } catch {}
}

// Slow scroll to hydrate everything, twice
for (let pass = 0; pass < 2; pass++) {
  await page.evaluate(async (delay) => {
    const step = 600;
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, delay));
    }
  }, pass === 0 ? 400 : 150);
  await page.waitForTimeout(2000);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1500);

// ---- DOM outline ----
const outline = await page.evaluate(() => {
  function describe(el, depth, maxDepth) {
    if (!el || el.nodeType !== 1) return null;
    const cs = getComputedStyle(el);
    if (cs.display === "none") return null;
    const r = el.getBoundingClientRect();
    const node = {
      tag: el.tagName.toLowerCase(),
      testid: el.getAttribute("data-testid") || undefined,
      id: el.id || undefined,
      cls: (el.className?.toString() || "").slice(0, 60) || undefined,
      role: el.getAttribute("role") || undefined,
      aria: el.getAttribute("aria-label") || undefined,
      // offsetTop relative to document
      top: Math.round(r.top + window.scrollY),
      h: Math.round(r.height),
      text: el.children.length === 0 ? el.textContent?.trim().slice(0, 80) : undefined,
    };
    if (depth < maxDepth && el.children.length) {
      const kids = [...el.children]
        .map((c) => describe(c, depth + 1, maxDepth))
        .filter(Boolean)
        .filter((k) => k.h > 0);
      if (kids.length) node.children = kids;
    }
    return node;
  }
  const body = describe(document.body, 0, 5);
  // prune tiny/empty wrappers for readability: keep as-is, caller reads JSON
  return body;
});
fs.writeFileSync("docs/research/farfetch/dom-outline.json", JSON.stringify(outline, null, 1));

// ---- Section text content dump ----
const content = await page.evaluate(() => {
  const out = {};
  // banners above header
  out.topBanners = [...document.querySelectorAll("body > div")].slice(0, 3).map((d) => d.textContent?.trim().slice(0, 200));
  const header = document.querySelector("header");
  out.headerHTMLLength = header?.outerHTML.length;
  out.headerText = header?.innerText;
  const main = document.querySelector("main");
  out.mainChildren = main
    ? [...main.querySelectorAll(":scope > div > div, :scope > div > section")].slice(0, 30).map((s) => ({
        testid: s.getAttribute("data-testid"),
        cls: (s.className?.toString() || "").slice(0, 50),
        h: Math.round(s.getBoundingClientRect().height),
        textStart: s.innerText?.trim().slice(0, 150),
      }))
    : null;
  const footer = document.querySelector("footer");
  out.footerText = footer?.innerText?.slice(0, 3000);
  return out;
});
fs.writeFileSync("docs/research/farfetch/content-dump.json", JSON.stringify(content, null, 2));

// ---- Per-section viewport screenshots ----
const sectionTops = await page.evaluate(() => {
  const main = document.querySelector("main");
  const secs = main ? [...main.querySelectorAll(":scope > div > *")] : [];
  return secs
    .map((s) => ({
      top: Math.round(s.getBoundingClientRect().top + window.scrollY),
      h: Math.round(s.getBoundingClientRect().height),
      text: s.innerText?.trim().slice(0, 40) || "",
    }))
    .filter((s) => s.h > 50);
});
fs.writeFileSync("docs/research/farfetch/section-tops.json", JSON.stringify(sectionTops, null, 2));

let i = 0;
for (const sec of sectionTops.slice(0, 12)) {
  await page.evaluate((y) => window.scrollTo(0, Math.max(0, y - 60)), sec.top);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `docs/design-references/section-${String(i).padStart(2, "0")}.png` });
  i++;
}

// Footer screenshot
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(2500);
await page.screenshot({ path: "docs/design-references/section-footer.png" });

// Clean top screenshot (no modal)
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1200);
await page.screenshot({ path: "docs/design-references/farfetch-desktop-top-clean.png" });

await browser.close();
console.log("EXPLORE_DONE sections=" + sectionTops.length);
