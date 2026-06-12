import { chromium } from "playwright";
import fs from "node:fs";

const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--disable-blink-features=AutomationControlled"] });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
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
  for (let y = 0; y <= document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 280)); }
});
await page.waitForTimeout(2500);

const content = await page.evaluate(() => {
  const out = {};
  const txt = (el) => el?.textContent?.trim() || null;

  // 1. banner strip
  const strip = document.querySelector('[data-testid="globalPos"]');
  out.bannerStrip = strip
    ? [...strip.querySelectorAll("li")].map((li) => ({
        text: li.innerText.trim(),
        href: li.querySelector("a")?.getAttribute("href"),
        bg: getComputedStyle(li).backgroundColor,
        color: getComputedStyle(li).color,
        fontSize: getComputedStyle(li).fontSize,
        textAlign: getComputedStyle(li.querySelector("a") || li).textAlign,
        opacity: getComputedStyle(li).opacity,
      }))
    : null;

  // 2. hero
  const hero = document.querySelector('[data-testid="hero-container"]');
  if (hero) {
    const h1 = hero.querySelector("h1, h2, h3");
    const p = [...hero.querySelectorAll("p")].find((x) => x.textContent.length > 40);
    const cta = [...hero.querySelectorAll("a")].find((a) => /shop now/i.test(a.textContent));
    const img = hero.querySelector("img");
    const cs = (el, props) => {
      if (!el) return null;
      const c = getComputedStyle(el);
      return Object.fromEntries(props.map((p2) => [p2, c[p2]]));
    };
    out.hero = {
      title: txt(h1),
      titleStyles: cs(h1, ["fontSize", "fontFamily", "fontWeight", "lineHeight", "letterSpacing", "color", "textAlign"]),
      body: txt(p),
      bodyStyles: cs(p, ["fontSize", "lineHeight", "color", "textAlign", "maxWidth"]),
      ctaLabel: txt(cta),
      ctaHref: cta?.getAttribute("href"),
      ctaStyles: cs(cta, ["fontSize", "fontWeight", "color", "backgroundColor", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "height", "minWidth", "display", "alignItems", "justifyContent", "border"]),
      img: img ? { src: img.currentSrc, w: img.naturalWidth, h: img.naturalHeight } : null,
      imgBoxStyles: img ? cs(img, ["width", "height", "objectFit", "aspectRatio"]) : null,
      sectionH: Math.round(hero.getBoundingClientRect().height),
      textColLeft: (() => { const tb = h1?.closest("div"); const r = tb?.getBoundingClientRect(); return r ? { x: Math.round(r.x), w: Math.round(r.width) } : null; })(),
      bg: getComputedStyle(hero).backgroundColor,
    };
  }

  // 3+4. product rails
  out.rails = [...document.querySelectorAll('[data-testid="custom-module-wrapper"]')]
    .map((w) => {
      const heading = w.querySelector("h2, h3");
      const cards = [...w.querySelectorAll("a")].filter((a) => a.querySelector("img") && /item-\d+/.test(a.getAttribute("href") || ""));
      if (!cards.length) return null;
      const cta = [...w.querySelectorAll("a")].find((a) => /shop now/i.test(a.textContent || "") && !/item-\d+/.test(a.getAttribute("href") || ""));
      return {
        heading: txt(heading),
        headingStyles: (() => { const c = getComputedStyle(heading); return { fontSize: c.fontSize, fontWeight: c.fontWeight, fontFamily: c.fontFamily.slice(0, 40), textAlign: c.textAlign, color: c.color }; })(),
        ctaLabel: txt(cta),
        ctaHref: cta?.getAttribute("href"),
        products: cards.map((a) => {
          const img = a.querySelector("img");
          const ps = [...a.querySelectorAll("p")].map((p) => ({ t: p.textContent.trim(), fs: getComputedStyle(p).fontSize, fw: getComputedStyle(p).fontWeight, color: getComputedStyle(p).color, td: getComputedStyle(p).textDecoration.split(" ")[0] }));
          const spans = [...a.querySelectorAll("span")].map((s) => ({ t: s.textContent.trim(), fs: getComputedStyle(s).fontSize, fw: getComputedStyle(s).fontWeight, color: getComputedStyle(s).color, td: getComputedStyle(s).textDecoration.split(" ")[0] })).filter((s) => s.t);
          return {
            href: a.getAttribute("href"),
            img: img ? { src: img.currentSrc, srcset: img.srcset } : null,
            texts: ps,
            spans: spans.slice(0, 12),
            ariaLabel: a.getAttribute("aria-label"),
          };
        }),
      };
    })
    .filter(Boolean);

  // brands of the moment
  const brandsW = [...document.querySelectorAll('[data-testid="custom-module-wrapper"]')].find((w) => /Brands of the moment/.test(w.innerText));
  if (brandsW) {
    out.brands = {
      heading: "Brands of the moment",
      tiles: [...brandsW.querySelectorAll("a")].map((a) => ({
        label: a.innerText.trim().slice(0, 50),
        href: a.getAttribute("href"),
        img: a.querySelector("img")?.currentSrc,
        labelStyles: (() => { const lbl = [...a.querySelectorAll("p, h2, h3, span")].find((x) => x.textContent.trim()); if (!lbl) return null; const c = getComputedStyle(lbl); return { fontSize: c.fontSize, fontFamily: c.fontFamily.slice(0, 40), color: c.color, textAlign: c.textAlign, position: getComputedStyle(lbl.parentElement).position }; })(),
      })),
    };
  }

  // trending now
  const trendW = [...document.querySelectorAll('[data-testid="custom-module-container"], [data-testid="custom-module-wrapper"]')].find((w) => /Trending now/.test(w.innerText));
  if (trendW) {
    out.trending = {
      heading: "Trending now",
      headingStyles: (() => { const h = [...trendW.querySelectorAll("h2, h3")].find((x) => /Trending/.test(x.textContent)); const c = getComputedStyle(h); return { fontSize: c.fontSize, fontWeight: c.fontWeight, textAlign: c.textAlign }; })(),
      tiles: [...trendW.querySelectorAll("a")].map((a) => ({
        label: a.innerText.trim(),
        href: a.getAttribute("href"),
        img: a.querySelector("img")?.currentSrc,
        labelStyles: (() => { const lbl = [...a.querySelectorAll("p, h2, h3, span")].find((x) => x.textContent.trim()); if (!lbl) return null; const c = getComputedStyle(lbl); return { fontSize: c.fontSize, fontWeight: c.fontWeight, textTransform: c.textTransform, textDecoration: c.textDecoration.split(" ")[0], letterSpacing: c.letterSpacing }; })(),
      })),
    };
  }

  // help bar
  const hb = document.querySelector('[data-testid="help-bar"]');
  if (hb) {
    out.helpBar = [...hb.querySelectorAll("a, article")].filter((el) => el.tagName === "A" || !el.querySelector("a")).slice(0, 6).map((el) => ({
      tag: el.tagName.toLowerCase(),
      href: el.getAttribute?.("href"),
      title: txt(el.querySelector("h2, h3, h4, strong, b, [class*='title']")) || el.innerText.split("\n")[0],
      body: el.innerText.split("\n").slice(1).join(" ").trim(),
      iconUse: el.querySelector("use")?.getAttribute("xlink:href") || el.querySelector("use")?.getAttribute("href"),
    }));
  }

  // footer link columns with hrefs
  const footer = document.querySelector("footer");
  if (footer) {
    out.footer = {
      columns: [...footer.querySelectorAll("section, div")]
        .filter((d) => d.querySelector("ul") && d.querySelector("h3, h4, p, strong"))
        .slice(0, 8)
        .map((d) => ({
          heading: txt(d.querySelector("h3, h4, p, strong")),
          links: [...d.querySelectorAll("ul a")].map((a) => ({ label: txt(a), href: a.getAttribute("href") })),
        })),
      social: [...footer.querySelectorAll("a")].filter((a) => /instagram|tiktok|facebook|youtube/i.test(a.getAttribute("href") || "")).map((a) => ({ aria: a.getAttribute("aria-label"), href: a.getAttribute("href") })),
      legal: [...footer.querySelectorAll("a")].filter((a) => /privacy|terms|accessibility/i.test(a.textContent || "")).map((a) => ({ label: txt(a), href: a.getAttribute("href") })),
      legalText: footer.innerText.match(/'FARFETCH'[^©]+/)?.[0]?.trim(),
      copyright: footer.innerText.match(/© Copyright[^\n]+/)?.[0],
    };
  }

  // gender tabs + nav
  out.genderTabs = [...document.querySelectorAll("header a, header button")].filter((el) => ["Womenswear", "Menswear", "Kidswear"].includes(el.textContent?.trim())).map((el) => ({
    label: el.textContent.trim(),
    tag: el.tagName.toLowerCase(),
    href: el.getAttribute("href"),
    fontWeight: getComputedStyle(el).fontWeight,
    color: getComputedStyle(el).color,
    fontSize: getComputedStyle(el).fontSize,
    borderBottom: getComputedStyle(el).borderBottom,
  }));
  out.navItems = [...document.querySelectorAll("header a")].filter((a) => ["Sale", "New in", "Vacation", "Brands", "Clothing", "Shoes", "Bags", "Accessories", "Watches", "Lifestyle"].includes(a.textContent?.trim())).map((a) => ({
    label: a.textContent.trim(),
    href: a.getAttribute("href"),
    color: getComputedStyle(a).color,
    fontSize: getComputedStyle(a).fontSize,
    fontWeight: getComputedStyle(a).fontWeight,
    padding: `${getComputedStyle(a).paddingTop} ${getComputedStyle(a).paddingRight}`,
  }));

  return out;
});
fs.writeFileSync("docs/research/farfetch/content-final.json", JSON.stringify(content, null, 1));

// ---- Ad tile element screenshots ----
fs.mkdirSync("public/images/ads", { recursive: true });
const adContainers = await page.evaluate(() => {
  const ads = [...document.querySelectorAll('[data-component="Ads"] [id*="google_ads_iframe"][id$="__container__"], [data-component="Ads"] div[id^="google_ads_iframe"]')];
  return ads.map((a, i) => { a.setAttribute("data-ad-probe", String(i)); const r = a.getBoundingClientRect(); return { i, w: Math.round(r.width), h: Math.round(r.height) }; });
});
console.log("ad containers:", JSON.stringify(adContainers));
let adIdx = 0;
for (const ad of adContainers) {
  if (ad.w < 100) continue;
  try {
    const loc = page.locator(`[data-ad-probe="${ad.i}"]`);
    await loc.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    await loc.screenshot({ path: `public/images/ads/ad-tile-${adIdx}.png` });
    adIdx++;
  } catch (e) {
    console.error("ad shot fail", ad.i, e.message.slice(0, 60));
  }
}
await browser.close();
console.log("CONTENT_DONE rails=" + content.rails.length + " adTiles=" + adIdx);
