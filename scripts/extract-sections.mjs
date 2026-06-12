import { chromium } from "playwright";
import fs from "node:fs";

const URL = "https://www.farfetch.com/kz/shopping/men/items.aspx";
fs.mkdirSync("docs/research/farfetch/sections", { recursive: true });

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
// full hydration scroll
await page.evaluate(async () => {
  for (let y = 0; y <= document.body.scrollHeight; y += 500) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 300));
  }
});
await page.waitForTimeout(2000);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1500);

// The deep style walker, installed once
await page.evaluate(() => {
  const props = [
    "fontSize","fontWeight","fontFamily","lineHeight","letterSpacing","color",
    "textTransform","textDecoration","backgroundColor",
    "paddingTop","paddingRight","paddingBottom","paddingLeft",
    "marginTop","marginRight","marginBottom","marginLeft",
    "width","height","maxWidth","minHeight",
    "display","flexDirection","justifyContent","alignItems","gap","flexWrap","flex",
    "gridTemplateColumns","gridAutoFlow",
    "borderRadius","border","borderTop","borderBottom",
    "boxShadow","overflow","overflowX",
    "position","top","right","bottom","left","zIndex",
    "opacity","transform","transition","cursor",
    "objectFit","aspectRatio","whiteSpace","textOverflow","textAlign","verticalAlign",
  ];
  window.__walk = function walk(element, depth, maxDepth = 6) {
    if (!element || element.nodeType !== 1) return null;
    const cs = getComputedStyle(element);
    if (cs.display === "none") return { tag: element.tagName.toLowerCase(), hidden: true };
    const styles = {};
    props.forEach((p) => {
      const v = cs[p];
      if (v && v !== "none" && v !== "normal" && v !== "auto" && v !== "0px" && v !== "rgba(0, 0, 0, 0)" && v !== "visible" && v !== "static" && v !== "1" && v !== "row" && v !== "nowrap" && v !== "0px 0px") styles[p] = v;
    });
    const children = [...element.children];
    const r = element.getBoundingClientRect();
    return {
      tag: element.tagName.toLowerCase(),
      testid: element.getAttribute("data-testid") || undefined,
      aria: element.getAttribute("aria-label") || undefined,
      href: element.tagName === "A" ? element.getAttribute("href") : undefined,
      rect: { x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) },
      text: element.childNodes.length && [...element.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
        ? [...element.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(" ").slice(0, 150)
        : undefined,
      img: element.tagName === "IMG" ? { src: element.currentSrc || element.src, srcset: element.srcset || undefined, w: element.naturalWidth, h: element.naturalHeight } : undefined,
      svg: element.tagName === "svg" ? element.outerHTML.slice(0, 600) : undefined,
      styles,
      children: depth < maxDepth ? children.slice(0, 24).map((c) => walk(c, depth + 1, maxDepth)).filter(Boolean) : (children.length ? [`...${children.length} children`] : undefined),
    };
  };
});

async function dump(selector, name, maxDepth = 6) {
  const data = await page.evaluate(
    ([sel, md]) => {
      const el = typeof sel === "string" ? document.querySelector(sel) : null;
      if (!el) return { error: "not found: " + sel };
      return window.__walk(el, 0, md);
    },
    [selector, maxDepth]
  );
  fs.writeFileSync(`docs/research/farfetch/sections/${name}.json`, JSON.stringify(data, null, 1));
  return data;
}

async function shoot(selector, name, pad = 0) {
  try {
    const box = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y + window.scrollY, w: r.width, h: r.height };
    }, selector);
    if (!box) return;
    await page.evaluate((y) => window.scrollTo(0, Math.max(0, y - 150)), box.y);
    await page.waitForTimeout(900);
    const r2 = await page.evaluate((sel) => {
      const r = document.querySelector(sel).getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    }, selector);
    await page.screenshot({
      path: `docs/design-references/${name}.png`,
      clip: {
        x: Math.max(0, r2.x - pad),
        y: Math.max(0, r2.y - pad),
        width: Math.min(1440, r2.w + pad * 2),
        height: Math.min(900 - Math.max(0, r2.y - pad), r2.h + pad * 2),
      },
    });
  } catch (e) {
    console.error("shoot fail", name, e.message.slice(0, 80));
  }
}

// ---- Top strip + header ----
await dump('[data-testid="globalPos"]', "global-banner-strip", 4);
await dump("header", "header", 7);
await shoot('[data-testid="globalPos"]', "sec-banner-strip");

// ---- Main sections ----
const mains = await page.evaluate(() => {
  const main = document.querySelector("main");
  const secs = [...main.querySelectorAll(":scope > div > *")];
  return secs.map((s, i) => {
    s.setAttribute("data-clone-sec", String(i));
    return { i, testid: s.getAttribute("data-testid"), h: Math.round(s.getBoundingClientRect().height), text: s.innerText?.trim().slice(0, 50) || "" };
  });
});
fs.writeFileSync("docs/research/farfetch/sections/_index.json", JSON.stringify(mains, null, 2));

const names = ["hero", "new-in-carousel", "split-banner-1", "sale-carousel", "trending-now", "split-banner-2", "brands-moment"];
for (let i = 0; i < Math.min(names.length, mains.length); i++) {
  await page.evaluate((idx) => {
    const el = document.querySelector(`[data-clone-sec="${idx}"]`);
    el?.scrollIntoView({ block: "start" });
  }, i);
  await page.waitForTimeout(1500);
  await dump(`[data-clone-sec="${i}"]`, names[i], 7);
  await shoot(`[data-clone-sec="${i}"]`, `sec-${names[i]}`);
}

// ---- Help bar / newsletter / footer ----
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight - 2500));
await page.waitForTimeout(2000);
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(2500);
await dump('[data-testid="help-bar"]', "help-bar", 6);
await shoot('[data-testid="help-bar"]', "sec-help-bar");
// newsletter: section between help-bar and footer
await page.evaluate(() => {
  const hb = document.querySelector('[data-testid="help-bar"]');
  let el = hb?.nextElementSibling;
  if (el) el.setAttribute("data-clone-sec", "newsletter");
});
await dump('[data-clone-sec="newsletter"]', "newsletter", 6);
await shoot('[data-clone-sec="newsletter"]', "sec-newsletter");
await dump("footer", "footer", 6);
await shoot("footer", "sec-footer");

// ---- Product card deep-dive + hover ----
await page.evaluate(() => {
  const img = [...document.querySelectorAll('img')].find((i) => (i.currentSrc || i.src).includes("cdn-images.farfetch-contents.com"));
  const card = img?.closest("li") || img?.closest("a")?.parentElement;
  if (card) card.setAttribute("data-clone-probe", "card0");
});
const cardFound = await page.evaluate(() => !!document.querySelector('[data-clone-probe="card0"]'));
let hoverResult = { cardFound };
if (cardFound) {
  await page.evaluate(() => document.querySelector('[data-clone-probe="card0"]').scrollIntoView({ block: "center" }));
  await page.waitForTimeout(1200);
  await dump('[data-clone-probe="card0"]', "product-card", 7);
  const before = await page.evaluate(() => {
    const card = document.querySelector('[data-clone-probe="card0"]');
    return {
      imgs: [...card.querySelectorAll("img")].map((i) => ({ src: (i.currentSrc || i.src).slice(-50), op: getComputedStyle(i).opacity, vis: getComputedStyle(i).visibility, disp: getComputedStyle(i).display })),
      html: card.outerHTML.length,
    };
  });
  await page.locator('[data-clone-probe="card0"]').hover();
  await page.waitForTimeout(1500);
  const after = await page.evaluate(() => {
    const card = document.querySelector('[data-clone-probe="card0"]');
    return {
      imgs: [...card.querySelectorAll("img")].map((i) => ({ src: (i.currentSrc || i.src).slice(-50), op: getComputedStyle(i).opacity, vis: getComputedStyle(i).visibility, disp: getComputedStyle(i).display })),
      html: card.outerHTML.length,
    };
  });
  hoverResult = { cardFound, before, after };
  await shoot('[data-clone-probe="card0"]', "card-hover-state", 10);
}
fs.writeFileSync("docs/research/farfetch/sections/product-card-hover.json", JSON.stringify(hoverResult, null, 2));

// ---- Carousel arrows: hover over the new-in carousel area ----
await page.evaluate(() => document.querySelector('[data-clone-sec="1"]')?.scrollIntoView({ block: "center" }));
await page.waitForTimeout(1200);
await page.mouse.move(720, 450);
await page.waitForTimeout(1000);
const arrows = await page.evaluate(() => {
  const sec = document.querySelector('[data-clone-sec="1"]');
  if (!sec) return null;
  return [...sec.querySelectorAll("button")].map((b) => ({
    aria: b.getAttribute("aria-label"),
    text: b.textContent?.trim().slice(0, 20),
    rect: (() => { const r = b.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })(),
    visible: getComputedStyle(b).visibility !== "hidden" && getComputedStyle(b).display !== "none" && b.getBoundingClientRect().width > 0,
    svg: b.querySelector("svg") ? b.querySelector("svg").outerHTML.slice(0, 400) : null,
  }));
});
fs.writeFileSync("docs/research/farfetch/sections/carousel-buttons.json", JSON.stringify(arrows, null, 2));

// carousel track mechanics
const track = await page.evaluate(() => {
  const sec = document.querySelector('[data-clone-sec="1"]');
  const candidates = [...sec.querySelectorAll("*")].filter((el) => el.scrollWidth > el.clientWidth + 50);
  return candidates.slice(0, 4).map((el) => ({
    tag: el.tagName.toLowerCase(),
    testid: el.getAttribute("data-testid"),
    cls: (el.className?.toString() || "").slice(0, 50),
    overflowX: getComputedStyle(el).overflowX,
    scrollSnapType: getComputedStyle(el).scrollSnapType,
    scrollW: el.scrollWidth,
    clientW: el.clientWidth,
    childCount: el.children.length,
    firstChildW: el.firstElementChild ? Math.round(el.firstElementChild.getBoundingClientRect().width) : null,
    gap: getComputedStyle(el).gap,
    firstChildSnap: el.firstElementChild ? getComputedStyle(el.firstElementChild).scrollSnapAlign : null,
  }));
});
fs.writeFileSync("docs/research/farfetch/sections/carousel-track.json", JSON.stringify(track, null, 2));

// ---- Search overlay ----
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(800);
try {
  await page.locator('input[placeholder*="looking"], header input').first().click({ timeout: 4000 });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: "docs/design-references/sec-search-open.png" });
  const searchDump = await page.evaluate(() => {
    // search panel is likely a sibling/child of header with high z-index
    const cands = [...document.querySelectorAll("div, section")].filter((d) => {
      const r = d.getBoundingClientRect();
      const cs = getComputedStyle(d);
      return r.top >= 100 && r.top < 250 && r.height > 120 && r.width > 1000 && (cs.position === "absolute" || cs.position === "fixed") && cs.backgroundColor === "rgb(255, 255, 255)";
    });
    const p = cands[0];
    return p ? window.__walk(p, 0, 5) : { error: "no search panel found" };
  });
  fs.writeFileSync("docs/research/farfetch/sections/search-panel.json", JSON.stringify(searchDump, null, 1));
} catch (e) {
  console.error("search fail", e.message.slice(0, 80));
}

// ---- Mega menu dump ----
try {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  await page.locator('header a:has-text("Clothing")').first().hover({ timeout: 4000 });
  await page.waitForTimeout(1500);
  const mega = await page.evaluate(() => {
    const cands = [...document.querySelectorAll("div, section")].filter((d) => {
      const r = d.getBoundingClientRect();
      const cs = getComputedStyle(d);
      return r.height > 300 && r.width > 1000 && r.top > 100 && r.top < 250 && cs.backgroundColor === "rgb(255, 255, 255)";
    });
    const p = cands.sort((a, b) => a.getBoundingClientRect().height - b.getBoundingClientRect().height)[0];
    return p ? window.__walk(p, 0, 6) : { error: "no mega panel" };
  });
  fs.writeFileSync("docs/research/farfetch/sections/mega-menu.json", JSON.stringify(mega, null, 1));
  await page.screenshot({ path: "docs/design-references/sec-mega-menu.png" });
} catch (e) {
  console.error("mega fail", e.message.slice(0, 80));
}

await browser.close();
console.log("EXTRACT_SECTIONS_DONE");
