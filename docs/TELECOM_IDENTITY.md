# Level 2: Telecom Identity Layer

## What "Level 2" Means

Birge's Level 2 identity model is built on the principle:

> **1 SIM/eSIM identity = 1 trusted group slot.**

Each group-buying slot is tied to a verified phone number — not just an email or social account.  This means:

- One person cannot hold multiple group slots under different identities.
- A SIM swap event (a common fraud vector) freezes active deals until re-verification.
- Real SIM/eSIM verification requires operator or Network API credentials — it cannot be achieved in dev-mode.

---

## Why Real SIM/eSIM Verification Requires Operator Credentials

Standard web verification (OTP, email) does not prove that the phone number's SIM card is in the user's possession.  Real cryptographic SIM/number verification uses:

| Method | How it works | Requires |
|---|---|---|
| GSMA Open Gateway / CAMARA Number Verify | Operator matches the request IP/network to the SIM registered for that number — no OTP, silent in-network check | TELECOM_NUMBER_VERIFY_URL + CLIENT_ID + CLIENT_SECRET |
| Vonage Silent Auth | Similar IP-to-number binding check via Vonage's operator network | TELECOM_API_KEY + TELECOM_API_SECRET |
| Custom operator | Direct REST call to a KZ operator (Beeline/Kcell/Tele2/Activ) Network API | TELECOM_NUMBER_VERIFY_URL + auth credential |

Without these credentials, `realNetworkCheck` is always `false` and `configured` is always `false`.

---

## Provider Architecture

```
TELECOM_IDENTITY_PROVIDER (env)
        │
        ▼
 getTelecomProvider()          ← src/lib/telecom/provider.ts
        │
        ├── "mock"   → mockProvider    ← providers/mock.ts
        ├── "gsma"   → gsmaProvider    ← providers/gsma.ts
        ├── "vonage" → vonageProvider  ← providers/vonage.ts
        └── "custom" → customProvider  ← providers/custom.ts
```

### Adapter Contract (`TelecomIdentityProvider`)

Each adapter implements:

```ts
interface TelecomIdentityProvider {
  name: TelecomProviderName;
  verifyNumber(request: TelecomIdentityRequest): Promise<TelecomIdentityResult>;
  checkSimSwap?(request: TelecomIdentityRequest): Promise<TelecomIdentityResult>;
}
```

Key honesty rule: `realNetworkCheck: true` is set **only** when an actual HTTP request was made to a configured provider and completed with a 2xx response.

---

## Dev-mode vs Production Mode

| | Dev-mode (`TELECOM_DEV_MODE=true`) | Production |
|---|---|---|
| `provider` | `mock` | `gsma` / `vonage` / `custom` |
| `configured` | `false` | `true` |
| `realNetworkCheck` | `false` | `true` (on success) |
| `simVerified` | `true` (labeled dev-only) | Real operator result |
| `riskScore` | 55 (moderate, no real signal) | Based on operator data |
| Network calls | None | Real HTTP to operator API |
| Result label | "Dev-mode telecom identity. Production requires Network API credentials." | Operator confirmation message |
| Use case | Local development, hackathon demo | Production deployment |

---

## Environment Configuration

See `.env.example` for all variables.  Required per provider:

```
# Shared
TELECOM_IDENTITY_PROVIDER=mock|gsma|vonage|custom
TELECOM_COUNTRY=KZ
TELECOM_OPERATOR_HINT=Beeline
TELECOM_DEV_MODE=true

# GSMA / Custom
TELECOM_NUMBER_VERIFY_URL=https://...
TELECOM_SIM_SWAP_URL=https://...   (optional)
TELECOM_CLIENT_ID=...
TELECOM_CLIENT_SECRET=...

# Vonage
TELECOM_API_KEY=...
TELECOM_API_SECRET=...

# Webhooks
TELECOM_REDIRECT_URI=...
TELECOM_CALLBACK_SECRET=...
```

---

## API Routes

### `GET /api/telecom/status`

Returns provider configuration status.  No secrets returned.

**Response (dev-mode):**
```json
{
  "provider": "mock",
  "configured": false,
  "country": "KZ",
  "operatorHint": "Beeline",
  "devMode": true,
  "capabilities": ["number_verify", "sim_swap_risk", "device_binding", "trusted_group_slot"],
  "message": "Telecom Network API credentials are not configured."
}
```

**Response (production, configured):**
```json
{
  "provider": "gsma",
  "configured": true,
  "country": "KZ",
  "operatorHint": "Beeline",
  "devMode": false,
  "capabilities": ["number_verify", "sim_swap_risk", "device_binding", "trusted_group_slot"]
}
```

---

### `POST /api/telecom/verify`

Verify a phone number.  Requires user consent.

**Request:**
```json
{
  "phoneNumber": "+77001234567",
  "deviceId": "browser-uuid-or-empty",
  "consentGiven": true
}
```

**Validation:**
- `phoneNumber`: E.164 format, `+` followed by 7-15 digits (KZ: +7 + 10 digits)
- `consentGiven`: must be `true`

**Response (dev-mode):**
```json
{
  "status": "verified",
  "provider": "mock",
  "phoneNumber": "+7700***4567",
  "operator": "Beeline",
  "country": "KZ",
  "simVerified": true,
  "numberVerified": true,
  "deviceBound": true,
  "simSwapRisk": "unknown",
  "simSwapDetected": false,
  "riskScore": 55,
  "reason": "Dev-mode telecom identity. Production requires Network API credentials.",
  "checkedAt": "2026-06-12T10:00:00.000Z",
  "realNetworkCheck": false,
  "configured": false,
  "trust": {
    "trustScore": 55,
    "decision": "allow",
    "reasons": ["Dev-mode верификация (не реальная проверка сети) (+25).", "Номер телефона верифицирован (+20).", "Устройство привязано к аккаунту (+10)."]
  }
}
```

**Error responses:**
- `400` — invalid phone number or missing consent
- `200` with `status: "not_configured"` — provider not configured
- `200` with `status: "failed"` — provider returned an error

---

### `GET /api/telecom/audit`

Returns recent server-side audit events.  Phone numbers are stored as hashes only.

**Query params:** `?limit=20` (max 100)

**Response:**
```json
{
  "events": [
    {
      "eventType": "TELECOM_VERIFY_REQUESTED",
      "phoneHash": "sha256-hex...",
      "deviceIdHash": "sha256-hex...",
      "provider": "mock",
      "realNetworkCheck": false,
      "createdAt": "2026-06-12T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

## Trust Score Model

| Signal | Points | Notes |
|---|---|---|
| Real network check + verified | +50 | Only when `realNetworkCheck: true` and HTTP 2xx from provider |
| Dev-mode verified | +25 | Clearly labeled — not a real check |
| `numberVerified: true` | +20 | |
| `deviceBound: true` | +10 | |
| `simSwapRisk: "low"` | +20 | |
| `simSwapRisk: "medium"` | — | Decision: `step_up` |
| `simSwapRisk: "high"` | — | Decision: `block` |
| `status: "risk_blocked"` | — | Decision: `block`, score 0 |
| `status: "not_configured"` | 30 | Decision: `allow` (demo labeled) |

**Decisions:**
- `allow` — proceed with group slot
- `step_up` — require additional verification before slot allocation
- `block` — deny slot, freeze existing deals

---

## Audit Event Types

| Event | When |
|---|---|
| `TELECOM_VERIFY_REQUESTED` | Every verify API call |
| `TELECOM_VERIFY_SUCCESS` | Provider returned verified/pending |
| `TELECOM_VERIFY_NOT_CONFIGURED` | Provider not configured |
| `SIM_SWAP_RISK_HIGH` | High SIM swap risk detected |
| `GROUP_SLOT_BOUND` | Device successfully bound to a group deal |
| `DUPLICATE_DEVICE_BLOCKED` | Same device tried to join twice |
| `ESCROW_RISK_CHECK_PASSED` | Escrow pre-check passed for payment |

Storage:
- Server: in-memory ring buffer, max 100 events (globalThis-cached for dev hot-reload stability)
- Client: `localStorage["birge_telecom_audit"]`, max 50 events
- PII: phone numbers stored as sha256 hash (server) or FNV-1a hash prefixed "demo-" (browser).  Raw numbers are never stored.

---

## Device Binding

`src/lib/telecom/device.ts` provides browser-side device ID management:

```ts
getOrCreateDeviceId()   // SSR-safe; returns "" on server
hasJoinedDeal(dealId)   // Check if this device already joined
markDealJoined(dealId)  // Record a group deal join
clearDemoDeviceBinding() // Reset for testing or logout
```

Device ID is stored in `localStorage["birge_device_id"]`.  This is a **demo-level binding** — it prevents casual duplicate joins but is not fraud-proof.  Real enforcement requires a telecom provider to confirm the phone number is associated with this device.

---

## SIM Swap Risk Model

When a SIM swap is detected:

1. The verification result includes `simSwapDetected: true` and `simSwapRisk: "high"`.
2. The trust engine returns `decision: "block"`.
3. API response status is `risk_blocked`.
4. **При смене SIM активные сделки замораживаются до повторной верификации** — active deals are frozen until the user re-verifies with the new SIM.

This is enforced by checking `simSwapRisk` in both the `/verify` route and the `calculateCommerceTrustScore()` function.

---

---

## SMS OTP Layer

**Live phone verification works now via SMS OTP. SIM/eSIM silent Network API is production-ready and can replace OTP once operator credentials are available.**

### SMS OTP ≠ SIM/eSIM Silent Verification

**Important honesty note:** SMS OTP proves that a user can receive a text message on a phone number — it does NOT prove SIM card possession via the operator network.  The two mechanisms are distinct:

| Method | What it proves | `realNetworkCheck` | `realVerification` |
|---|---|---|---|
| SMS OTP (Twilio/Vonage/custom) | User received a code on their phone | `false` — always | `true` when provider returns approved |
| GSMA/Vonage Silent Auth / CAMARA | Operator-level IP-to-SIM binding | `true` when configured | N/A (different field) |

Never set `realNetworkCheck: true` for an OTP flow.  Never claim SIM/eSIM verification from OTP results.

### Provider Setup

#### Twilio Verify v2
1. Create a Twilio account at [twilio.com](https://twilio.com)
2. Get your Account SID and Auth Token from the Console
3. Create a Verify Service (Console → Verify → Services)
4. Set environment variables:
```env
TELECOM_OTP_PROVIDER=twilio
TELECOM_OTP_ENABLED=true
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=<your_auth_token>
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Vonage Verify (Legacy JSON API)
1. Create a Vonage/Nexmo account at [vonage.com](https://vonage.com)
2. Get your API Key and API Secret from the Dashboard
3. Set environment variables:
```env
TELECOM_OTP_PROVIDER=vonage
TELECOM_OTP_ENABLED=true
VONAGE_API_KEY=<your_api_key>
VONAGE_API_SECRET=<your_api_secret>
VONAGE_BRAND_NAME=Birge
```

#### Custom OTP Provider
Any provider that accepts JSON POST requests:
```env
TELECOM_OTP_PROVIDER=custom
TELECOM_OTP_ENABLED=true
CUSTOM_OTP_SEND_URL=https://your-provider.com/send
CUSTOM_OTP_CHECK_URL=https://your-provider.com/check
CUSTOM_OTP_API_KEY=<optional_api_key>
```

### Environment Variable Reference

| Variable | Default | Description |
|---|---|---|
| `TELECOM_OTP_PROVIDER` | `mock` | OTP provider: `mock`, `twilio`, `vonage`, `custom` |
| `TELECOM_OTP_ENABLED` | `false` | Enable OTP routes with a real provider |
| `TWILIO_ACCOUNT_SID` | — | Twilio Account SID (required for twilio) |
| `TWILIO_AUTH_TOKEN` | — | Twilio Auth Token (required for twilio) |
| `TWILIO_VERIFY_SERVICE_SID` | — | Twilio Verify Service SID (required for twilio) |
| `VONAGE_API_KEY` | — | Vonage API Key (required for vonage) |
| `VONAGE_API_SECRET` | — | Vonage API Secret (required for vonage) |
| `VONAGE_BRAND_NAME` | `Birge` | Brand name shown in SMS |
| `CUSTOM_OTP_SEND_URL` | — | Custom send endpoint URL (required for custom) |
| `CUSTOM_OTP_CHECK_URL` | — | Custom check endpoint URL (required for custom) |
| `CUSTOM_OTP_API_KEY` | — | Optional API key sent as `x-api-key` header |

---

### `POST /api/telecom/otp/start`

Start an OTP flow.  Sends an SMS to the given phone number.

**Request:**
```json
{
  "phoneNumber": "+77001234567",
  "consentGiven": true
}
```

**Validation:**
- `phoneNumber`: E.164 format (e.g. `+77001234567`)
- `consentGiven`: must be `true`
- Rate limit: max 3 requests per phone per 10 minutes

**Response (dev-mode, mock provider):**
```json
{
  "status": "sent",
  "provider": "mock",
  "realSmsSent": false,
  "configured": false,
  "message": "SMS provider не настроен. Dev-mode: используйте код 000000."
}
```

**Response (real provider, Twilio):**
```json
{
  "status": "sent",
  "provider": "twilio",
  "realSmsSent": true,
  "configured": true,
  "requestId": "VE...",
  "message": "SMS OTP sent successfully."
}
```

**Error/status values:**
- `sent` — OTP dispatched (real or dev)
- `not_configured` — provider credentials missing
- `rate_limited` — 429 HTTP, too many requests
- `failed` — provider error

---

### `POST /api/telecom/otp/check`

Check the submitted OTP code.

**Request:**
```json
{
  "phoneNumber": "+77001234567",
  "code": "000000",
  "requestId": "VE..."
}
```

**Validation:**
- `phoneNumber`: E.164 format
- `code`: 4-8 digits
- `requestId`: optional string (required for Vonage)

**Response (approved, dev-mode):**
```json
{
  "status": "approved",
  "provider": "mock",
  "phoneVerified": true,
  "realVerification": false,
  "configured": false,
  "message": "Dev-mode verification complete",
  "identity": {
    "status": "verified",
    "provider": "mock",
    "verificationType": "dev_mode",
    "phoneVerified": true,
    "realSmsSent": false,
    "realVerification": false,
    "realNetworkCheck": false,
    "configured": false,
    "simSwapRisk": "unknown",
    "checkedAt": "2026-06-11T20:00:00.000Z",
    "phoneMasked": "+7700***4567"
  },
  "trust": {
    "trustScore": 35,
    "decision": "allow",
    "reasons": [
      "Dev-mode: OTP-код принят в режиме разработки (не реальная верификация) (+15).",
      "Номер телефона верифицирован (+20)."
    ]
  }
}
```

**Response (approved, real Twilio):**
```json
{
  "status": "approved",
  "provider": "twilio",
  "phoneVerified": true,
  "realVerification": true,
  "configured": true,
  "message": "Phone number verified by live SMS OTP.",
  "identity": {
    "verificationType": "sms_otp",
    "realVerification": true,
    "realNetworkCheck": false,
    ...
  },
  "trust": { "trustScore": 55, "decision": "allow", ... }
}
```

**Response (invalid code):**
```json
{
  "status": "invalid",
  "provider": "mock",
  "phoneVerified": false,
  "realVerification": false,
  "configured": false,
  "message": "Invalid code. Dev-mode: use code 000000."
}
```

**Status values (always HTTP 200 except rate_limit):**
- `approved` — code correct, includes `identity` + `trust` blocks
- `invalid` — wrong code
- `expired` — OTP expired or already used
- `not_configured` — provider not configured
- `failed` — provider error

---

### Updated Trust Score Table

| Signal | Points | Notes |
|---|---|---|
| Real network API check + verified | +50 | Only when `realNetworkCheck: true` (SIM/eSIM operator path) |
| Real SMS OTP approved | +35 | Only when `realVerification: true` (Twilio/Vonage/custom) |
| Dev-mode OTP code (mock) | +15 | Labeled dev-mode — not a real verification |
| Dev-mode network check (mock) | +25 | Labeled dev-mode — not a real check |
| `numberVerified: true` | +20 | |
| `deviceBound: true` | +10 | |
| `simSwapRisk: "low"` | +20 | |
| `simSwapRisk: "medium"` | — | Decision: `step_up` |
| `simSwapRisk: "high"` | — | Decision: `block` |
| `status: "risk_blocked"` | — | Decision: `block`, score 0 |
| `status: "not_configured"` | 30 | Decision: `allow` (demo labeled) |

**Non-stacking rule:** if both a network API bonus and an OTP bonus apply (which should not happen in normal flows but is guarded), only the higher bonus is counted.

---

### New Audit Event Types (OTP)

| Event | When |
|---|---|
| `OTP_SEND_REQUESTED` | Every `/api/telecom/otp/start` call |
| `OTP_SENT` | Provider returned 2xx + real SMS was sent |
| `OTP_SEND_FAILED` | Provider returned an error |
| `OTP_CHECK_REQUESTED` | Every `/api/telecom/otp/check` call |
| `OTP_VERIFIED` | Provider returned approved |
| `OTP_INVALID_CODE` | Provider returned invalid code |

Phone numbers are hashed (sha256 on server, FNV-1a on client). Raw numbers are never stored.

---

## Future Roadmap

1. **Carrier billing** — operator-direct payment, no card required.
2. **eSIM onboarding** — QR-based eSIM provisioning via operator API, distributed to users who join group deals.
3. **White-label embedding** — telecom identity layer as an SDK embeddable in operator super-apps (Beeline.kz, Kcell app, etc.).
4. **Cross-operator federation** — GSMA Open Gateway network of networks for pan-KZ coverage.
5. **Regulatory compliance** — GDPR/KZ data localization with operator-certified identity tokens.

---

## How to Pitch to Judges

**Allowed phrases (accurate):**
- "Production-ready telecom identity layer — plug in GSMA Open Gateway, Vonage, or a KZ operator Network API and it works."
- "Ready for GSMA/Open Gateway, Vonage, or operator Network API — credentials required."
- "Currently in dev-mode because provider credentials are not configured — this is intentional for the hackathon demo."
- "The architecture enforces: 1 SIM = 1 trusted group slot."

**Forbidden claims:**
- ~~"Real SIM verified"~~ — only say this when `realNetworkCheck: true` in a production deployment.
- ~~"We verified your SIM card"~~ — only truthful when a real operator API call was made.
- ~~"Production-grade identity"~~ — correct only when `configured: true` and `realNetworkCheck: true`.

**Demo script suggestion:**

> "In this demo, telecom verification runs in dev-mode because we don't have live operator credentials here.  The architecture is complete and production-ready — you can see the trust score, the SIM swap risk model, and the audit trail.  With a Beeline or Kcell Network API key, this becomes real SIM-bound identity in the same codebase, zero changes required."
