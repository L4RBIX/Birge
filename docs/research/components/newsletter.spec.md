# NewsletterSection Specification

## Overview
- **Target file:** `src/components/NewsletterSection.tsx`
- **Screenshot:** mid region of `docs/design-references/section-footer.png` (above payment methods)
- **Interaction model:** form (visual only — no submit backend; preventDefault)

## DOM Structure
Two-column grid: left = heading + body; right = label, input, button, legal copy.

## Computed Styles

### Section container
- width: 1392px (24px gutters); height ~248px; display: grid; gridTemplateColumns: 1fr 1fr (684px each); gap: 24px; padding-bottom ~64px (white area above footer hr)

### Left column
- heading "Never miss a thing": fontSize 30px; lineHeight 38px; fontWeight 400; fontFamily Farfetch Basis (sans); color rgb(34,34,34)
- body: fontSize 15px; lineHeight 20px; color rgb(34,34,34); marginTop ~12px

### Right column (flex column)
- "GET UPDATES BY": fontSize 15px; lineHeight 20px; textTransform uppercase (source text "Get updates by"); color rgb(34,34,34)
- "Email" label: fontSize 15px; lineHeight 20px; marginTop ~12px
- input: width 300px (within 684 col, input box measured 300x42 + 1px outer border = 44 total); height 42px; border 1px solid rgb(182,182,182) on wrapper; paddingLeft 16px; fontSize 15px; placeholder "Your email address" color rgb(182,182,182); marginTop ~8px
- "Sign Up" button: height 44px; padding 10px 16px; backgroundColor rgb(34,34,34); color rgb(255,255,255); fontSize 15px; fontWeight 700; border 1px solid transparent; marginTop 16px; hover: ff-transition, slight opacity 0.8
- legal copy: fontSize 15px; lineHeight 20px; color rgb(34,34,34); marginTop 16px; max 684px wide; "Privacy Policy" inline link underlined

## Content (from `newsletter` in src/lib/content.ts)
- heading, body, updatesLabel ("GET UPDATES BY"), methodLabel ("Email"), placeholder ("Your email address"), buttonLabel ("Sign Up"), legal text with Privacy Policy link → /privacy-policy/

## Props contract
No props — import `newsletter` from `@/lib/content` directly. Client component (form state optional; preventDefault on submit).

## Responsive
- ≥1024: 2-col.
- <1024: stacked single column, gap 24; input full-width (max 343px on mobile).
