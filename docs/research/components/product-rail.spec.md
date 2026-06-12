# ProductRail + ProductCard Specification

## Overview
- **Target files:** `src/components/ProductRail.tsx`, `src/components/ProductCard.tsx`
- **Screenshots:** `docs/design-references/section-01.png` (New In), slices `slices/d1.png` (sale rail)
- **Interaction model:** static grid on desktop; horizontal swipe rail on mobile; wishlist heart click-toggle

## DOM Structure
```
<section> (data-testid product-list-container)
  <div> heading row: grid [1fr auto] gap 12px
    <h2> heading
    <a> Shop Now (CTA button)
  <div> cards grid: 4 columns
    <article> ProductCard x4
```

## Computed Styles

### Section wrapper
- width: 1392px (24px gutters); paddingTop: 48px; paddingBottom: 24px

### Heading row
- display: grid; gridTemplateColumns: 1fr auto; gap: 12px; alignItems: end
- h2: fontSize 22px; lineHeight 28px; fontWeight 400; color rgb(34,34,34); textAlign start
- CTA "Shop Now": fontSize 15px; fontWeight 700; color rgb(34,34,34); backgroundColor rgb(255,255,255); border 1px solid rgb(34,34,34); padding 4px 16px; height 32px; display flex; align center. Hover: bg #222, white text, ff-transition.

### Cards grid
- display: grid; gridTemplateColumns: repeat(4, 1fr) (4x 336px at 1440); gap: 36px 16px; marginTop: 24px (cards start 44px below heading row bottom)

### ProductCard (article, 336x557)
- position: relative; display: block
- image box: 336x448 (aspect 3:4); `<img>` objectFit cover; src = product.image (600w) with srcSet 480w/600w
- wishlist button: absolute top-0 right-0; 44x44; flex center; transparent bg; `HeartIcon` 24x24 color rgb(34,34,34). Click toggles to `HeartFillIcon` (visual only, local state).
- meta block (marginTop 6px, grid rows, width 336):
  - badge p: fontSize 13px; lineHeight ~17px; fontWeight 400; color rgb(114,114,114) when "New Season" / rgb(34,34,34) when "Special Offer"; (implement: gray for "New Season", #222 otherwise)
  - brand p: fontSize 15px; fontWeight 700; color rgb(34,34,34); marginTop 4px
  - description p: fontSize 13px; fontWeight 400; color rgb(34,34,34)
  - price row (margin-top 4px, inline, gap 4px):
    - priceOriginal (if present): 13px; color rgb(114,114,114); text-decoration line-through
    - priceIntermediate (if present): 13px; color rgb(231,29,52); line-through
    - priceFinal: 15px; fontWeight 700; color rgb(34,34,34)
  - discountLabel (if present, e.g. "-10% -20%"): own line below prices; 13px; first token color rgb(231,29,52), second rgb(34,34,34). Data provides space-separated tokens — render first red, rest #222. (When only "-20%": black.)
- whole card (image+meta) wrapped in `<a href={product.href}>`; brand hover: underline

## Props contract
```ts
import type { ProductRailContent, Product } from "@/types/farfetch";
export function ProductRail({ content }: { content: ProductRailContent }): JSX.Element
export function ProductCard({ product }: { product: Product }): JSX.Element  // named exports
```
Used with `newInRail` and `saleRail` from `@/lib/content`.

## Content (verbatim, in src/lib/content.ts)
- Rail 1 heading: "New in: handpicked daily from the world's best brands and boutiques"; CTA "Shop Now" → /sets/new-in-this-week-eu-men.aspx; products: Versace striped cotton-jersey T-shirt $847 / Givenchy tapered baggy jeans $1,323 / Kenzo logo-embroidered baseball cap $139 / NN07 Ben check-pattern shirt $214 — all badge "New Season".
- Rail 2 heading: "20% off sale items"; CTA "Shop Now" → /promotions/men/summer-promotion; products with full price ladders (see content.ts saleRail) — badge "Special Offer".

## Responsive
- ≥1024: 4-col grid as above.
- 768: 4 cols remain; gap 12px; cards ~213px (image 213x284).
- <480 (390): horizontal scroll rail: flex with overflow-x auto, `no-scrollbar` utility, scroll-snap-type x mandatory; card width 249px fixed (image 249x332), snap-align start; gap 12px; heading row stays.
- Wishlist button & meta identical at all sizes.
