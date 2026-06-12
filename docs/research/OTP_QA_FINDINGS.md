# Birge SMS OTP Layer — QA Findings

**Verifier:** QA pass (read-only, no fixes applied).
**Scope:** commits `b07050e` (core) + `003d429` (UI) on `master`.
**Method:** static read of all OTP source, `npm run build` + secret scan of `.next/static`, `lint`/`typecheck`, curl against `next start -p 3500`, Playwright (channel `chrome`) UI flows. Server killed after; nothing committed.

## Counts

- **P0: 0**
- **P1: 0**
- **P2: 3** (all polish / type-hygiene — none block the demo)

No honesty violations, no secret leaks, no functional regressions. The layer is demo-ready as built.

---

## P0 — Honesty / Secrets / Functional blockers

**None found.**

Verified explicitly:
- No hardcoded `realSmsSent: true` / `realVerification: true` / `phoneVerified: true` outside provider success paths. Every occurrence in `twilio.ts` / `vonage.ts` / `custom.ts` follows a real 2xx / `status:"approved"` / JSON `status:"0"` branch. `mock.ts` keeps `realSmsSent` and `realVerification` always `false`, `configured` always `false`, and gates code `000000` on `TELECOM_DEV_MODE` (default true).
- Onboarding green panel `✓ Номер подтверждён через live SMS OTP` is gated on `checkResp.realVerification === true`; dev path renders amber `Dev-mode verification complete` + `Dev` chip with `realVerification: false`. Confirmed at runtime.
- `realNetworkCheck` is hardcoded `false` in the OTP check route (5 sites) and in the persisted identity — OTP is never equated with SIM/eSIM silent verification. Security honesty footnote present (`security/page.tsx:226-229`).
- `.next/static` contains no `TWILIO_*` / `VONAGE_*` / `CUSTOM_OTP_*` / `AUTH_TOKEN` / `apiSecret` strings and no provider endpoints (`verify.twilio.com`, `api.nexmo.com`). OTP route responses leak no secrets and no raw phone numbers (curl-confirmed).
- Audit events store sha256-hashed phones only (`phoneHash`), never raw numbers — confirmed in live audit buffer.

---

## P1 — Should fix

**None found.**

---

## P2 — Polish / type hygiene (non-blocking)

### P2-1 — OTP audit events show raw English keys in the profile audit list
- **[file]** `src/components/telecom/TelecomProfileCard.tsx:85-97`
- **wrong:** `EVENT_TYPE_LABELS` maps only the 7 Level-2 event types. The 6 OTP types (`OTP_SEND_REQUESTED`, `OTP_SENT`, `OTP_SEND_FAILED`, `OTP_CHECK_REQUESTED`, `OTP_VERIFIED`, `OTP_INVALID_CODE`) fall through `labelEvent()` to the raw key, so the audit list shows e.g. `OTP_VERIFIED` next to Russian labels like `Верификация успешна`.
- **expected:** OTP events shown with friendly (Russian) labels, consistent with the L2 events.
- **fix:** add the 6 OTP keys to `EVENT_TYPE_LABELS`, e.g. `OTP_VERIFIED: "OTP подтверждён"`, `OTP_INVALID_CODE: "Неверный OTP-код"`, `OTP_SEND_REQUESTED: "Запрос OTP"`, `OTP_SENT: "OTP отправлен"`, `OTP_SEND_FAILED: "Ошибка отправки OTP"`, `OTP_CHECK_REQUESTED: "Проверка OTP"`. No undefined today — purely cosmetic.

### P2-2 — `StoredIdentity.provider` typed too narrowly in JoinDealSheet
- **[file]** `src/components/JoinDealSheet.tsx:22-32` (`provider: TelecomProviderName`)
- **wrong:** Onboarding persists `provider: checkResp.provider`, which for a real Twilio flow is `"twilio"` — not a member of `TelecomProviderName = "mock"|"gsma"|"vonage"|"custom"`. The value is then passed to `calculateCommerceTrustScore` and `buildAuditEvent`. It only typechecks because the `localStorage` JSON is cast, not validated, so the mismatch is a runtime-only contract gap. Harmless in the mock/dev demo path (provider is `"mock"`), and `buildAuditEvent` already accepts the wider `OtpProviderName`.
- **expected:** the stored-identity provider type covers all OTP provider names.
- **fix:** widen the field to `provider: TelecomProviderName | "twilio"` (matching `types.ts:81`) or to `string`, and/or normalize/whitelist the provider on read.

### P2-3 — Dead branch in onboarding start-error handling
- **[file]** `src/app/onboarding/page.tsx:217-224`
- **wrong:** `if (data.status === "failed" || data.status === "not_configured" && !data.message.includes("000000"))` — `&&` binds tighter than `||`, and the inner block only acts when `data.status === "failed"`, so the `not_configured` arm is unreachable. (Mock never returns `not_configured` in dev mode, so behavior is correct; the condition is just confusing dead code.)
- **expected:** clearer intent or removal of the dead clause.
- **fix:** simplify to `if (data.status === "failed") { … }` and drop the `not_configured`/`000000` sub-expression.

---

## "Verified working" list

- **Honesty:** providers (mock/twilio/vonage/custom) set real flags only on genuine provider success; mock always dev-labeled; `realNetworkCheck` always false for OTP; security page has the SMS-OTP-≠-SIM honesty footnote; no UI/docs overclaim.
- **Secrets:** no provider env names, secrets, or endpoints in client bundle; routes return sanitized payloads (masked phone, no requestId on failure, no raw provider payloads).
- **risk.ts non-stacking:** network (+50) / dev-network (+25) vs OTP real (+35) / OTP dev (+15) computed as separate candidates; only the larger bonus applied (`risk.ts:103-137`). Dev-mode OTP correctly scores +15 (total 35 with the +20 `numberVerified`, which is expected, not double-counting).
- **Rate limiter:** bounded `Map` keyed by phone-hash, 10-min sliding window, max 3; entries replaced on window roll-over (no unbounded growth per phone). 429 on 4th rapid start confirmed.
- **Audit:** OTP events recorded server-side, phones sha256-hashed, `OTP_SENT` only on `realSmsSent`. No raw phone in buffer.
- **Status route:** `otp` block exactly `{provider:"mock", enabled:false, configured:false, capability:"sms_otp"}`.
- **Onboarding:** full dev flow at 390px — amber dev panel, wrong-code error, dev-complete amber result, Level-2 3-line panel, profile fields, continue to `/interests`.
- **JoinDealSheet (L2 regression):** opens with extended OTP record, trust badge renders with no `undefined`, duplicate-block on reopen works; no console errors.
- **Profile:** dev-mode OTP rows render (`Dev-mode OTP`, `realVerification: false`) with no undefined; legacy pre-OTP record renders cleanly with no new rows; audit list includes OTP events.
- **Security page:** SMS OTP status row, comparison table with both columns, honesty footnote, positioning line, key line, SIM-swap note, white-label line — all present.
- **L2 regression:** `/api/telecom/verify` works; home @1440 + onboarding/profile/security/deal @390 — zero console errors.
- **Docs/env:** `.env.example` has all 11 OTP vars; `docs/TELECOM_IDENTITY.md` documents OTP routes/env/scores with the honesty note and exact positioning phrase. (Note: the doc lives at `docs/TELECOM_IDENTITY.md`, not `docs/research/` — fine, just flagging the path.)
- **Build/lint/typecheck:** build OK; lint 144 warnings / 0 errors (= baseline, no new warnings); typecheck 0 errors.

---

## Runtime results table

| # | Test | Expected | Result |
|---|------|----------|--------|
| a | GET /api/telecom/status otp block | `{provider:"mock",enabled:false,configured:false,capability:"sms_otp"}` | PASS |
| b1 | POST otp/start happy | `sent`, realSmsSent false, dev message, 200 | PASS |
| b2 | POST otp/start consent false | 400 | PASS |
| b3 | POST otp/start bad phone | 400 | PASS |
| b4 | 4th rapid otp/start (same phone) | 429 rate_limited | PASS |
| c1 | POST otp/check "000000" | approved, realVerification false, identity{realNetworkCheck:false}, trust +15 dev | PASS |
| c2 | POST otp/check wrong code | `invalid`, 200 | PASS |
| c3 | POST otp/check "12" | 400 | PASS |
| d1 | /onboarding @390 dev panel | amber "используйте код 000000" (not green live) | PASS |
| d2 | wrong code | "Неверный код. Попробуйте ещё раз." | PASS |
| d3 | correct code result | amber "Dev-mode verification complete" (not green confirm) | PASS |
| d4 | Level 2 panel | 3 exact lines incl. "1 SIM/eSIM identity = 1 trusted group slot." | PASS |
| d5 | profile fields → /interests | renders + navigates | PASS |
| e1 | localStorage identity | verificationType, realVerification:false, realNetworkCheck:false, trustScore | PASS |
| e2 | JoinDealSheet (extended record, /deal/[slug]) | opens, trust badge, no "undefined" | PASS |
| e3 | duplicate-block (join→close→reopen) | blocked banner | PASS |
| f1 | /security SMS OTP row | present | PASS |
| f2 | comparison table + both columns | "Сегодня в демо vs Production с оператором" | PASS |
| f3 | honesty footnote | present | PASS |
| f4 | positioning line + key line + SIM-swap + white-label | all present | PASS |
| g1 | /profile dev-mode OTP rows | "Dev-mode OTP", realVerification false, no undefined | PASS |
| g2 | legacy pre-OTP record in profile | renders, no new rows, no undefined | PASS |
| g3 | audit includes OTP events | OTP_* events present, phones hashed | PASS |
| h1 | L2 /api/telecom/verify | works (masked phone, trust) | PASS |
| h2 | home @1440 + pages @390 | no console errors | PASS |
| sec | secret scan of .next/static + responses | no secrets/endpoints/raw phone | PASS |
| build | build / lint / typecheck | OK / 144 warn 0 err (baseline) / 0 err | PASS |

> Note on test (e): the `JoinDealSheet` lives on `/deal/[slug]` (via `DealDetail`), not `/deal/demo` (which is the live-demo page). Tested against `/deal/wireless-headphones` with the extended OTP record seeded — all pass.
