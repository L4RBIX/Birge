# BannerStrip Specification

## Overview
- **Target file:** `src/components/BannerStrip.tsx`
- **Screenshot:** `docs/design-references/sec-banner-strip.png`, top of `farfetch-desktop-top-clean.png`
- **Interaction model:** time-driven (crossfade rotation between 3 messages)

## DOM Structure
`<ul data-testid="globalPos">` full-width, 1440x30. Three `<li>` stacked in the SAME grid cell (display: grid; gridTemplateColumns: 1fr; all items at row 1 col 1). Each li contains a centered `<a>`.

## Computed Styles (getComputedStyle)

### ul container
- width: 100% (1440px); height: 30px; display: grid; gridTemplateColumns: 1fr (all li overlap in one cell)
- position: relative (scrolls away — NOT sticky); zIndex: 210

### li (each)
- backgroundColor: rgb(34, 34, 34); color: rgb(255, 255, 255)
- fontSize: 13px; lineHeight: 17px; fontWeight: 400
- padding: 6px 48px; textAlign: center
- gridArea: 1 / 1 (stacked); transition opacity (crossfade)

### a (message link)
- color: rgb(255, 255, 255); fontSize: 13px; lineHeight: 17px; textDecoration: underline; textAlign: center
- display: block; whole message is the link

## States & Behaviors

### Message rotation
- **Trigger:** time — cycles every ~5s through the 3 messages
- **State:** exactly one li at opacity 1, others opacity 0 (verified: opacities were 1 / 0 / 0)
- **Transition:** opacity crossfade ~0.5s ease
- **Implementation approach:** client component with `useState` index + `setInterval` 5000ms; all 3 li absolutely stacked via grid, `opacity` + `transition-opacity duration-500`. Alternatively pure CSS with the `ff-banner-fade` keyframes in globals.css (15s cycle, 5s per message, staggered `animation-delay`). Either is acceptable; CSS preferred (no JS timer).

## Content (verbatim, from src/lib/content.ts `bannerMessages`)
1. "Enjoy up to 60% off sale, plus 20% off" → /promotions/men/summer-promotion
2. "Download the app to get 10% off your first app order" → /promotion-terms-and-conditions/
3. "Shop the SS26 sale : up to 60% off" → /shopping/men/sale/all/items.aspx

## Responsive Behavior
- Identical at all widths (30px black strip, 13px centered white underlined text).
- Mobile: text may truncate with ellipsis (overflow hidden, white-space nowrap, text-overflow ellipsis).
