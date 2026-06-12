# HelpBar Specification

## Overview
- **Target file:** `src/components/HelpBar.tsx`
- **Screenshot:** `docs/design-references/sec-help-bar.png`, bottom of `slices/d4.png`
- **Interaction model:** static; whole box is a link; title underlines on hover

## DOM Structure
`<div data-testid="help-bar">` grid of 3 `<article>` boxes, each wrapped in/containing an `<a>`.

## Computed Styles

### Container
- width: 1392px (24px gutters); display: grid; gridTemplateColumns: repeat(3, 1fr) (3x 448px); gap: 16px 24px; marginTop: 54px; marginBottom: 54px

### Article box (448x110)
- border: 1px solid rgb(182, 182, 182); backgroundColor: rgb(255,255,255)
- display: flex; flexDirection: column; gap: 8px; padding: 16px

### Icon row
- svg 24x24; color rgb(34,34,34)
- icons: item1 `HangerIcon`, item2 `QuestionMarkCircleIcon`, item3 `BubbleIcon` (from `@/components/icons`)

### Text block (flex column gap 4px)
- title: fontSize 15px; lineHeight 20px; fontWeight 400; textTransform uppercase; color rgb(34,34,34) — rendered from mixed-case source via uppercase ("How to shop" → HOW TO SHOP). Title is the `<a>`; hover underline.
- body: fontSize 15px; lineHeight 20px; fontWeight 400; color rgb(34,34,34)

## Content (from `helpBar` in src/lib/content.ts)
1. hanger | HOW TO SHOP | "Your guide to shopping and placing orders" | /how-to-shop
2. question | FAQS | "Your questions answered" | /faqs
3. bubble | NEED HELP? | "Contact our global Customer Service team" | /contact-us

## Props contract
```ts
import type { HelpBarItem } from "@/types/farfetch";
export function HelpBar({ items }: { items: HelpBarItem[] }): JSX.Element
```
Map `icon` field: "hanger" → HangerIcon, "question" → QuestionMarkCircleIcon, "bubble" → BubbleIcon.

## Responsive
- ≥1024: 3-up grid.
- <1024: stacked (1 column, gap 16px), full width.
