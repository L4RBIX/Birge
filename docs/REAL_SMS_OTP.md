# Real SMS OTP Activation

This project already supports live phone verification through SMS OTP. It does not silently verify SIM/eSIM ownership unless operator Network API credentials are configured.

Required final wording:

> Live phone verification works through SMS OTP when provider credentials are configured. Silent SIM/eSIM Network API verification is production-ready and can replace OTP once operator credentials are available.

## Providers

Choose exactly one OTP provider in `.env.local`.

### Twilio Verify v2

```bash
TELECOM_OTP_PROVIDER=twilio
TELECOM_OTP_ENABLED=true
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_VERIFY_SERVICE_SID=VA...
```

Real SMS is considered sent only when Twilio returns a successful response from `POST /Verifications`. `realSmsSent` stays `false` on missing credentials, HTTP errors, timeouts, or rate limits.

Real verification is considered approved only when Twilio returns `status: "approved"` from `VerificationCheck`.

### Vonage Verify

```bash
TELECOM_OTP_PROVIDER=vonage
TELECOM_OTP_ENABLED=true
VONAGE_API_KEY=...
VONAGE_API_SECRET=...
VONAGE_BRAND_NAME=Birge
```

Real SMS is considered sent only when Vonage returns JSON `status: "0"` from the verify start endpoint. Vonage check requires the `requestId` returned by start.

Real verification is considered approved only when Vonage returns JSON `status: "0"` from the check endpoint.

### Custom Provider

```bash
TELECOM_OTP_PROVIDER=custom
TELECOM_OTP_ENABLED=true
CUSTOM_OTP_SEND_URL=https://your-provider.example/send
CUSTOM_OTP_CHECK_URL=https://your-provider.example/check
CUSTOM_OTP_API_KEY=optional-secret
```

The custom send endpoint receives:

```json
{ "phoneNumber": "+77001234567", "channel": "sms" }
```

The custom check endpoint receives:

```json
{ "phoneNumber": "+77001234567", "code": "123456", "requestId": "optional" }
```

When `CUSTOM_OTP_API_KEY` is present, the app sends it as `x-api-key`. The key is server-only and must never be exposed to client code.

## Local Activation

1. Copy `.env.example` to `.env.local`.
2. Set one real provider block above.
3. Restart `npm run dev`; Next.js reads `.env.local` at server startup.
4. Open `/onboarding`, enter a Kazakhstan-format phone number, and request OTP.
5. The green live panel appears only after the real provider approves the submitted code.

Optional strict QA setting:

```bash
TELECOM_DEV_MODE=false
```

This makes it easier to catch accidental dependence on mock behavior. It does not disable the real SMS OTP provider.

## API Verification

Start the app:

```bash
npm run dev -- --port 3003
```

Check sanitized provider status:

```bash
curl http://localhost:3003/api/telecom/status
```

Expected when Twilio is configured:

```json
{
  "otp": {
    "provider": "twilio",
    "enabled": true,
    "configured": true,
    "capability": "sms_otp"
  }
}
```

Start OTP:

```bash
curl -X POST http://localhost:3003/api/telecom/otp/start \
  -H "content-type: application/json" \
  -d '{"phoneNumber":"+77001234567","consentGiven":true}'
```

Expected real SMS success shape:

```json
{
  "status": "sent",
  "provider": "twilio",
  "realSmsSent": true,
  "configured": true,
  "requestId": "provider-request-id",
  "message": "SMS OTP sent successfully."
}
```

Check OTP:

```bash
curl -X POST http://localhost:3003/api/telecom/otp/check \
  -H "content-type: application/json" \
  -d '{"phoneNumber":"+77001234567","code":"123456","requestId":"provider-request-id"}'
```

Expected real verification success shape:

```json
{
  "status": "approved",
  "provider": "twilio",
  "phoneVerified": true,
  "realVerification": true,
  "configured": true,
  "identity": {
    "verificationType": "sms_otp",
    "realSmsSent": true,
    "realVerification": true,
    "realNetworkCheck": false
  }
}
```

## Verifier Script

With the app running:

```bash
npm run otp:verify -- +77001234567
```

The script starts OTP, prompts for the received code, checks the code, and exits non-zero unless `realSmsSent:true` and `realVerification:true` are both returned by the API.

For non-interactive checks:

```bash
OTP_CODE=123456 npm run otp:verify -- +77001234567
```

Use `OTP_BASE_URL` when the app is not on port 3000:

```bash
OTP_BASE_URL=http://localhost:3003 npm run otp:verify -- +77001234567
```

## Security Notes

- `.env.local` is gitignored.
- OTP secrets are read only in server route/provider code.
- API responses return sanitized status, provider names, request IDs, booleans, and messages only.
- Raw phone numbers are not stored in audit events; the server audit buffer stores phone hashes.
- Do not hardcode `realSmsSent:true` or `realVerification:true`; those flags must come from provider success branches.
