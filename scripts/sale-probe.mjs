import { chromium } from "playwright";
import fs from "node:fs";

const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--disable-blink-features=AutomationControlled"] });
for (let attempt = 0; attempt < 2; attempt++) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    locale: "en-US", timezoneId: "Asia/Almaty",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();
  await page.goto("https://www.farfetch.com/kz/shopping/men/items.aspx", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(7000);
  for (const sel of ['button[aria-label="Close"]', 'button:has-text("Dismiss")']) {
    try { const el = page.locator(sel).first(); if (await el.isVisible({ timeout: 1200 })) { await el.click(); await page.waitForTimeout(500); } } catch {}
  }
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 350) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 300)); }
  });
  await page.waitForTimeout(2000);
  const rails = await page.evaluate(async () => {
    const wrappers = [...document.querySelectorAll('[data-testid="custom-module-wrapper"]')].filter((w) =>
      [...w.querySelectorAll("a")].some((a) => /item-\d+/.test(a.getAttribute("href") || ""))
    );
    const out = [];
    for (const w of wrappers) {
      w.scrollIntoView({ block: "center" });
      await new Promise((r) => setTimeout(r, 1800));
      const heading = w.querySelector("h2, h3");
      const cta = [...w.querySelectorAll("a")].find((a) => /shop now/i.test(a.textContent || "") && !/item-\d+/.test(a.getAttribute("href") || ""));
      const cards = [...w.querySelectorAll("a")].filter((a) => /item-\d+/.test(a.getAttribute("href") || ""));
      out.push({
        heading: heading?.textContent?.trim(),
        ctaLabel: cta?.textContent?.trim(), ctaHref: cta?.getAttribute("href"),
        products: cards.map((a) => ({
          href: a.getAttribute("href"),
          aria: a.getAttribute("aria-label"),
          img: a.querySelector("img") ? { src: a.querySelector("img").currentSrc || a.querySelector("img").src } : null,
          texts: [...a.querySelectorAll("p")].map((p) => ({ t: p.textContent.trim(), fs: getComputedStyle(p).fontSize, fw: getComputedStyle(p).fontWeight, color: getComputedStyle(p).color, td: getComputedStyle(p).textDecoration.split(" ")[0] })),
          spans: [...a.querySelectorAll("span")].map((s) => ({ t: s.textContent.trim(), fs: getComputedStyle(s).fontSize, fw: getComputedStyle(s).fontWeight, color: getComputedStyle(s).color, td: getComputedStyle(s).textDecoration.split(" ")[0] })).filter((s) => s.t),
        })),
      });
    }
    return out;
  });
  await context.close();
  const sale = rails.find((r) => r.heading && !/New in/i.test(r.heading));
  if (sale && sale.products.length) {
    fs.writeFileSync("docs/research/farfetch/sale-rail-final.json", JSON.stringify({ attempt, allHeadings: rails.map((r) => r.heading), ...sale }, null, 1));
    console.log("SALE_FOUND attempt=" + attempt + " heading=" + sale.heading + " products=" + sale.products.length);
    break;
  }
  console.log("attempt " + attempt + " rails: " + rails.map((r) => r.heading).join(" | "));
}
await browser.close();
