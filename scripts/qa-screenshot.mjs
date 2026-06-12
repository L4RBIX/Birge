// Screenshots the local clone for visual QA diff against docs/design-references/*.
// Usage: node scripts/qa-screenshot.mjs [port]  (server must already be running on that port)
import { chromium } from "playwright";
import fs from "node:fs";

const port = process.argv[2] || "3000";
const base = `http://localhost:${port}`;
fs.mkdirSync("docs/design-references/clone", { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });

for (const [label, width, height] of [["desktop", 1440, 900], ["mobile", 390, 844]]) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1500);

  // dismiss promo modal for clean shots
  try {
    const dismiss = page.locator('button:has-text("Dismiss")').first();
    if (await dismiss.isVisible({ timeout: 2000 })) {
      await dismiss.click();
      await page.waitForTimeout(400);
    }
  } catch {}

  // lazy-load everything
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 600));
  });

  await page.screenshot({ path: `docs/design-references/clone/clone-${label}-top.png` });
  await page.screenshot({ path: `docs/design-references/clone/clone-${label}-full.png`, fullPage: true });

  // per-section viewport shots at fixed scroll offsets matching original tops
  if (label === "desktop") {
    const offsets = [
      ["hero", 0],
      ["new-in", 1100],
      ["split-1", 1800],
      ["sale", 2650],
      ["trending", 3350],
      ["split-2", 4000],
      ["brands", 4900],
      ["help-newsletter", 5650],
      ["footer", 99999],
    ];
    for (const [name, y] of offsets) {
      await page.evaluate((yy) => window.scrollTo(0, Math.min(yy, document.body.scrollHeight)), y);
      await page.waitForTimeout(500);
      await page.screenshot({ path: `docs/design-references/clone/clone-sec-${name}.png` });
    }
  }
  await context.close();
}

await browser.close();
console.log("QA_SHOTS_DONE → docs/design-references/clone/");
