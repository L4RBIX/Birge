import { chromium } from "playwright";
import fs from "node:fs";

const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--disable-blink-features=AutomationControlled"] });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 }, locale: "en-US", timezoneId: "Asia/Almaty",
  userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
});
const page = await context.newPage();
await page.goto("https://www.farfetch.com/kz/shopping/men/items.aspx", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(6000);
for (const sel of ['button[aria-label="Close"]', 'button:has-text("Dismiss")']) {
  try { const el = page.locator(sel).first(); if (await el.isVisible({ timeout: 1000 })) { await el.click(); await page.waitForTimeout(400); } } catch {}
}
await page.evaluate(async () => {
  for (let y = 0; y <= document.body.scrollHeight; y += 450) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 220)); }
});
await page.waitForTimeout(1800);

const out = await page.evaluate(() => {
  const pick = (el, props) => {
    if (!el) return null;
    const c = getComputedStyle(el);
    const o = {};
    props.forEach((p) => (o[p] = c[p]));
    const r = el.getBoundingClientRect();
    o._rect = `${Math.round(r.width)}x${Math.round(r.height)}`;
    return o;
  };
  const tp = ["fontSize","fontFamily","fontWeight","lineHeight","color","textDecoration","textTransform","letterSpacing","textAlign"];
  const bp = ["fontSize","fontWeight","color","backgroundColor","border","paddingTop","paddingRight","paddingBottom","paddingLeft","height","textDecoration"];
  const o = {};
  // newsletter
  const nlHeading = [...document.querySelectorAll("p, h2, h3")].find((el) => el.textContent.trim() === "Never miss a thing");
  o.nlHeading = pick(nlHeading, tp);
  const nlBody = [...document.querySelectorAll("p")].find((el) => el.textContent.startsWith("Sign up for promotions"));
  o.nlBody = pick(nlBody, tp);
  const updates = [...document.querySelectorAll("*")].find((el) => el.children.length === 0 && el.textContent.trim() === "Get updates by" || el.textContent.trim() === "GET UPDATES BY");
  o.nlUpdates = pick(updates, tp.concat(["textTransform"]));
  const emailLabel = [...document.querySelectorAll("label, span, p")].find((el) => el.textContent.trim() === "Email" && el.children.length === 0);
  o.nlEmailLabel = pick(emailLabel, tp);
  const input = [...document.querySelectorAll("input")].find((i) => /email/i.test(i.placeholder || "") || /email/i.test(i.getAttribute("aria-label") || "") || i.type === "email");
  o.nlInput = pick(input, bp.concat(["width"]));
  o.nlInputPlaceholder = input?.placeholder;
  const signup = [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "Sign Up");
  o.nlSignup = pick(signup, bp);
  const legal = [...document.querySelectorAll("p")].find((el) => el.textContent.startsWith("By signing up"));
  o.nlLegal = pick(legal, tp);
  // rail CTA
  const railCta = [...document.querySelectorAll('[data-testid="custom-module-wrapper"] a')].find((a) => a.textContent.trim() === "Shop Now");
  o.railCta = pick(railCta, bp);
  // trending caption
  const cap = [...document.querySelectorAll("a")].find((a) => /SPOTLIGHT ON|THE JACKET|AIRPORT|HOW TO STYLE/i.test(a.textContent) && a.querySelector("img"));
  const capText = cap ? [...cap.querySelectorAll("*")].find((el) => el.children.length === 0 && el.textContent.trim()) : null;
  o.trendingCaption = pick(capText, tp);
  // brands label
  const bl = [...document.querySelectorAll("a, p, h2, h3")].find((el) => el.textContent.trim() === "Lardini");
  o.brandsLabel = pick(bl, tp);
  // banner strip link
  const stripA = document.querySelector('[data-testid="globalPos"] li a');
  o.stripLink = pick(stripA, tp);
  // hero serif check secondary
  const heroTitle = document.querySelector('[data-testid="hero-container"] h1, [data-testid="hero-container"] h2, [data-testid="hero-container"] p');
  o.heroFirstText = heroTitle ? { text: heroTitle.textContent.trim().slice(0, 40), ...pick(heroTitle, tp) } : null;
  // help bar article border + bg
  const hbArticle = document.querySelector('[data-testid="help-bar"] article');
  o.helpArticle = pick(hbArticle, ["border","backgroundColor","height"]);
  // payment logo boxes
  const pay = document.querySelector('[data-component="PaymentBoxedLogo"]');
  o.payBox = pick(pay?.parentElement, ["width","height","border","padding"]);
  o.paySvg = pick(pay, ["width","height"]);
  // footer link
  const fl = [...document.querySelectorAll("footer a")].find((a) => a.textContent.trim() === "Contact us");
  o.footerLink = pick(fl, tp.concat(["paddingTop","paddingBottom","height"]));
  o.footerLinkLi = pick(fl?.closest("li"), ["paddingTop","paddingBottom","height","marginBottom"]);
  return o;
});
fs.writeFileSync("docs/research/farfetch/micro-probe.json", JSON.stringify(out, null, 1));
await browser.close();
console.log("MICRO_DONE");
