import fs from "node:fs";
import path from "node:path";

const R = (p) => JSON.parse(fs.readFileSync(`docs/research/farfetch/${p}`, "utf8"));
const content = R("content-final.json");
const sale = R("sale-rail-final.json");
const megas = R("meganav.json");

const stripHost = (h) => (h || "#").replace(/^https?:\/\/www\.farfetch\.com/, "");
const localCms = (src) => "/images/cms/" + path.basename(new URL(src).pathname);
const localMeganav = (src) => "/images/meganav/" + path.basename(new URL(src).pathname);
const localProduct = (src) => "/images/products/" + path.basename(new URL(src).pathname);

// --- nav items with mega menus ---
const navOrder = ["Sale", "New in", "Vacation", "Brands", "Clothing", "Shoes", "Bags", "Accessories", "Watches", "Lifestyle"];
const navHrefs = Object.fromEntries(content.navItems.map((n) => [n.label, stripHost(n.href)]));

// spotlight labels parsed from each menu's fullText ("Spotlight on\n\nLABEL\n\nShop Now")
function spotlightLabel(m) {
  const t = m.fullText || "";
  const match = t.match(/Spotlight on\s*\n+\s*([^\n]+)\s*\n+\s*Shop Now/i);
  return match ? match[1].trim() : null;
}

const navItems = navOrder.map((label) => {
  const m = megas[label] || {};
  const menu = m.found
    ? {
        columns: (m.cols || [])
          .filter((c) => c.links?.length)
          .map((c) => ({
            heading: c.heading || "",
            links: c.links.map((l) => ({ label: l.text, href: stripHost(l.href) })),
          })),
        spotlight: m.tiles?.[0]?.src
          ? {
              label: spotlightLabel(m) || "",
              image: localMeganav(m.tiles[0].src),
              href: stripHost(m.tiles[0].href) || "#",
            }
          : undefined,
      }
    : undefined;
  return { label, href: navHrefs[label] || "#", highlight: label === "Sale", menu };
});

// --- product rails ---
function railFromContent(rail) {
  return {
    heading: rail.heading,
    ctaLabel: rail.ctaLabel || undefined,
    ctaHref: stripHost(rail.ctaHref) || undefined,
    products: rail.products.map((p) => {
      const texts = p.texts.map((t) => t.t);
      const id = (p.href.match(/item-(\d+)/) || [])[1] || "";
      const struck = p.texts.filter((t) => t.td === "line-through");
      const final = p.texts.find((t) => t.fw === "700" && t.t.startsWith("$"));
      const discounts = p.texts.filter((t) => /^-\d+%$/.test(t.t));
      const img600 = p.img?.src ? localProduct(p.img.src) : `/images/products/${id}_600.jpg`;
      return {
        id,
        badge: texts[0],
        brand: p.texts.find((t) => t.fw === "700" && !t.t.startsWith("$"))?.t || texts[1],
        description: texts[2],
        priceOriginal: struck[0]?.t,
        priceIntermediate: struck[1]?.t,
        priceFinal: final?.t || texts[texts.length - 1],
        discountLabel: discounts.map((d) => d.t).join(" ") || undefined,
        image: img600,
        image480: img600.replace("_600.jpg", "_480.jpg"),
        href: stripHost(p.href),
      };
    }),
  };
}

const newInRail = railFromContent(content.rails[0]);
newInRail.intro = undefined;
const saleRail = railFromContent({ heading: sale.heading, ctaLabel: sale.ctaLabel, ctaHref: sale.ctaHref, products: sale.products });

// --- assemble content.ts ---
const data = {
  bannerMessages: content.bannerStrip.map((b) => ({ text: b.text, href: stripHost(b.href) })),
  genderTabs: [
    { label: "Womenswear", href: "/kz/shopping/women/items.aspx", active: false },
    { label: "Menswear", href: "/kz/shopping/men/items.aspx", active: true },
    { label: "Kidswear", href: "/kz/shopping/kids/items.aspx", active: false },
  ],
  navItems,
  hero: {
    title: content.hero.title,
    body: content.hero.body,
    ctaLabel: content.hero.ctaLabel,
    ctaHref: stripHost(content.hero.ctaHref),
    image: localCms(content.hero.img.src),
  },
  newInRail,
  saleRail,
  splitBanner1: {
    tiles: [
      { title: "Brunello Cucinelli", href: "/kz/shopping/men/brunello-cucinelli/items.aspx", image: "/images/ads/ad-slot-0.png", variant: "overlay" },
      { title: "Dolce&Gabbana", href: "/kz/shopping/men/dolce-gabbana/items.aspx", image: "/images/ads/ad-slot-1.png", variant: "overlay" },
    ],
  },
  splitBanner2: {
    tiles: [
      { title: "Ralph Lauren Purple Label", href: "/kz/shopping/men/ralph-lauren-purple-label/items.aspx", image: "/images/ads/ad-slot-2.png", variant: "overlay" },
      { title: "Jimmy Choo", href: "/kz/shopping/men/jimmy-choo/items.aspx", image: "/images/ads/ad-slot-3.png", variant: "overlay" },
    ],
  },
  trending: {
    heading: content.trending.heading,
    tiles: content.trending.tiles.map((t) => ({
      title: t.label,
      href: stripHost(t.href),
      image: t.img ? localCms(t.img) : "",
      variant: "caption",
    })),
  },
  brands: {
    heading: "Brands of the moment",
    tiles: [
      { title: "Lardini", href: "/kz/shopping/men/lardini/items.aspx", image: "/images/cms/2026-06-01-mw-webapp-lardini-vacation-lardini-multicategory-img.jpeg", variant: "overlay" },
      { title: "Boggi Milano", href: "/kz/shopping/men/designer-boggi-milano/items.aspx", image: "/images/cms/2026-06-01-mw-webapp-boggi-milano-vacation-boggi-milano-multicategory-img.jpeg", variant: "overlay" },
      { title: "Manière De Voir", href: "/kz/shopping/men/designer-maniere-de-voir/items.aspx", image: "/images/cms/2026-06-01-mw-webapp-maniere-de-voir-vacation-maniere-de-voir-multicategory-img.jpeg", variant: "overlay" },
    ],
  },
  helpBar: [
    { icon: "hanger", title: "HOW TO SHOP", body: "Your guide to shopping and placing orders", href: "/kz/how-to-shop" },
    { icon: "question", title: "FAQS", body: "Your questions answered", href: "/kz/faqs" },
    { icon: "bubble", title: "NEED HELP?", body: "Contact our global Customer Service team", href: "/kz/contact-us" },
  ],
  newsletter: {
    heading: "Never miss a thing",
    body: "Sign up for promotions, tailored new arrivals, stock updates and more – straight to your inbox",
    updatesLabel: "GET UPDATES BY",
    methodLabel: "Email",
    placeholder: "Your email address",
    buttonLabel: "Sign Up",
    legal: "By signing up, you consent to receiving marketing by email and/or SMS and acknowledge you have read our Privacy Policy. Unsubscribe anytime at the bottom of our emails or by replying STOP to any of our SMS.",
    privacyHref: "/kz/privacy-policy/",
  },
  footer: {
    paymentHeading: "Payment methods",
    columns: [
      {
        heading: "Customer Service",
        links: [
          { label: "Contact us", href: "/kz/contact-us/" },
          { label: "FAQs", href: "/kz/faqs/" },
          { label: "Orders and delivery", href: "/kz/orders-and-shipping/" },
          { label: "Returns and refunds", href: "/kz/returns-and-refunds/" },
          { label: "Payment and pricing", href: "/kz/payment-and-pricing/" },
          { label: "Cryptocurrency payments", href: "/kz/cryptocurrency-payment" },
          { label: "Promotion terms and conditions", href: "/kz/promotion-terms-and-conditions" },
          { label: "How to shop", href: "/kz/how-to-shop" },
          { label: "FARFETCH Customer Promise", href: "/kz/customer-promise/" },
        ],
      },
      {
        heading: "About FARFETCH",
        links: [
          { label: "About us", href: "https://aboutfarfetch.com/" },
          { label: "FARFETCH partner boutiques", href: "/kz/boutiques" },
          { label: "Careers", href: "https://aboutfarfetch.com/careers/our-approach-to-hiring/" },
          { label: "FARFETCH app", href: "/kz/discover-app/" },
          { label: "Modern slavery statement", href: "/kz/modern-slavery-statement/" },
          { label: "FARFETCH Advertising", href: "https://advertising.farfetch.com/#hero" },
          { label: "Sitemap", href: "/kz/stories/all-brands-on-sale" },
        ],
      },
      {
        heading: "Discounts and membership",
        links: [
          { label: "Affiliate program", href: "/kz/pag1987.aspx" },
          { label: "Refer a friend", href: "/kz/refer-a-friend?situation=homepage_footer" },
          { label: "FARFETCH membership", href: "/kz/farfetch-access-programme" },
          { label: "Student Beans and Graduates", href: "/kz/student-discount/student-beans" },
        ],
      },
      {
        heading: "Content and services",
        links: [{ label: "Fashion Feed: the latest style stories", href: "/kz/stories/fashion-feed" }],
      },
    ],
    followHeading: "Follow us",
    social: [
      { label: "instagram", href: "https://instagram.com/farfetch" },
      { label: "tikTok", href: "https://www.tiktok.com/@farfetch" },
      { label: "facebook", href: "https://www.facebook.com/Farfetch/" },
      { label: "youtube", href: "https://www.youtube.com/user/farfetchdotcom" },
    ],
    legalLinks: [
      { label: "Privacy policy", href: "/kz/privacy-policy/" },
      { label: "Terms and conditions", href: "/kz/terms-and-conditions/" },
      { label: "Accessibility", href: "/kz/farfetch-accessibility/" },
    ],
    trademark: "'FARFETCH' and the 'FARFETCH' logo are trade marks of FARFETCH UK Limited and are registered in numerous jurisdictions around the world.",
    copyright: "© Copyright 2026 FARFETCH UK Limited. All rights reserved.",
  },
  promoModal: {
    title: "Enjoy 20% off on sale items",
    body: "For a limited time: enjoy up to 60% off, plus 20% off selected styles",
    image: "/images/products/CI_d0c99a14-b59b-4326-b109-75779df4cda3_600.jpg",
    dismissLabel: "Dismiss",
    ctaLabel: "Shop now",
    ctaHref: "/kz/shopping/men/sale/all/items.aspx",
  },
};

const ts = `// Real content extracted from farfetch.com/kz/shopping/men/items.aspx (2026-06-11)
// Generated by scripts/gen-content.mjs — regenerate rather than hand-editing bulk data.
import type {
  HeroContent,
  ProductRailContent,
  SplitBannerContent,
  TrendingContent,
  BrandsMomentContent,
  NavItem,
  FooterColumn,
  HelpBarItem,
} from "@/types/farfetch";

export const bannerMessages: { text: string; href: string }[] = ${JSON.stringify(data.bannerMessages, null, 2)};

export const genderTabs: { label: string; href: string; active: boolean }[] = ${JSON.stringify(data.genderTabs, null, 2)};

export const navItems: NavItem[] = ${JSON.stringify(data.navItems, null, 2)};

export const hero: HeroContent = ${JSON.stringify(data.hero, null, 2)};

export const newInRail: ProductRailContent = ${JSON.stringify(data.newInRail, null, 2)};

export const saleRail: ProductRailContent = ${JSON.stringify(data.saleRail, null, 2)};

export const splitBanner1: SplitBannerContent = ${JSON.stringify(data.splitBanner1, null, 2)} as SplitBannerContent;

export const splitBanner2: SplitBannerContent = ${JSON.stringify(data.splitBanner2, null, 2)} as SplitBannerContent;

export const trending: TrendingContent = ${JSON.stringify(data.trending, null, 2)} as TrendingContent;

export const brands: BrandsMomentContent = ${JSON.stringify(data.brands, null, 2)} as BrandsMomentContent;

export const helpBar: HelpBarItem[] = ${JSON.stringify(data.helpBar, null, 2)};

export const newsletter = ${JSON.stringify(data.newsletter, null, 2)};

export const footer: {
  paymentHeading: string;
  columns: FooterColumn[];
  followHeading: string;
  social: { label: string; href: string }[];
  legalLinks: { label: string; href: string }[];
  trademark: string;
  copyright: string;
} = ${JSON.stringify(data.footer, null, 2)};

export const promoModal = ${JSON.stringify(data.promoModal, null, 2)};
`;

fs.mkdirSync("src/lib", { recursive: true });
fs.writeFileSync("src/lib/content.ts", ts);
console.log("CONTENT_TS_DONE navItems=" + navItems.length + " newIn=" + newInRail.products.length + " sale=" + saleRail.products.length);
