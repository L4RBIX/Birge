# SiteHeader (+ MegaMenu) Specification

## Overview
- **Target files:** `src/components/SiteHeader.tsx`, `src/components/MegaMenu.tsx`
- **Screenshots:** `docs/design-references/header-at-top.png`, `header-scrolled.png`, `sec-mega-menu.png`, `section-footer.png` (top region shows header cleanly)
- **Interaction model:** hover-driven (mega menu), click (search focus styling only — full search overlay out of scope), sticky on scroll

## DOM Structure
```
<header> (sticky)
  row1: grid 3 cols [gender tabs | logo | icon cluster]
  row2: grid 2 cols [category nav | search field]
  row3: mega menu mount point (empty, 0px)
```

## Computed Styles

### header
- position: sticky; top: 0; zIndex: 200; height: 124px; backgroundColor: rgb(255,255,255)
- transition: transform 0.2s ease-in-out (no transform observed — plain sticky, do not implement hide-on-scroll)
- no border-bottom, no box-shadow (even when scrolled)
- inner container: width 1392px (24px page gutters each side)

### Row 1 (h=68)
- grid; gridTemplateColumns: 1fr 201px 1fr (measured 571.5px 201px 571.5px); gap 24px; alignItems center; content height 44px with marginTop 12px (total 68)

#### Gender tabs (left)
- ul flex, starts 12px left of gutter (links have own padding): li > a/button
- each tab: padding 10px 12px; fontSize 15px; height 44px; color rgb(34,34,34)
- Womenswear: fontWeight 400 | **Menswear (active): fontWeight 700** | Kidswear: 400
- hover: underline (textDecoration underline)

#### Logo (center)
- `FarfetchLogo` from `@/components/icons` (viewBox 0 0 340.19 42.24), rendered 201x25px, color #222, wrapped in `<a aria-label="FARFETCH homepage.">`

#### Icon cluster (right, flex justify-end, no gap — buttons adjacent)
- 4 items, each button/a 44x44 flex center, transparent bg, icon svg 24x24:
  1. `KzFlagIcon` (round flag badge 24px) — button aria-label "Language and region"
  2. `UserIcon` — button aria "Login page."
  3. `HeartIcon` — a aria "Wishlist 0 items."
  4. `BagIcon` — a aria "Bag 0 items."

### Row 2 (h=56, content 44px)
- grid; gridTemplateColumns: 1fr 270px (measured 1098px 270px); gap 24px; alignItems center

#### Category nav (left)
- `<nav aria-label="Navigation menu">` > ul display grid, gridAutoFlow column (10 items, auto widths); items start 12px left of gutter
- each link: fontSize 15px; fontWeight 400; padding 10px 12px (height 44px); color rgb(34,34,34)
- **"Sale" link color: rgb(231, 29, 52)** (highlight: true in content data)
- hover: textDecoration underline + opens mega menu

#### Search (right, 270px)
- container: grid "44px 1fr"; height 44px; borderBottom: 1px solid rgb(34,34,34)
- magnifier button 32x32 (icon 24px, color rgb(182,182,182)), centered in the 44px cell
- input: fontSize 15px; height 42px; no border; placeholder "What are you looking for?" color rgb(182,182,182); paddingRight 16px
- Out of scope: search suggestion panel. On focus just keep native input behavior.

## MegaMenu (per nav item, content from `navItems[].menu` in src/lib/content.ts)

### Panel
- position: absolute; top: 100% of header (panel top aligned to header bottom, y=124 when scrolled / below nav row); left 0; width 100vw; backgroundColor rgb(255,255,255); zIndex below header content but above page (panel z 200 within header stacking)
- height: auto (~493-526px); inner container 1392px w/ 24px gutters
- layout: grid; gridTemplateColumns: 920px 460px; gap: 24px 12px; paddingTop 24px; paddingBottom 24px
- link area (920px): grid; gridTemplateColumns: repeat(3, 1fr) (measured 298.66px x3); gap 36px 12px. Each menu has 1-4 columns — place columns sequentially; a column = heading + ul.
- column heading: fontSize 15px; fontWeight 700; height ~34px rows
- column links: fontSize 15px; fontWeight 400; color rgb(34,34,34); line rows 34px (padding 6-7px 0); hover underline
- spotlight (460px): article flex column gap 12px; paddingTop 24px; paddingBottom 16px; contains: "Spotlight on" mini-heading (15px 700), image 460x~307 (4:3, objectFit cover), label (15px uppercase), "Shop Now" underlined link (15px 700 underline)
- **Scrim:** fixed full-viewport rgba(34,34,34,0.4) behind the panel covering the page below header

### Behavior
- **Trigger:** mouseenter on nav link (~150ms delay acceptable), close on mouseleave of link+panel region; also close on Escape
- **Transition:** fast fade (opacity 0.15s ease). Panel and scrim fade together.
- Implementation: client component; track `openIndex` state on the nav ul (onMouseEnter per li, onMouseLeave on the shared wrapper).

## Sticky behavior
- At scroll 0 the banner strip (30px) sits above; header below it. On scroll the strip scrolls away and header sticks at top 0. Achieved naturally: strip is normal flow, header `sticky top-0`. No style changes on scroll.

## Responsive (clone targets desktop-first; mobile simplified)
- ≥1024px: as above.
- <1024px (tablet 768): single row 68px: hamburger button (use `Menu`-style 24px icon — three lines; build inline svg with 3 rects or use MagnifierIcon? NO — use a simple inline hamburger svg), magnifier icon button, centered logo (h 20px), HeartIcon, BagIcon. Gender tabs/nav/search hidden. Mega menu disabled.
- <480px (mobile 390): same single row at 44px height; logo ~140px wide.
- Hamburger opens nothing (out of scope) — it is visual only.

## Imports
- icons: `FarfetchLogo, KzFlagIcon, UserIcon, HeartIcon, BagIcon, MagnifierIcon` from `@/components/icons`
- content: `genderTabs, navItems` from `@/lib/content`
- types: `NavItem` from `@/types/farfetch`
- `cn` from `@/lib/utils`
