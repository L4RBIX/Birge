# Page Topology — farfetch.com/kz/shopping/men/items.aspx

Target resolves to the **Menswear landing page** (editorial modules), not a raw product grid.
Desktop page height ≈ 6679px @1440. Mobile ≈ 6604px @390. Tablet ≈ 7593px @768.

## Vertical section order (desktop 1440)

| # | Section | data-testid | y / height | Interaction model |
|---|---------|-------------|------------|-------------------|
| 0 | Global banner strip | `globalPos` (ul) | 0 / 30px | static (3 messages side-by-side, no rotation) |
| 1 | Header (2 rows) | `header` | sticky top:0 / 124px | hover (mega menu), click (search overlay) |
| 2 | Hero | `hero-container` | 154 / 1008px | static (text left, image right; Shop Now button) |
| 3 | New In product row | `custom-module-wrapper` | 1162 / 673px | static 4-card grid; wishlist hover; mobile: swipe carousel |
| 4 | Split banner 1 (Jimmy Choo / Dolce&Gabbana) | `custom-module-container` | 1835 / 892px | static; hover on Shop Now link |
| 5 | Sale product row ("20% off sale items") | `custom-module-wrapper` | 2727 / 690px | static 4-card grid + Shop Now button top-right |
| 6 | Trending Now (4 tiles) | `custom-module-container` | 3417 / 656px | static; hover |
| 7 | Split banner 2 (Polo Ralph Lauren / Brunello Cucinelli) | `custom-module-container` | 4072 / 892px | static |
| 8 | Brands of the Moment (3 tiles) | `custom-module-wrapper` | 4964 / 723px | static; tablet/mobile: carousel "1 of 3" |
| 9 | Help bar (3 bordered boxes) | `help-bar` | 5741 / 110px | hover |
| 10 | Newsletter ("Never miss a thing") | — | ~5851 | form (email + Sign Up) |
| 11 | Footer | `footer` | → end | hover underline links |

## Layout architecture
- Single scroll container (body), native scrolling. **No smooth-scroll library.**
- Content max width: full-bleed 1440 with 24px page gutters (product imgs start x=24-ish; cards at x≈316/668/1020/1372 → 4-col grid, col ≈ 332px, gap ≈ 20px, gutter 20px).
- Sticky elements: `header` only (position: sticky; top: 0; z-index: 200). Banner strip above it scrolls away (z-index 210, static).
- Z-layers: banner 210, header 200, mega-menu panel inside header area (drops below nav, white bg, full-width), modal overlay (promo) on load.
- Footer: "Payment methods" white block → gray (#f5f5f5-ish) 4-column link block → gray legal bar → thin black bottom strip.

## Framework notes (original)
- React SPA (no `__NEXT_DATA__`), emotion-style hashed classes (`ltr-*`, `_bd92a3`).
- Fonts: **Farfetch Basis** (400/700, woff2 self-hosted) body/UI; **Nimbus Roman D** (400, serif) display headings (hero, banner titles, "Never miss a thing").
- Body: 15px / 20px line-height / rgb(34,34,34) on white.

## Responsive breakpoints (observed)
- Desktop ≥ ~1024: full header (banner strip + 2 header rows), 4-col grids.
- Tablet ~768: header → single 68px row (hamburger + search icon + centered logo + wishlist + bag). Product rows still 4-up (cards ~213px). Split banners stack vertically (h 1237). Trending tiles 2x2 (h 1200). Brands → carousel.
- Mobile ~390: header 44px. Product rows → horizontal swipe carousel (card ~249px wide, "1 of 4" indicator). Trending tiles → horizontal scroll (h 491). Split banners stacked (h 941). Brands → carousel (h 410).

## Clone scope mapping (Next.js components)
- `BannerStrip` → section 0
- `SiteHeader` (incl. `MegaMenu`, `SearchOverlay` trigger) → section 1
- `HeroSection` → 2
- `ProductRail` (reused for 3 & 5, prop-driven) + `ProductCard`
- `SplitBanner` (reused for 4 & 7, prop-driven)
- `TrendingTiles` → 6
- `BrandsMoment` → 8
- `HelpBar` → 9
- `NewsletterSection` → 10
- `SiteFooter` → 11
