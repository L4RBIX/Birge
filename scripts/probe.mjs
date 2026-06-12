import { chromium } from "playwright";

const url = process.argv[2] ?? "https://www.farfetch.com/kz/shopping/men/items.aspx";
const headless = process.argv[3] !== "headed";

const browser = await chromium.launch({
  channel: "chrome",
  headless,
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

let status = null;
page.on("response", (res) => {
  if (res.url().split("?")[0] === url.split("?")[0]) status = res.status();
});

try {
  const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  status = resp?.status() ?? status;
  await page.waitForTimeout(8000);

  const info = await page.evaluate(() => ({
    title: document.title,
    bodyTextStart: document.body?.innerText?.slice(0, 300),
    productCardCount: document.querySelectorAll('[data-testid="productCard"], [data-component="ProductCard"], li[data-testid]').length,
    imgCount: document.querySelectorAll("img").length,
    hasNextData: Boolean(window.__NEXT_DATA__ || document.getElementById("__NEXT_DATA__")),
    url: location.href,
  }));

  await page.screenshot({ path: "docs/design-references/probe.png", fullPage: false });
  console.log(JSON.stringify({ status, ...info }, null, 2));
} catch (err) {
  console.error("PROBE_ERROR:", err.message);
  try {
    await page.screenshot({ path: "docs/design-references/probe-error.png" });
  } catch {}
} finally {
  await browser.close();
}
