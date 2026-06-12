# Tile Sections Specification (SplitBanner, TrendingTiles, BrandsMoment)

Three sibling sections sharing the `PromoTile` type. All sit inside the 1392px content width (24px page gutters).

## 1. SplitBanner
- **Target file:** `src/components/SplitBanner.tsx`
- **Screenshots:** `docs/design-references/section-02.png`, `section-05.png`; tile assets are pre-captured full creatives at `public/images/ads/ad-slot-{0..3}.png` (text is baked into the images)
- **Interaction model:** static; hover = slight opacity on link

### Computed Styles
- section: width 1392; paddingTop 48px; paddingBottom 24px; display flex
- two tiles: each 684x796; gap 24px (x positions 24 and 732); marginBottom 24px
- tile = `<a>` wrapping `<img>` 684x796 objectFit cover (the creative already contains brand title + "Shop Now" text)
- hover: none observed (ad iframes) — keep cursor-pointer only

### Props contract
```ts
import type { SplitBannerContent } from "@/types/farfetch";
export function SplitBanner({ content }: { content: SplitBannerContent }): JSX.Element
```
Used with `splitBanner1` and `splitBanner2` from `@/lib/content` (tiles[].image / href / title — title used as img alt).

### Responsive
- ≥1024: side-by-side 2-up.
- <1024: stacked full-width (tablet h≈1237 total, mobile h≈941), each tile keeps 684:796 aspect ratio via aspect-[684/796], width 100%.

## 2. TrendingTiles
- **Target file:** `src/components/TrendingTiles.tsx`
- **Screenshot:** `docs/design-references/section-04.png` (and slices/d3.png)
- **Interaction model:** static; caption underlines on hover

### Computed Styles
- section: width 1392
- heading "Trending now": h2 fontSize 22px; lineHeight 28px; fontWeight 400; textAlign center; marginTop 48px (heading block h=76)
- tiles row: paddingTop 48px; paddingBottom 24px; display flex (effectively 4-col grid); article 330x484; column gap 24px (x: 24, 378, 732, 1086); article marginBottom 24px
- tile image: 330x440 (aspect 3:4) objectFit cover
- caption: marginTop 24px; fontSize 15px; lineHeight 20px; fontWeight 400; textTransform uppercase; color rgb(34,34,34); textAlign left; textDecoration none; hover → underline

### Props contract
```ts
import type { TrendingContent } from "@/types/farfetch";
export function TrendingTiles({ content }: { content: TrendingContent }): JSX.Element
```
Used with `trending` from `@/lib/content` (4 tiles: SPOTLIGHT ON CASABLANCA / THE JACKET UPDATE / AIRPORT STAPLES / HOW TO STYLE SHORTS).

### Responsive
- ≥1024: 4-up grid.
- 768: 2x2 grid (gap 24).
- <480: horizontal swipe rail (overflow-x auto, no-scrollbar, snap-x mandatory, tile w 280px, image 280x373).

## 3. BrandsMoment
- **Target file:** `src/components/BrandsMoment.tsx`
- **Screenshot:** `docs/design-references/section-06.png`
- **Interaction model:** static on desktop; swipe carousel on tablet/mobile

### Computed Styles
- section: width 1392; paddingTop 48px; paddingBottom 24px
- inner: flex column; gap 36px
- heading "Brands of the moment": p/h2 fontSize 22px; lineHeight 28px; fontWeight 400; textAlign LEFT (start)
- tiles row: display flex; gap 36px; three articles 440x587 (aspect 3:4); position relative
- tile image: `<picture>/<img>` absolute inset-0, 440x587 objectFit cover
- label overlay: absolute bottom-0 left-0; width 100%; padding 24px; flex column gap 8px; label text fontSize 30px; lineHeight 38px; fontWeight 400; color rgb(255,255,255); textAlign left (no gradient scrim — text sits directly on image)
- hover: label underline

### Props contract
```ts
import type { BrandsMomentContent } from "@/types/farfetch";
export function BrandsMoment({ content }: { content: BrandsMomentContent }): JSX.Element
```
Used with `brands` from `@/lib/content` (Lardini / Boggi Milano / Manière De Voir).

### Responsive
- ≥1024: 3-up flex.
- <1024: horizontal swipe rail (overflow-x auto, no-scrollbar, snap-x), tile w ~min(85vw, 440px), keeps 3:4; "1 of 3" indicator omitted (out of scope).

## Imports (all three)
- types from `@/types/farfetch`; `cn` from `@/lib/utils`; plain `<img>` elements.
