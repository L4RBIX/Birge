# QA Findings — Farfetch Menswear Clone

**Verified:** 2026-06-11 against `http://localhost:3100` (production build), 1440px desktop + 390px mobile.
**Method:** visual diff (reference vs clone screenshots), Playwright interaction tests (system Chrome), computed-style audit, code review against `docs/research/components/*.spec.md`.

**Headline:** The clone is in strong shape. The reported KNOWN SUSPECT #1 (missing banner strip) is **REFUTED** — the strip renders and rotates correctly in the live app. The one genuine P0 is a mega-menu that **cannot be closed by the mouse**. Everything else is P1/P2 spacing/responsive polish.

---

## P0 — Broken / missing (renders or behaves wrong at a glance)

### P0-1 — Mega menu never closes on mouse-leave (only Escape closes it)
- **File:** `src/components/MegaMenu.tsx` (scrim) + `src/components/SiteHeader.tsx` (`onMouseLeave`)
- **What's wrong:** The scrim `<div className="fixed inset-0 ... z-[150] ... pointer-events-auto">` is rendered *inside* `<header>` (via the `MegaMenu` mount) and covers the whole viewport while open. Because the scrim is a descendant of `<header>`, the pointer never leaves the header's subtree, so `header`'s `onMouseLeave={handleHeaderMouseLeave}` never fires. **Verified with Playwright:** after hovering "Clothing", moving the cursor anywhere (incl. y=950, far below the 690px panel bottom, and the far corner) leaves `aria-hidden="false"` — the panel stays open indefinitely. Re-hovering another nav link is also blocked: Playwright reports the scrim "intercepts pointer events". Spec requires "close on mouseleave of link+panel region" (`site-header.spec.md` §Behavior).
- **Expected:** Mega menu closes when the cursor leaves the nav-link + panel region (source: `site-header.spec.md` lines 70-73).
- **Suggested fix:** Add a close handler to the scrim itself, e.g. `onMouseEnter={() => onClose?.()}` on the scrim div in `MegaMenu.tsx` (pass a close callback down), OR move the scrim out of `<header>` so leaving the header to the scrim triggers `onMouseLeave`, OR set the scrim to `pointer-events-none` and drive close from `onMouseLeave` on the nav `<ul>` + panel wrapper. Simplest: give the scrim `onMouseEnter={() => setOpenIndex(null)}` (lift via prop). Keep Escape handler as-is.

---

## P1 — Noticeable deviation (visible spacing / size / layout off)

### P1-1 — Mega menu link columns spread too wide for 2-column menus
- **File:** `src/components/MegaMenu.tsx` line 43
- **What's wrong:** `gridTemplateColumns: repeat(${Math.min(menu.columns.length, 3)}, 1fr)`. For 2-column menus (Sale, New in has 3, Clothing/Shoes/Bags/Accessories have 2-3), a 2-column menu becomes `repeat(2, 1fr)` → each column 460px wide, so "Discover" starts ~515px from the left instead of ~313px. Visible mismatch vs `sec-mega-menu.png`, where the two columns stay at ~298px tracks and the third track is left empty.
- **Expected:** Link area is a fixed 3-track grid (`repeat(3, 1fr)`, each ~298px), columns placed sequentially regardless of count (source: `site-header.spec.md` line 64: "gridTemplateColumns: repeat(3, 1fr) (measured 298.66px x3)").
- **Suggested fix:** Change to a constant `gridTemplateColumns: "repeat(3, 1fr)"` (drop the `Math.min(columns.length,3)`). Columns flow into the first N tracks automatically.

### P1-2 — Mobile header row is 68px tall; spec wants 44px at ≤480px
- **File:** `src/components/SiteHeader.tsx` line 172 (`style={{ height: "68px" }}` on the `flex lg:hidden` row)
- **What's wrong:** The mobile single-row header is hardcoded to 68px at all widths below `lg`. **Verified:** at 390px the mobile row measures 68px. Compared to `farfetch-mobile-top.png`, the original mobile header is a compact ~44px row, making the clone's header noticeably taller and the logo larger.
- **Expected:** ≥768 tablet single row 68px; **<480px mobile single row 44px**, logo ~140px wide (source: `site-header.spec.md` lines 80-82; `PAGE_TOPOLOGY.md` line 38: "Mobile ~390: header 44px").
- **Suggested fix:** Make the height responsive, e.g. replace the inline `height: "68px"` with classes `h-[68px] max-[479px]:h-[44px]` (and ensure the centered logo already shrinks to 140px via the existing `max-[479px]:w-[140px]`).

---

## P2 — Polish nits / behavior subtleties

### P2-1 — Banner strip has a ~50ms full-blackout gap at each crossfade
- **File:** `src/app/globals.css` lines 163-178 (`@keyframes ff-banner-fade`) + `src/components/BannerStrip.tsx` lines 18-20
- **What's wrong:** With `animation-fill-mode: none` (default) and `animationDelay: i*5s`, message *i* drops to opacity 0 at 33% of its 15s cycle (4.95s) while message *i+1* doesn't begin its 0%→opacity-1 keyframe until exactly its 5s delay. In the ~50ms gap (4.95-5.0s, 9.95-10.0s, 14.25-15.0s) all three `<li>` are at opacity 0 → the strip momentarily goes empty (just the black bar). This is almost certainly why the provided `clone-desktop-top.png` looked "missing" — it caught a blackout frame. **Live behavior is otherwise correct:** at t=0 message 1 shows; it rotates 1→2→3 over ~15s (verified opacities `1/0/0` → `0/1/0`).
- **Expected:** Continuous crossfade, never fully empty (source: `banner-strip.spec.md` line 31 "exactly one li at opacity 1"). NOTE: `PAGE_TOPOLOGY.md` line 10 contradicts the component spec, calling the strip "static (no rotation)"; treat `banner-strip.spec.md` as source of truth (rotation is acceptable). Not a blocker either way.
- **Suggested fix:** Overlap the keyframe windows so the incoming message is already at opacity 1 before the outgoing one fades (e.g. widen the visible window / add `animation-fill-mode: both`), or switch to the JS `setInterval` + `transition-opacity` approach the spec lists as the alternative. Lowest-risk: add `animationFillMode: "both"` to the inline style so each li holds opacity 1 from its 100% keyframe through the next cycle start.

### P2-2 — Promo modal layout differs from the newer reference screenshot (matches spec, not screenshot)
- **File:** `src/components/PromoModal.tsx`
- **What's wrong:** `sec-promo-modal.png` shows the current site design: image as a left/side panel with a "-20%" overlay, X in the corner. The clone renders image **full-width on top**, then title/body/buttons. **This matches `promo-modal.spec.md` exactly** (image on top, 400px dialog, Dismiss + Shop now), so it is spec-correct — flagging only because it diverges from the newest live screenshot. **Behavior verified:** appears at ~880ms, image + title "Enjoy 20% off on sale items" + Dismiss/Shop now, Escape/Dismiss close it, does not reappear in the same session (sessionStorage gate works).
- **Expected:** Per spec — no change required. Only revisit if pixel-matching the newest creative is in scope.
- **Suggested fix:** None needed (spec-compliant). Optional: restructure to side-image layout if matching `sec-promo-modal.png` is desired.

### P2-3 — Split-banner brand pairing in content data differs from topology doc
- **File:** `src/lib/content.ts` (`splitBanner1`, `splitBanner2`) — title fields only
- **What's wrong:** `PAGE_TOPOLOGY.md` lists banner 1 = "Jimmy Choo / Dolce&Gabbana" and banner 2 = "Polo Ralph Lauren / Brunello Cucinelli". Content data has banner 1 = "Brunello Cucinelli / Dolce&Gabbana", banner 2 = "Ralph Lauren Purple Label / Jimmy Choo". Since the brand text is **baked into `ad-slot-{0..3}.png`** (per `tile-sections.spec.md` line 7), the displayed brand is whatever the PNG shows; the `title` is used only as `alt`. Visual correctness depends on the asset, not this string. Cosmetic/accessibility only.
- **Expected:** `alt` text should match the brand shown in each `ad-slot-N.png` (source: `tile-sections.spec.md`).
- **Suggested fix:** Confirm each `ad-slot-N.png` against its `title`; correct the `alt`/`title` strings if mismatched. No layout change.

### P2-4 — Product card images render at 480w on desktop (srcSet picks the smaller candidate)
- **File:** `src/components/ProductCard.tsx` lines 20-24
- **What's wrong:** `srcSet="...480w, ...600w"` with `sizes="(max-width: 479px) 249px, 25vw"`. At 1440px, 25vw = 360px, so the browser selects the 480w image for a 336px-wide slot. That is acceptable (480 ≥ 336 at DPR 1), but on retina (DPR 2) the 336px slot wants ~672px and only 600w exists — fine. Verified `currentSrc` = the `_480.jpg`. No visible quality issue at DPR 1; flagged only as a sizing-hint subtlety.
- **Expected:** Sharp images at all DPRs (source: `product-rail.spec.md` line 33 "srcSet 480w/600w").
- **Suggested fix:** Optional — none required; the 600w asset covers retina. Leave as-is unless blurriness is observed on hi-DPI.

---

## Verdict Summary

**Pixel-faithful / spec-compliant (no action needed):**
- **Banner strip** — renders, correct black bar (rgb 34,34,34), 13px white underlined text, rotates over 15s. (P2-1 blackout gap is the only nit.) **KNOWN SUSPECT #1 is refuted.**
- **Header** — sticky top:0 z-200 h-124px; "Sale" = rgb(231,29,52); search underline; hero geometry correct.
- **Hero** — 684×912 image right, text-center sans title 38px, Shop Now bordered CTA. Matches `hero-section.spec.md` (title is sans + centered, confirmed).
- **Product cards** — 336×448 image (3:4), srcSet present, badge gray for "New Season" / black for "Special Offer", price ladder colors exact (gray strikethrough rgb 114 → red strikethrough rgb 231 → bold black; discount tokens red/black). Wishlist heart toggles outline↔filled (verified path d 786→384 chars).
- **Mega menu** — opens on hover, correct columns/spotlight/scrim (z-150). *Structure faithful; see P0-1 (close) and P1-1 (column width).*
- **Trending tiles** — captions 15px uppercase left-aligned rgb(34,34,34). Correct.
- **Brands of the moment** — overlay labels white 30px bottom-left. Correct.
- **Help bar** — 3 boxes, border 1px solid rgb(182,182,182), h-110px. Correct.
- **Newsletter** — 2-col, 300px input box, black Sign Up button, Privacy Policy link. Correct.
- **Footer** — white payments block, gray #e6e6e6 (rgb 230) links block, 4 columns, 4 social icons, underlined legal links, black 40px bottom strip. Correct.
- **Promo modal** — appears ~800ms, image+2 buttons, Escape/Dismiss/scrim/CTA close, sessionStorage gate. Matches `promo-modal.spec.md`. (P2-2 = differs from newest screenshot only.)
- **Mobile** — sections stack, product rails horizontally swipeable (overflow-x, scrollWidth>clientWidth verified), desktop nav hidden.

**Needs work:**
- **P0-1** Mega menu cannot be dismissed by mouse (only Escape) — fix the scrim/onMouseLeave relationship.
- **P1-1** Mega menu uses 2-track grid for 2-column menus → columns too wide; force `repeat(3,1fr)`.
- **P1-2** Mobile header 68px instead of 44px at ≤480px.
- **P2** Banner crossfade blackout gap; split-banner alt strings; (modal layout vs newest screenshot — optional).

**Counts:** P0 = 1 · P1 = 2 · P2 = 4
