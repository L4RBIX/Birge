import { chromium } from "playwright";
import fs from "node:fs";

const URL = "https://www.farfetch.com/kz/shopping/men/items.aspx";

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--disable-blink-features=AutomationControlled"],
});

async function newPage(width, height) {
  const context = await browser.newContext({
    viewport: { width, height },
    locale: "en-US",
    timezoneId: "Asia/Almaty",
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();
  return { context, page };
}

async function dismissOverlays(page) {
  for (const sel of [
    "#onetrust-accept-btn-handler",
    '[data-testid="cookie-accept"]',
    'button:has-text("Accept")',
  ]) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 1500 })) {
        await el.click();
        await page.waitForTimeout(1000);
        break;
      }
    } catch {}
  }
}

async function lazyScroll(page) {
  await page.evaluate(async () => {
    const step = 800;
    const max = document.body.scrollHeight;
    for (let y = 0; y <= max + 2000; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 350));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 1500));
  });
}

// ---------- Desktop pass ----------
const { context, page } = await newPage(1440, 900);
await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(6000);
await dismissOverlays(page);
await lazyScroll(page);

await page.screenshot({
  path: "docs/design-references/farfetch-desktop-full.png",
  fullPage: true,
});

const data = await page.evaluate(() => {
  const pick = (el, props) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const out = {};
    props.forEach((p) => (out[p] = cs[p]));
    return out;
  };
  const textProps = [
    "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing",
    "color", "textTransform", "backgroundColor",
  ];

  // Fonts
  const fontLinks = [...document.querySelectorAll('link[rel="stylesheet"], link[rel="preload"][as="font"], link[as="font"]')]
    .map((l) => l.href)
    .filter((h) => /font|css/i.test(h));
  const fontFaces = [];
  try {
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule instanceof CSSFontFaceRule) {
            fontFaces.push(rule.cssText.slice(0, 400));
          }
        }
      } catch {}
    }
  } catch {}

  // Favicons & meta
  const favicons = [...document.querySelectorAll('link[rel*="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]')]
    .map((l) => ({ rel: l.rel, href: l.href, sizes: l.sizes?.toString() }));
  const meta = {
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content,
    ogImage: document.querySelector('meta[property="og:image"]')?.content,
  };

  // Header / nav structure
  const headerLinks = [...document.querySelectorAll("header a, header button")].slice(0, 80).map((a) => ({
    text: a.textContent?.trim().slice(0, 60),
    href: a.href || null,
    aria: a.getAttribute("aria-label"),
  }));

  // Product cards
  const cards = [...document.querySelectorAll('[data-testid="productCard"], li[data-testid="productCard"]')];
  const fallbackCards = cards.length ? cards : [...document.querySelectorAll('ul li a[href*="/shopping/"][href*="item"]')].map((a) => a.closest("li")).filter(Boolean);
  const products = [...new Set(fallbackCards)].slice(0, 30).map((c) => {
    const img = c.querySelector("img");
    const texts = [...c.querySelectorAll("p, span, h2, h3")].map((t) => t.textContent?.trim()).filter(Boolean);
    return {
      img: img?.currentSrc || img?.src,
      imgAlt: img?.alt,
      imgCount: c.querySelectorAll("img").length,
      texts: texts.slice(0, 8),
      href: c.querySelector("a")?.href,
    };
  });

  // All images
  const images = [...document.querySelectorAll("img")].map((img) => ({
    src: (img.currentSrc || img.src || "").slice(0, 300),
    alt: img.alt?.slice(0, 100),
    w: img.naturalWidth,
    h: img.naturalHeight,
  }));

  // Key element styles
  const styleSamples = {
    body: pick(document.body, textProps),
    h1: pick(document.querySelector("h1"), textProps),
    headerEl: pick(document.querySelector("header"), ["backgroundColor", "position", "height", "borderBottom", "zIndex"]),
    firstCardBrand: pick(fallbackCards[0]?.querySelector("p, h2, h3"), textProps),
    pageBackground: getComputedStyle(document.documentElement).backgroundColor,
  };

  // Top-level sections
  const main = document.querySelector("main") || document.body;
  const sections = [...main.children].slice(0, 25).map((s) => ({
    tag: s.tagName.toLowerCase(),
    id: s.id || null,
    classes: (s.className?.toString() || "").slice(0, 120),
    testid: s.getAttribute("data-testid"),
    rect: { h: Math.round(s.getBoundingClientRect().height) },
    textStart: s.textContent?.trim().slice(0, 120),
  }));

  return {
    meta, favicons, fontLinks, fontFaces: fontFaces.slice(0, 12),
    fontsUsed: [...new Set([...document.querySelectorAll("h1,h2,h3,p,a,span,button")].slice(0, 300).map((el) => getComputedStyle(el).fontFamily))],
    headerLinks, products, imageCount: images.length, images: images.slice(0, 60),
    svgCount: document.querySelectorAll("svg").length,
    styleSamples, sections,
    framework: {
      nextData: Boolean(document.getElementById("__NEXT_DATA__")),
      nuxt: Boolean(window.__NUXT__),
      reactRoot: Boolean(document.querySelector("#root, [data-reactroot]")),
    },
    pageHeight: document.body.scrollHeight,
  };
});

fs.mkdirSync("docs/research/farfetch", { recursive: true });
fs.writeFileSync("docs/research/farfetch/recon-desktop.json", JSON.stringify(data, null, 2));

// Viewport screenshots top / mid for quick reference
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(800);
await page.screenshot({ path: "docs/design-references/farfetch-desktop-top.png" });
await context.close();

// ---------- Mobile pass ----------
const m = await newPage(390, 844);
await m.page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
await m.page.waitForTimeout(6000);
await dismissOverlays(m.page);
await lazyScroll(m.page);
await m.page.screenshot({ path: "docs/design-references/farfetch-mobile-full.png", fullPage: true });
await m.page.evaluate(() => window.scrollTo(0, 0));
await m.page.waitForTimeout(800);
await m.page.screenshot({ path: "docs/design-references/farfetch-mobile-top.png" });
await m.context.close();

await browser.close();
console.log("RECON_DONE pageHeight=" + data.pageHeight + " images=" + data.imageCount + " products=" + data.products.length);
