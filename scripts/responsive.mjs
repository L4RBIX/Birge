import { chromium } from "playwright";
import fs from "node:fs";

const URL = "https://www.farfetch.com/kz/shopping/men/items.aspx";
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--disable-blink-features=AutomationControlled"],
});

const results = {};

for (const [label, width, height] of [["tablet", 768, 1024], ["mobile", 390, 844]]) {
  const context = await browser.newContext({
    viewport: { width, height },
    locale: "en-US",
    timezoneId: "Asia/Almaty",
    userAgent:
      width < 800
        ? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
        : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
    isMobile: width < 800,
    hasTouch: width < 800,
  });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(7000);
  for (const sel of ['button[aria-label="Close"]', 'button:has-text("Dismiss")', "#onetrust-accept-btn-handler"]) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 1200 })) { await el.click(); await page.waitForTimeout(600); }
    } catch {}
  }
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 250));
    }
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);

  await page.screenshot({ path: `docs/design-references/farfetch-${label}-top.png` });

  results[label] = await page.evaluate(() => {
    const header = document.querySelector("header");
    const hamburger = [...document.querySelectorAll("header button, header a")].map((b) => b.getAttribute("aria-label")).filter(Boolean);
    const heroImgs = [...(document.querySelector('[data-testid="hero-container"], [data-testid="hero-feature-media"]')?.querySelectorAll("img") || [])].map((i) => ({ src: (i.currentSrc || i.src).slice(0, 160), w: i.naturalWidth }));
    // product grid columns: measure first two product imgs x positions
    const pImgs = [...document.querySelectorAll('img')].filter((i) => (i.currentSrc || i.src).includes("cdn-images.farfetch-contents.com")).slice(0, 6);
    const cols = pImgs.map((i) => Math.round(i.getBoundingClientRect().x));
    const main = document.querySelector("main");
    const sections = main ? [...main.querySelectorAll(":scope > div > *")].map((s) => ({
      testid: s.getAttribute("data-testid"),
      h: Math.round(s.getBoundingClientRect().height),
      w: Math.round(s.getBoundingClientRect().width),
      text: s.innerText?.trim().slice(0, 40) || "",
    })) : [];
    return {
      headerH: header ? Math.round(header.getBoundingClientRect().height) : null,
      headerAria: hamburger.slice(0, 12),
      headerText: header?.innerText?.slice(0, 200),
      heroImgs,
      productImgXs: cols,
      sections,
      bodyW: document.body.clientWidth,
      pageH: document.body.scrollHeight,
    };
  });

  // scrolled header behavior on mobile (hide on scroll down?)
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(400);
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(800);
  results[label].headerAfterScrollDown = await page.evaluate(() => {
    const h = document.querySelector("header");
    const cs = getComputedStyle(h);
    return { transform: cs.transform, top: Math.round(h.getBoundingClientRect().top), position: cs.position };
  });
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(800);
  results[label].headerAfterScrollUp = await page.evaluate(() => {
    const h = document.querySelector("header");
    return { transform: getComputedStyle(h).transform, top: Math.round(h.getBoundingClientRect().top) };
  });

  // mid-page + footer screenshots
  await page.evaluate(() => window.scrollTo(0, 1400));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `docs/design-references/farfetch-${label}-mid.png` });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `docs/design-references/farfetch-${label}-footer.png` });

  await context.close();
}

// Desktop scroll-direction header test too
const dctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "en-US",
  timezoneId: "Asia/Almaty",
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
});
const dpage = await dctx.newPage();
await dpage.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
await dpage.waitForTimeout(6000);
for (const sel of ['button[aria-label="Close"]', 'button:has-text("Dismiss")']) {
  try { const el = dpage.locator(sel).first(); if (await el.isVisible({ timeout: 1000 })) { await el.click(); } } catch {}
}
// simulate wheel scroll down then up
await dpage.mouse.move(720, 450);
for (let i = 0; i < 10; i++) { await dpage.mouse.wheel(0, 200); await dpage.waitForTimeout(120); }
await dpage.waitForTimeout(1000);
results.desktopHeaderScrollDown = await dpage.evaluate(() => {
  const h = document.querySelector("header");
  return { transform: getComputedStyle(h).transform, top: Math.round(h.getBoundingClientRect().top), boxShadow: getComputedStyle(h).boxShadow };
});
for (let i = 0; i < 4; i++) { await dpage.mouse.wheel(0, -200); await dpage.waitForTimeout(120); }
await dpage.waitForTimeout(1000);
results.desktopHeaderScrollUp = await dpage.evaluate(() => {
  const h = document.querySelector("header");
  return { transform: getComputedStyle(h).transform, top: Math.round(h.getBoundingClientRect().top), boxShadow: getComputedStyle(h).boxShadow };
});
await dctx.close();

await browser.close();
fs.writeFileSync("docs/research/farfetch/responsive.json", JSON.stringify(results, null, 2));
console.log("RESPONSIVE_DONE");
