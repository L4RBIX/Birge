# PromoModal Specification

## Overview
- **Target file:** `src/components/PromoModal.tsx`
- **Screenshot:** `docs/design-references/sec-promo-modal.png` (modal over page on load)
- **Interaction model:** shown on first load, click-driven dismiss

## DOM Structure
Fixed overlay scrim + centered white dialog: image on top, title, body, two buttons, X close.

## Computed Styles

### Overlay
- position: fixed; inset 0; backgroundColor rgba(34,34,34,0.4); zIndex 500; flex center

### Dialog
- width: 400px (max-w-[400px] w-[calc(100vw-48px)]); backgroundColor rgb(255,255,255); no border-radius (Farfetch is square)
- close button: absolute top-0 right-0; 44x44; `CrossIcon` 24px; color rgb(34,34,34)

### Content
- image: full dialog width, source 600x240 → rendered 400x160; objectFit cover; asset `/images/products/CI_d0c99a14-b59b-4326-b109-75779df4cda3_600.jpg`
- inner padding: 24px; textAlign center
- title "Enjoy 20% off on sale items": fontSize 22px; lineHeight 28px; fontWeight 400; color rgb(34,34,34)
- body: fontSize 15px; lineHeight 20px; color rgb(34,34,34); marginTop 8px
- buttons row (marginTop 24px; flex gap 12px; each flex-1 h-44):
  - "Dismiss": white bg; border 1px solid rgb(34,34,34); color #222; 15px/700
  - "Shop now": bg rgb(34,34,34); color white; 15px/700; links to /shopping/men/sale/all/items.aspx
- both: ff-transition hover (invert)

## Behavior
- Client component. Show ~800ms after mount on first visit only: `sessionStorage.getItem("ff-promo-seen")`; set flag on dismiss/close/CTA.
- Close on: X, Dismiss, scrim click, Escape.
- Fade-in: opacity transition 0.2s.

## Content (from `promoModal` in src/lib/content.ts)
title / body / image / dismissLabel / ctaLabel / ctaHref — verbatim.

## Responsive
- <480px: dialog width calc(100vw - 32px); image height scales (aspect 600/240).
