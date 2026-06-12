# HeroSection Specification

## Overview
- **Target file:** `src/components/HeroSection.tsx`
- **Screenshot:** `docs/design-references/farfetch-desktop-top-clean.png` (below header), `section-00.png`
- **Interaction model:** static (verified over 9s — no rotation, no dots)

## DOM Structure
`<div data-testid="hero-container">` 1392x1008 (inside 24px gutters) — two-column layout: text block left (centered content), image right.

## Computed Styles

### Section container
- width: 1392px; height: 1008px; background: white
- layout: 2 columns — text column occupies left half (text block measured x=72, w=588 → 48px inset from gutter), image column right 684px wide

### Image (right column)
- `<img>` 684x912; objectFit: cover; source 936x1248 (3:4)
- local asset: `/images/cms/2026-06-08-mw-webapp-nh-summer-events-vacation-multibrand-multicategory-img.jpeg`
- vertically centered in the 1008px section (912 + 48 padding top/bottom)

### Text column (left, 588px wide, vertically centered, textAlign center)
- Title "Whatever the occasion": fontSize 38px; lineHeight 48px; fontWeight 400; fontFamily Farfetch Basis (sans — NOT serif); color rgb(34,34,34); textAlign center
- Body: fontSize 20px; lineHeight 24px; fontWeight 400; color rgb(34,34,34); textAlign center; margin-top ~16px
- CTA "Shop Now": inline-flex centered; fontSize 15px; fontWeight 700; color rgb(34,34,34); backgroundColor rgb(255,255,255); border 1px solid rgb(34,34,34); padding 10px 16px; height 44px; min-width 44px; margin-top ~24px
- CTA hover: ff-transition utility (background-color/border-color/opacity/color 0.3s cubic-bezier(0,0,0,1)); hover state: backgroundColor rgb(34,34,34), color white

## Content (from `hero` in src/lib/content.ts)
- title: "Whatever the occasion"
- body: "For summer weddings, garden parties and everything in-between, decode the dress code with AMI Paris, Tom Ford and more"
- ctaLabel: "Shop Now"; ctaHref: "/sets/men/wedding-guest-mens.aspx"

## Responsive
- Desktop ≥1024: side-by-side (text left 50%, image right 684px), section ~1008px tall.
- Tablet 768: stacked — image full-width on top (3:4), text block below centered (section h≈1256).
- Mobile 390: same stacked layout (section h≈809); title stays 38px? Mobile screenshot shows title ~28px — use 28px <480px; body 15px; paddings 24px.
- Breakpoint: ~1024px to stack.

## Imports
- `hero` from `@/lib/content`; next/image or plain img (plain `<img>` acceptable for pixel parity)
