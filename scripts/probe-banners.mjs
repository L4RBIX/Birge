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
await page.waitForTimeout(6000);
for (const sel of ['button[aria-label="Close"]', 'button:has-text("Dismiss")']) {
  try { const el = page.locator(sel).first(); if (await el.isVisible({ timeout: 1000 })) { await el.click(); await page.waitForTimeout(500); } } catch {}
}
await page.evaluate(async () => {
  for (let y = 0; y <= document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 250)); }
});
await page.waitForTimeout(2000);

const result = await page.evaluate(() => {
  const out = { banners: [], newsletter: null };
  const secs = [...document.querySelectorAll('main [data-testid="custom-module-container"]')];
  for (const sec of secs) {
    // pierce shadow roots recursively
    function collect(root, acc) {
      for (const el of root.querySelectorAll("*")) {
        if (el.shadowRoot) { acc.shadowHosts.push(el.tagName.toLowerCase()); collect(el.shadowRoot, acc); }
        if (el.tagName === "IMG") acc.imgs.push({ src: el.currentSrc || el.src, srcset: el.srcset, w: el.naturalWidth, h: el.naturalHeight });
        if (el.tagName === "SOURCE") acc.sources.push({ srcset: el.srcset, media: el.media });
        const bg = getComputedStyle(el).backgroundImage;
        if (bg && bg !== "none" && bg.includes("url(")) acc.bgs.push(bg.slice(0, 250));
        if (el.tagName === "A") {
          const t = el.innerText?.trim();
          if (t) acc.links.push({ text: t.slice(0, 80), href: el.getAttribute("href") });
        }
        if (/^H[1-6]$/.test(el.tagName) || el.tagName === "P") {
          const t = el.textContent?.trim();
          if (t) acc.texts.push({ tag: el.tagName.toLowerCase(), text: t.slice(0, 100), fs: getComputedStyle(el).fontSize, ff: getComputedStyle(el).fontFamily.slice(0, 30), color: getComputedStyle(el).color, align: getComputedStyle(el).textAlign });
        }
      }
    }
    const acc = { shadowHosts: [], imgs: [], sources: [], bgs: [], links: [], texts: [], h: Math.round(sec.getBoundingClientRect().height), html0: sec.innerHTML.slice(0, 800) };
    collect(sec, acc);
    out.banners.push(acc);
  }
  // newsletter
  const hb = document.querySelector('[data-testid="help-bar"]');
  const parentChildren = hb ? [...hb.parentElement.children] : [];
  const idx = parentChildren.indexOf(hb);
  const nl = parentChildren[idx + 1] || null;
  // maybe newsletter is in a different ancestor: search for "Never miss a thing"
  const nlEl = [...document.querySelectorAll("section, div")].find((el) => el.children.length && el.innerText?.startsWith("Never miss a thing"));
  if (nlEl) {
    out.newsletter = window.__nlDump = (function walk(element, depth) {
      if (!element || element.nodeType !== 1 || depth > 5) return null;
      const cs = getComputedStyle(element);
      if (cs.display === "none") return null;
      const r = element.getBoundingClientRect();
      return {
        tag: element.tagName.toLowerCase(),
        type: element.getAttribute("type") || undefined,
        placeholder: element.getAttribute("placeholder") || undefined,
        rect: { w: Math.round(r.width), h: Math.round(r.height) },
        text: [...element.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(" ").slice(0, 120) || undefined,
        styles: {
          fontSize: cs.fontSize, fontFamily: cs.fontFamily.slice(0, 40), fontWeight: cs.fontWeight, color: cs.color,
          backgroundColor: cs.backgroundColor, border: cs.border, padding: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
          display: cs.display, gap: cs.gap, width: cs.width, height: cs.height, textDecoration: cs.textDecoration.slice(0, 40),
        },
        children: [...element.children].slice(0, 12).map((c) => walk(c, depth + 1)).filter(Boolean),
      };
    })(nlEl, 0);
  }
  return out;
});
fs.writeFileSync("docs/research/farfetch/split-banners-probe.json", JSON.stringify(result, null, 1));
console.log("PROBE_DONE banners=" + result.banners.map((b) => `imgs:${b.imgs.length},bgs:${b.bgs.length},shadow:${b.shadowHosts.length},texts:${b.texts.length}`).join(" | ") + " newsletter=" + !!result.newsletter);
