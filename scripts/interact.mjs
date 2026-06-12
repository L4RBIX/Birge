import { chromium } from "playwright";
import fs from "node:fs";

const URL = "https://www.farfetch.com/kz/shopping/men/items.aspx";
const out = {};

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

for (const sel of ['button[aria-label="Close"]', 'button:has-text("Dismiss")', "#onetrust-accept-btn-handler"]) {
  try {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 1200 })) { await el.click(); await page.waitForTimeout(600); }
  } catch {}
}

const headerProps = ["position","top","height","backgroundColor","boxShadow","zIndex","transform","transition","borderBottom"];

// ---- 1. Header at scroll 0 vs scrolled ----
async function headerState() {
  return page.evaluate((props) => {
    const get = (el) => {
      if (!el) return null;
      const cs = getComputedStyle(el);
      const o = {};
      props.forEach((p) => (o[p] = cs[p]));
      const r = el.getBoundingClientRect();
      o.rect = { top: Math.round(r.top), h: Math.round(r.height) };
      return o;
    };
    const header = document.querySelector("header");
    // rows inside header
    const rows = header ? [...header.children].map((c) => ({
      tag: c.tagName.toLowerCase(),
      testid: c.getAttribute("data-testid"),
      cls: (c.className?.toString() || "").slice(0, 50),
      rect: { top: Math.round(c.getBoundingClientRect().top), h: Math.round(c.getBoundingClientRect().height) },
      visible: getComputedStyle(c).display !== "none",
    })) : [];
    // what sits above header in DOM
    const beforeHeader = [];
    let el = header?.previousElementSibling;
    let guard = 0;
    while (el && guard < 6) {
      beforeHeader.push({
        tag: el.tagName.toLowerCase(),
        testid: el.getAttribute("data-testid"),
        cls: (el.className?.toString() || "").slice(0, 50),
        text: el.innerText?.trim().slice(0, 120),
        styles: get(el),
      });
      el = el.previousElementSibling;
      guard++;
    }
    return { header: get(header), rows, beforeHeader, scrollY: window.scrollY };
  }, headerProps);
}

out.headerAtTop = await headerState();
await page.screenshot({ path: "docs/design-references/header-at-top.png", clip: { x: 0, y: 0, width: 1440, height: 220 } });
await page.evaluate(() => window.scrollTo(0, 800));
await page.waitForTimeout(1200);
out.headerScrolled = await headerState();
await page.screenshot({ path: "docs/design-references/header-scrolled.png", clip: { x: 0, y: 0, width: 1440, height: 220 } });

// ---- 2. Promo strip rotation (time-driven check) ----
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);
const bannerText1 = await page.evaluate(() => document.body.innerText.slice(0, 300));
await page.waitForTimeout(6000);
const bannerText2 = await page.evaluate(() => document.body.innerText.slice(0, 300));
out.bannerRotation = { sample1: bannerText1.slice(0, 150), sample2: bannerText2.slice(0, 150), changed: bannerText1 !== bannerText2 };

// ---- 3. Mega menu hover ----
async function hoverNav(label, file) {
  try {
    const item = page.locator(`header a:has-text("${label}"), header button:has-text("${label}")`).first();
    await item.hover();
    await page.waitForTimeout(1500);
    const menu = await page.evaluate(() => {
      const panels = [...document.querySelectorAll('[data-testid*="meganav"], [data-testid*="mega"], header ~ div [role="menu"], nav [aria-expanded="true"]')];
      const vis = [...document.querySelectorAll("div")].filter((d) => {
        const r = d.getBoundingClientRect();
        const cs = getComputedStyle(d);
        return r.height > 200 && r.width > 800 && r.top > 80 && r.top < 200 && cs.backgroundColor === "rgb(255, 255, 255)" && (cs.position === "absolute" || cs.position === "fixed");
      });
      const panel = vis[0];
      if (!panel) return { found: false, panelsTestids: panels.map((p) => p.getAttribute("data-testid")) };
      return {
        found: true,
        rect: { top: Math.round(panel.getBoundingClientRect().top), h: Math.round(panel.getBoundingClientRect().height) },
        columns: [...panel.querySelectorAll("ul")].length,
        text: panel.innerText.slice(0, 1500),
      };
    });
    await page.screenshot({ path: `docs/design-references/${file}` });
    return menu;
  } catch (e) {
    return { error: e.message.slice(0, 100) };
  }
}
out.megaMenuClothing = await hoverNav("Clothing", "meganav-clothing.png");
await page.mouse.move(720, 500);
await page.waitForTimeout(800);

// ---- 4. Search focus ----
try {
  await page.locator('header input, [data-testid*="search"] input, input[placeholder*="looking"]').first().click({ timeout: 3000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "docs/design-references/search-open.png" });
  out.searchOpen = await page.evaluate(() => {
    const panels = [...document.querySelectorAll("div")].filter((d) => {
      const r = d.getBoundingClientRect();
      return r.height > 150 && r.top > 100 && r.top < 300 && r.width > 600;
    });
    return { panelText: panels[0]?.innerText?.slice(0, 400) || null };
  });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);
} catch (e) {
  out.searchOpen = { error: e.message.slice(0, 80) };
}

// ---- 5. Product card hover (New Season carousel) ----
await page.evaluate(() => window.scrollTo(0, 1162));
await page.waitForTimeout(2000);
const cardSel = await page.evaluate(() => {
  // find product card containers in first carousel
  const imgs = [...document.querySelectorAll('img[src*="cdn-images.farfetch-contents.com"]')];
  const card = imgs[0]?.closest("li") || imgs[0]?.closest('[data-testid]');
  if (!card) return null;
  card.setAttribute("data-clone-probe", "card0");
  const imgsIn = card.querySelectorAll("img").length;
  return { found: true, imgsIn, html: card.outerHTML.slice(0, 2500) };
});
out.cardStructure = cardSel;

if (cardSel?.found) {
  const before = await page.evaluate(() => {
    const card = document.querySelector('[data-clone-probe="card0"]');
    const img = card.querySelector("img");
    return { imgSrc: img?.currentSrc, imgCount: card.querySelectorAll("img").length, transform: getComputedStyle(img).transform, opacity: getComputedStyle(img).opacity };
  });
  await page.locator('[data-clone-probe="card0"]').hover();
  await page.waitForTimeout(1500);
  const after = await page.evaluate(() => {
    const card = document.querySelector('[data-clone-probe="card0"]');
    const img = card.querySelector("img");
    const visibleImgs = [...card.querySelectorAll("img")].map((i) => ({ src: i.currentSrc.slice(-40), opacity: getComputedStyle(i).opacity, display: getComputedStyle(i).display }));
    return { imgSrc: img?.currentSrc, visibleImgs, transform: getComputedStyle(img).transform };
  });
  out.cardHover = { before, after, imageSwapped: before.imgSrc !== after.imgSrc };
  await page.screenshot({ path: "docs/design-references/card-hover.png" });
}

// ---- 6. Carousel arrows ----
out.carousel = await page.evaluate(() => {
  const wrappers = [...document.querySelectorAll('[data-testid="custom-module-wrapper"]')];
  return wrappers.map((w) => {
    const btns = [...w.querySelectorAll("button")].map((b) => ({
      aria: b.getAttribute("aria-label"),
      cls: (b.className?.toString() || "").slice(0, 40),
      visible: getComputedStyle(b).display !== "none" && getComputedStyle(b).visibility !== "hidden",
    }));
    const scroller = [...w.querySelectorAll("ul, div")].find((el) => {
      const cs = getComputedStyle(el);
      return (cs.overflowX === "auto" || cs.overflowX === "scroll") && el.scrollWidth > el.clientWidth;
    });
    return {
      heading: w.querySelector("h2, h3, p")?.textContent?.trim().slice(0, 60),
      buttons: btns.slice(0, 6),
      scroller: scroller ? {
        tag: scroller.tagName.toLowerCase(),
        scrollSnapType: getComputedStyle(scroller).scrollSnapType,
        scrollWidth: scroller.scrollWidth,
        clientWidth: scroller.clientWidth,
        gap: getComputedStyle(scroller).gap,
        childSnapAlign: scroller.firstElementChild ? getComputedStyle(scroller.firstElementChild).scrollSnapAlign : null,
      } : null,
    };
  });
});

// ---- 7. Hero rotation check (time-driven) ----
await page.evaluate(() => window.scrollTo(0, 200));
const hero1 = await page.evaluate(() => document.querySelector('[data-testid="hero-container"]')?.innerText.slice(0, 100));
await page.waitForTimeout(9000);
const hero2 = await page.evaluate(() => document.querySelector('[data-testid="hero-container"]')?.innerText.slice(0, 100));
out.heroRotation = { hero1, hero2, changed: hero1 !== hero2 };
// hero structure
out.heroStructure = await page.evaluate(() => {
  const h = document.querySelector('[data-testid="hero-container"]');
  if (!h) return null;
  return {
    html: h.outerHTML.slice(0, 3000),
    imgs: [...h.querySelectorAll("img")].map((i) => ({ src: i.currentSrc, w: i.naturalWidth, h: i.naturalHeight })),
    dots: [...h.querySelectorAll('button, [role="tab"]')].map((b) => ({ aria: b.getAttribute("aria-label"), cls: (b.className?.toString()||"").slice(0,30) })),
  };
});

// ---- 8. Asset collection (full page, all srcsets) ----
await page.evaluate(async () => {
  const step = 600;
  for (let y = 0; y <= document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 250));
  }
});
await page.waitForTimeout(2000);
out.assets = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll("img")].map((img) => ({
    src: img.currentSrc || img.src,
    srcset: img.srcset || null,
    alt: img.alt,
    w: img.naturalWidth,
    h: img.naturalHeight,
    section: img.closest('[data-testid]')?.getAttribute("data-testid") || null,
  })).filter((i) => i.src && !i.src.startsWith("data:") && !i.src.includes("bat.bing"));
  const bgs = [...document.querySelectorAll("*")].map((el) => {
    const bg = getComputedStyle(el).backgroundImage;
    return bg && bg !== "none" && bg.includes("url(") ? { el: el.tagName + "." + (el.className?.toString().split(" ")[0] || ""), bg: bg.slice(0, 300) } : null;
  }).filter(Boolean);
  return { imgs, bgs };
});

// ---- 9. SVG collection ----
out.svgs = await page.evaluate(() => {
  const seen = new Map();
  [...document.querySelectorAll("svg")].forEach((svg) => {
    const html = svg.outerHTML;
    const key = html.replace(/\s+/g, "").slice(0, 150);
    if (!seen.has(key)) {
      seen.set(key, {
        html: html.slice(0, 2000),
        context: svg.closest("[aria-label]")?.getAttribute("aria-label") || svg.closest("a,button")?.textContent?.trim().slice(0, 30) || svg.parentElement?.className?.toString().slice(0, 40),
        w: svg.getBoundingClientRect().width,
        h: svg.getBoundingClientRect().height,
      });
    }
  });
  return [...seen.values()];
});

fs.writeFileSync("docs/research/farfetch/interactions.json", JSON.stringify(out, null, 2));
await browser.close();
console.log("INTERACT_DONE svgs=" + out.svgs.length + " imgs=" + out.assets.imgs.length + " cardSwap=" + JSON.stringify(out.cardHover?.imageSwapped));
