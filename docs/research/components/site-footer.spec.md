# SiteFooter Specification

## Overview
- **Target file:** `src/components/SiteFooter.tsx`
- **Screenshot:** `docs/design-references/section-footer.png` (full footer at high res)
- **Interaction model:** static; links underline on hover

## DOM Structure
```
<footer> (white bg)
  <hr> 1px #e6e6e6, marginBottom 12px
  payments area (white): heading + 4 logo boxes
  gray block (#e6e6e6): 4 link columns + Follow us/social
  <hr> 1px white
  legal area (still gray): legal links row, trademark, copyright
```

## Computed Styles

### hr (top)
- borderTop: 1px solid rgb(230,230,230); marginBottom: 12px; full width 1440

### Payments area
- width 1392 (24px gutters); paddingTop 4px; paddingBottom 16px (total h 83)
- heading "Payment methods": h2 fontSize 15px; fontWeight 700; lineHeight 20px; color rgb(34,34,34)
- logo row (marginTop ~12px): flex gap ~16px; each logo box: 48x30 svg (`AmexLogo`, `MastercardLogo`, `VisaLogo`, `PaypalLogo` from `@/components/icons` — they render their own boxed designs, add border 1px solid rgb(230,230,230) wrapper)

### Gray link block
- full-width; backgroundColor rgb(230,230,230); paddingTop 24px; paddingBottom 24px
- inner nav: width 1392; display grid; gridTemplateColumns repeat(4, 1fr) (4x 330px, gap 24); height ~334
- column heading: h2 fontSize 15px; fontWeight 700; lineHeight 20px; color rgb(34,34,34); marginBottom ~7px
- links: li rows h 34px; a fontSize 15px; fontWeight 400; color rgb(34,34,34); padding 6px 0; display block; hover underline
- 4th column also contains (below its single link): "Follow us" heading (15px/700, marginTop ~24px) + social icon row: 4 icons 24x24 (`InstagramIcon`, `TikTokIcon`, `FacebookIcon`, `YoutubeIcon`), gap ~24px, marginTop ~12px

### hr (between links and legal)
- borderTop 1px solid rgb(255,255,255)

### Legal area (still on gray bg)
- width 1392; padding ~24px 0 (h≈78 + margins)
- legal links row: flex gap 24px; a fontSize 15px; textDecoration underline; color rgb(34,34,34) (Privacy policy / Terms and conditions / Accessibility)
- trademark p: fontSize 13px; lineHeight 17px; color rgb(34,34,34); marginTop 18px
- copyright p: fontSize 13px; lineHeight 17px; marginTop 4px
- very bottom: black strip `<div>` h≈40px background rgb(34,34,34) full-width (visible at page end)

## Content (from `footer` in src/lib/content.ts)
- 4 columns: Customer Service (9 links) / About FARFETCH (7) / Discounts and membership (4) / Content and services (1 + Follow us + 4 socials). All hrefs in content.ts.
- trademark + copyright strings verbatim in content.ts.

## Props contract
No props — import `footer` from `@/lib/content`.

## Responsive
- ≥1024: 4 columns.
- 768: 2x2 columns (gap 24).
- <480: single column accordion-look (just stacked, no collapse behavior — out of scope), payment logos wrap.
