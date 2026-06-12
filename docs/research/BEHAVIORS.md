# Behaviors — Farfetch Menswear Landing

All values from getComputedStyle / live probing at 1440x900 (Chrome headless), 2026-06-11.

## Scroll behaviors
- **Header**: `position: sticky; top: 0; z-index: 200; height: 124px; background: #fff`. Has `transition: transform 0.2s ease-in-out` but NO transform/hide observed on wheel scroll down/up at desktop, tablet or mobile. No shadow or border change after scrolling. → Implement plain sticky header.
- **Banner strip** (`globalPos`): static, scrolls away. h=30px, z-index 210.
- No scroll-snap anywhere. No IntersectionObserver entrance animations observed (sections render statically). No parallax. No smooth-scroll library (native scroll; no `.lenis` / locomotive classes).

## Time-driven
- None. Banner strip shows all 3 messages simultaneously (checked over 6s — no rotation). Hero static (checked over 9s — no change). No autoplaying carousels on desktop.

## Click-driven
- **Search**: clicking the search input (placeholder "What are you looking for?") opens a white panel below the header (recent searches/suggestions). Esc closes. Clone scope: open/close a simple suggestions panel ("Recently viewed" placeholder is acceptable since content is session-generated).
- **Wishlist heart** on product cards (44x44 button, top-right of image): toggles wishlist (requires auth on original). Clone: visual toggle filled/outline.
- **Promo modal on load**: "Enjoy 20% off on sale items" centered modal with image, -20% headline, Dismiss / Shop now buttons + X close. Shown once on first visit. Clone: show on load, dismissible (sessionStorage flag).
- Mobile: product rails + brands tiles become horizontal swipe carousels with "N of M" indicators.

## Hover-driven (desktop)
- **Nav items** (Sale, New in, … Lifestyle): hovering opens a **mega menu** white panel directly under the nav row, full-width, h≈526px: 2 link columns (col 1 = category list e.g. CLOTHING: All clothing, T-shirts & vests, Jackets, …; col 2 = DISCOVER list) + right "Spotlight on" image tile with label + Shop Now. Opens on hover after short delay (~100-200ms), closes when pointer leaves.
- **Nav link hover**: underline appears on hovered nav item.
- **Product card**: NO image swap on hover (single img per card). Brand name is bold; hovering shows wishlist heart already visible; card itself has no transform/shadow.
- **Tiles / split banners / footer links**: "Shop Now" links are underlined; tile labels underline on hover. Footer links underline on hover.
- **Buttons**: black bg (#222) buttons (Shop Now, Sign Up) — hover darkens/inverts slightly; transition `background-color 0.3s cubic-bezier(0, 0, 0, 1), border-color …, opacity …, color …` (Farfetch global button transition).

## Header structure details
- Above header: skip links (visually hidden until focus), banner strip ul (3 li).
- Header row 1 (h=68): gender tabs left (Womenswear / Menswear / Kidswear — active "Menswear" bold with underline state), FARFETCH wordmark logo centered (SVG), right icon cluster: region flag badge (circle, 24px), account, heart, bag (SVG icons ~24px, spacing ~16-24px).
- Header row 2 (h=56): nav links left ("Sale" red rgb(212,0,0)-ish, rest #222), search field right (~290px wide: magnifier icon + placeholder + 1px bottom underline #222).
- Tablet/mobile: single row — hamburger, search icon, logo (centered), wishlist, bag. Height 68px (768) / 44px (390).

## Forms
- Newsletter: label "GET UPDATES BY" + "Email" radio? (text), input "Your email address" (1px #999 border, h≈44), black Sign Up button (h≈44, px≈24), legal copy with underlined Privacy Policy link.

## Transitions catalog
- Buttons/links: `background-color 0.3s cubic-bezier(0, 0, 0, 1), border-color 0.3s …, opacity 0.3s …, color 0.3s …`
- Header: `transform 0.2s ease-in-out` (unused in practice).
- Mega menu: appears/disappears (fast fade ~0.2s; treat as opacity 0.15s ease + visibility).
