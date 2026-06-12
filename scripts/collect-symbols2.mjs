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
  for (let y = 0; y <= document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 200)); }
});
await page.waitForTimeout(2500);
// hover search + open menus to force-load remaining symbols
try { await page.locator('input[placeholder*="looking"]').first().click({ timeout: 2000 }); await page.waitForTimeout(1000); await page.keyboard.press("Escape"); } catch {}
const symbols = await page.evaluate(() => [...document.querySelectorAll("symbol")].map((s) => ({ id: s.id, html: s.outerHTML })));
fs.writeFileSync("docs/research/farfetch/svg-symbols-full.json", JSON.stringify(symbols, null, 1));
await browser.close();
console.log("SYMBOLS2_DONE " + symbols.length + " : " + symbols.map((s) => s.id).join(","));
