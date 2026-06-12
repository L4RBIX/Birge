# Birge

Birge is a Kazakhstan-focused group-buying marketplace MVP for localized access to global marketplaces.

Users register, pass simulated SIM/eSIM ID verification, select interests and budget, receive personalized product recommendations in KZT, and join group purchases where the price decreases as more people join.

## Level 1 — Hackathon MVP

AI-ready personalized recommendations + group buying + marketplace aggregation + localization.

## Level 2 — Strategic Vision

SIM/eSIM identity layer + telecom integration + secure commerce ecosystem.

## Demo Flow

1. Onboarding / SIM verification
2. Interest selection
3. Personalized deal feed
4. Product detail with price waterfall
5. Join group purchase
6. Live QR group demo
7. Security / SIM identity explanation
8. Profile / My deals

## Tech Stack

- **Next.js 16** — App Router, React 19, TypeScript strict
- **shadcn/ui** — Radix primitives + Tailwind CSS v4
- **Tailwind CSS v4** — oklch design tokens
- **Lucide React** — icons

## Quick Start

```bash
npm install
npm run dev
```

Visit http://localhost:3000 to start the demo flow.

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run lint       # ESLint check
npm run typecheck  # TypeScript check
npm run check      # Run lint + typecheck + build
```

## Level 2: Telecom Identity Layer

The core trust primitive: **1 SIM/eSIM identity = 1 trusted group slot.**

Provider adapters (GSMA Open Gateway, Vonage Silent Auth, custom operator), a trust/risk engine, audit trail, and device binding are wired up and production-ready. Currently running in **dev-mode** — no real network calls are made until operator credentials are configured. Set `TELECOM_IDENTITY_PROVIDER`, `TELECOM_NUMBER_VERIFY_URL`, and the matching credentials in `.env.local` to enable real SIM verification.

- API routes: `GET /api/telecom/status`, `POST /api/telecom/verify`, `GET /api/telecom/audit`
- Full documentation: [docs/TELECOM_IDENTITY.md](docs/TELECOM_IDENTITY.md)
- Environment variables: [.env.example](.env.example)

## Project Structure

```
src/
  app/              # Next.js routes (onboarding, interests, deals, profile, etc.)
  components/       # React components
    ui/             # shadcn/ui primitives
  lib/              # Utilities and helpers
    telecom/        # Level 2 telecom identity layer
  types/            # TypeScript interfaces
public/
  images/           # Product images and assets
docs/
  research/         # Design and architecture notes
PRODUCT.md          # Product specification
DESIGN.md           # Design guidelines
```
