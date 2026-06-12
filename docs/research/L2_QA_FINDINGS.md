# Birge Level 2 — Telecom Identity Layer · QA Findings

**Verifier:** QA pass (read-only, no fixes applied)
**Commits under test:** fd2c12b (core) + e0229fa (UI) · branch `master` · HEAD e0229fa
**Server:** `next start -p 3300` against existing production build (BUILD_ID t6QQF1C5hWiPMiVM9AmKO), env defaults to `provider=mock, devMode=true, configured=false`
**Date:** 2026-06-12

## Summary counts

- **P0 (blocking):** 0
- **P1 (must fix):** 1
- **P2 (should fix):** 3

The #1 acceptance criterion — HONESTY — is fully satisfied. No false "real SIM verified" claims anywhere; `realNetworkCheck: true` is set only after a genuine 2xx provider response. Secret safety is clean (no secrets in client bundle or API responses). One functional acceptance test (JoinDealSheet reopen-after-join) fails and must be fixed.

---

## P0 — Blocking (honesty / secrets / crashes)

**None.**

Verified clean (see "Verified working" below for the full honesty + secret-safety evidence).

---

## P1 — Must fix

### P1-1 · JoinDealSheet does not block re-join on reopen within the same page mount

- **File:** `src/components/JoinDealSheet.tsx` (lines 146–192, `useEffect` + `lastInitKey` ref; `close()` at 194–197)
- **Wrong:** After a user joins a deal, closes the sheet, and reopens it **without a page reload**, the duplicate-blocked banner ("Это устройство уже занимает место в группе. 1 SIM = 1 место.") does NOT appear and the join "Продолжить" button is still shown — re-join is allowed. Confirmed at runtime: test 3e failed (`dupBanner on reopen = 0`, `continueBtn = 1`).
- **Root cause:** The init guard uses `lastInitKey.current = \`${open}:${dealId}\``. On reopen, `open` is `true` and `dealId` is unchanged, so `initKey` is byte-identical to the first open. The guard `if (lastInitKey.current === initKey) return;` (line 159) short-circuits, so the init microtask — which calls `hasJoinedDeal(dealId)` and `setIsDuplicate(...)` — never re-runs. `isDuplicate` retains its stale `false` from the first open. `close()` resets `step` but never resets `lastInitKey.current`.
- **Proof it is purely the re-init guard:** `localStorage["birge_joined_deals"]` IS written correctly on join (`["power-bank"]`), and after a full page reload (fresh mount → `lastInitKey` reset to `""`) the duplicate banner DOES appear (debug run: `AFTER PAGE RELOAD dupBanner: 1`). The data layer and the server-side `DUPLICATE_DEVICE_BLOCKED` audit event work. Only the same-mount reopen path is broken.
- **Expected:** Reopening the sheet for an already-joined deal must immediately show the duplicate banner and hide the join flow (acceptance test e).
- **Concrete fix (pick one):**
  - In `close()` reset the guard: `lastInitKey.current = "";` so the next open re-initialises. (Minimal, recommended.)
  - OR make the effect re-run state when `open` flips false: add an `else` branch resetting `lastInitKey.current = ""` when `!open` at the top of the effect.
  - OR drop the ref guard entirely and compute `isDuplicate` directly from `hasJoinedDeal(dealId)` on each render while `open` (it is a cheap synchronous localStorage read); keep the audit-event side effect behind a per-open ref so it fires once.

---

## P2 — Should fix

### P2-1 · Onboarding accepts `8XXXXXXXXXX` local format but sends it unnormalised; API rejects with 400

- **File:** `src/app/onboarding/page.tsx` — `isValidKzPhone` (line 40–44) and `handleVerify` (line 113)
- **Wrong:** Client `isValidKzPhone` regex `/^(\+7|8)\d{10}$/` accepts an `8`-prefixed number (e.g. `87001234567`). `handleVerify` only strips whitespace/dashes/parens and POSTs the raw value. The API regex `PHONE_REGEX = /^\+[1-9]\d{6,14}$/` (`src/app/api/telecom/verify/route.ts:23`) requires a leading `+`, so the server returns 400. Confirmed: `POST {phoneNumber:"87001234567"}` → `HTTP 400`. The user sees the generic "Ошибка верификации" error state instead of a smooth verify.
- **Expected:** A number the client accepts should be accepted by the server. Normalise `8XXXXXXXXXX` → `+7XXXXXXXXXX` before sending.
- **Concrete fix:** In `handleVerify`, normalise: `const normalized = cleaned.replace(/^8/, "+7");` (after stripping separators) and send `normalized`. The `+7...` happy path already works (tested OK).

### P2-2 · Unused `eslint-disable` directive in audit.ts (only new lint warning)

- **File:** `src/lib/telecom/audit.ts:34`
- **Wrong:** `var __birge_telecom_audit_buffer: ... // eslint-disable-line no-var` produces a NEW warning: *"Unused eslint-disable directive (no problems were reported from 'no-var')."* (the `declare global { var ... }` form does not trigger `no-var`). This is the only new ESLint warning introduced by the L2 files (0 errors; `--fix` can remove it).
- **Expected:** No new warnings.
- **Concrete fix:** Delete the trailing `// eslint-disable-line no-var` comment on line 34.

### P2-3 · Hardcoded feminine verb "прошла" in trusted-slot join toast for all names

- **File:** `src/components/LiveDemoPanel.tsx:141` (`simulateJoin`)
- **Wrong:** Toast is built as `\`${name} прошла SIM ID · trusted slot №${next}\``. `DEMO_NAMES` includes male names (Данияр, Нурлан, Ержан, Алихан) that should read "прошёл". Cosmetic Russian-grammar issue. (Note: the acceptance test for this toast — test d — matches the literal "прошла SIM ID · trusted slot №" string, so this does NOT fail the test; flagged for polish only.)
- **Expected:** Gender-correct verb, or a gender-neutral phrasing (e.g. "получил(а) trusted slot" or "занял место" / "место занято").
- **Concrete fix:** Add a per-name gender map, or rephrase neutrally, e.g. `\`${name}: trusted slot №${next} · SIM ID\``.

---

## Verified working ✓

**Honesty (the #1 acceptance criterion) — all clean:**
- `realNetworkCheck: true` appears in `src/` only inside provider adapters and ONLY after a confirmed 2xx response: `gsma.ts:139` (verify 2xx) & `:255` (simSwap 2xx); `vonage.ts:151` (verify 2xx); `custom.ts:187` (verify 2xx) & `:293` (simSwap 2xx). not_configured / non-2xx / timeout / error paths all set `realNetworkCheck: false`. (Code-read + grep.)
- `mock.ts` never returns `configured: true` or `realNetworkCheck: true` (dev-mode and `DEV_MODE=false` paths both false). Live verify confirms `configured:false, realNetworkCheck:false`.
- Onboarding green "✓ Номер подтверждён через telecom Network API" branch is gated on `configured && realNetworkCheck` (`onboarding/page.tsx:246`); the dev-mode amber panel ("Dev-mode: Network API не настроен…") shows on `!configured || !realNetworkCheck`. Runtime test 3c: green success NOT shown, dev-mode panel + `realNetworkCheck: false` badge shown.
- No UI/docs language claims a real SIM/eSIM was verified in dev-mode; security page explicitly states credentials are absent and the step is simulated.

**Secret safety — all clean:**
- `config.ts` (the only `process.env.TELECOM_*` reader) is imported only by `api/telecom/status/route.ts` (server) and transitively by `provider.ts`/`mock.ts`. No client (`"use client"`) component imports it directly or transitively.
- Client components import only `telecom/audit`, `telecom/risk`, `telecom/device`, `telecom/types` — none of which import `config.ts`. `risk.ts` and `device.ts` import only `types.ts`/nothing.
- Built client bundle (`.next/static`) contains NO `node:crypto`, `createHash`, `TELECOM_CLIENT_SECRET`, `TELECOM_API_SECRET`, or `callbackSecret`. The guarded `require("node:crypto")` in `audit.ts` (server branch) is tree-shaken out of client chunks; the dual-env hashing logic is correct.
- `GET /api/telecom/status` returns no credentials. `POST /api/telecom/verify` masks the phone (`+7700***4567`), omits `rawProviderReference`, and returns no secrets/raw payloads. `GET /api/telecom/audit` returns sha256-hashed phone/device, never raw.

**Functional runtime tests (Playwright, chrome channel) — see table below.**

**Code quality:**
- `risk.ts` scoring matches the spec table exactly (+50 real / +25 dev / +20 number / +10 device / +20 low-swap; medium→step_up; high→block; risk_blocked→block, score 0). Live dev-verify trustScore = 25+20+10 = 55. ✓
- No raw phone numbers stored anywhere: localStorage writes use masked (`phoneMasked` = already-masked API value) or FNV/sha256 hashes; audit stores only hashes. ✓
- `device.ts` performs NO fingerprinting (no navigator/canvas/webgl/screen probing) — random UUID + localStorage only. Uses Web Crypto, client-safe. ✓
- API input validation: rejects non-string/bad phone, `consentGiven !== true`, and invalid JSON, all with 400. ✓
- `tsc --noEmit`: no telecom-related type errors. ESLint: 0 new errors, 1 new warning (P2-2).

**Docs:**
- `docs/TELECOM_IDENTITY.md` present; all env-var names match `config.ts`; all 3 endpoints documented; score table matches `risk.ts` exactly.
- README has the "Level 2: Telecom Identity Layer" section listing the three endpoints.

---

## Runtime test results

| Test | Scenario | Result |
|------|----------|--------|
| 3a | `GET /api/telecom/status` → `provider:mock, configured:false, devMode:true`, not-configured message, no secrets | **PASS** |
| 3b-1 | `POST /verify` happy path (`+77001234567`, consent) → 200, `realNetworkCheck:false`, `configured:false`, phone masked, trustScore 55 | **PASS** |
| 3b-2 | `POST /verify` `consentGiven:false` → 400 | **PASS** |
| 3b-3 | `POST /verify` phone `"abc"` → 400 | **PASS** |
| 3b-4 | `POST /verify` invalid JSON → 400 | **PASS** |
| 3c | `/onboarding` @390×844: verify → dev-mode panel shown, green success NOT shown, `realNetworkCheck:false` badge, localStorage identity set; profile step has name/age/gender/city/budget | **PASS** |
| 3d | `/deal/demo` @1440: counter panel + provider row; Simulate join → participant 14→15, trusted slot toast "…прошла SIM ID · trusted slot №…"; Simulate duplicate → "Duplicate blocked · 1 SIM = 1 место" + counter→1 | **PASS** |
| 3e | JoinDealSheet (`/deal/wireless-headphones`): first open not duplicate (PASS); **reopen after join shows duplicate banner & blocks re-join** | **FAIL** (P1-1) |
| 3f | `/profile` (post-onboarding context): telecom panel shows Provider:mock, dev-mode label, trust score row, audit events non-empty after join | **PASS** |
| 3g | `/security`: status card provider=mock, Dev Mode badge, Not configured; hero string exact; "1 SIM/eSIM identity = 1 trusted group slot." present | **PASS** |
| 3h | Regression: `/`, `/interests`, product detail @1440 & @390 — no horizontal overflow, zero console errors | **PASS** |
| — | Audit endpoint populated after verify, sha256 hashes, NO raw phone | **PASS** |

**29/31 Playwright assertions passed.** The 2 failures are both facets of P1-1 (reopen-after-join duplicate block).
