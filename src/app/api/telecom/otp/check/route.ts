// ============================================================
// Birge — SMS OTP Layer
// POST /api/telecom/otp/check
//
// Checks the submitted OTP code against the active provider.
// On approved: returns updated telecom identity payload + trust score.
// On invalid:  returns 200 with status "invalid" (valid check result).
//
// Never returns secrets or raw phone numbers.
// ============================================================

import { getOtpProvider } from "@/lib/telecom/otp/provider";
import { calculateCommerceTrustScore } from "@/lib/telecom/risk";
import {
  recordAuditEvent,
  buildAuditEvent,
  maskPhone,
} from "@/lib/telecom/audit";

// KZ-friendly E.164: + followed by 7-15 digits
const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;
// OTP code: 4-8 digits
const CODE_REGEX = /^\d{4,8}$/;

// ────────────────────────────────────────────────────────────

interface CheckRequestBody {
  phoneNumber?: unknown;
  code?: unknown;
  requestId?: unknown;
}

export async function POST(request: Request): Promise<Response> {
  let body: CheckRequestBody;

  try {
    body = (await request.json()) as CheckRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // ── Validation ──────────────────────────────────────────

  if (
    typeof body.phoneNumber !== "string" ||
    !PHONE_REGEX.test(body.phoneNumber)
  ) {
    return Response.json(
      {
        error:
          "Invalid phone number. Must be E.164 format (e.g. +77001234567).",
      },
      { status: 400 }
    );
  }

  if (typeof body.code !== "string" || !CODE_REGEX.test(body.code)) {
    return Response.json(
      {
        error: "Invalid code. Must be 4-8 digits.",
      },
      { status: 400 }
    );
  }

  const phoneNumber = body.phoneNumber;
  const code = body.code;
  const requestId =
    typeof body.requestId === "string" ? body.requestId : undefined;

  // ── Get provider ─────────────────────────────────────────

  const provider = getOtpProvider();

  // ── Audit: requested ────────────────────────────────────

  recordAuditEvent(
    buildAuditEvent("OTP_CHECK_REQUESTED", {
      phone: phoneNumber,
      provider: provider.name,
      realNetworkCheck: false,
    })
  );

  // ── Call provider ────────────────────────────────────────

  const result = await provider.checkOtp({ phoneNumber, code, requestId });

  // ── Audit: outcome ───────────────────────────────────────

  if (result.status === "approved") {
    // Build a synthetic TelecomIdentityResult for trust scoring.
    // We use status "pending" (not "verified") so the network-API bonus is 0
    // and only the OTP context bonus (passed as second arg) applies.
    const mockTelecomResult = {
      status: "pending" as const,
      provider: "mock" as const,
      simVerified: false,
      numberVerified: result.phoneVerified,
      deviceBound: false,
      simSwapRisk: "unknown" as const,
      riskScore: 0,
      reason: "",
      checkedAt: new Date().toISOString(),
      realNetworkCheck: false,
      configured: result.configured,
    };

    const trust = calculateCommerceTrustScore(mockTelecomResult, {
      verified: result.phoneVerified,
      realVerification: result.realVerification,
    });

    recordAuditEvent(
      buildAuditEvent("OTP_VERIFIED", {
        phone: phoneNumber,
        provider: provider.name,
        realNetworkCheck: false,
        riskScore: trust.trustScore,
        decision: trust.decision,
      })
    );

    // ── Build identity payload for client ──────────────────
    const now = new Date().toISOString();
    const verificationType = result.realVerification ? "sms_otp" : "dev_mode";

    const identity = {
      status: "verified",
      provider: provider.name,
      verificationType,
      phoneVerified: true,
      realSmsSent: result.realVerification,
      realVerification: result.realVerification,
      // SMS OTP is NOT a silent network check — always false here
      realNetworkCheck: false,
      configured: result.configured,
      simSwapRisk: "unknown",
      checkedAt: now,
      phoneMasked: maskPhone(phoneNumber),
    };

    return Response.json({
      status: result.status,
      provider: result.provider,
      phoneVerified: result.phoneVerified,
      realVerification: result.realVerification,
      configured: result.configured,
      message: result.message,
      identity,
      trust: {
        trustScore: trust.trustScore,
        decision: trust.decision,
        reasons: trust.reasons,
      },
    });
  }

  if (result.status === "invalid") {
    recordAuditEvent(
      buildAuditEvent("OTP_INVALID_CODE", {
        phone: phoneNumber,
        provider: provider.name,
        realNetworkCheck: false,
      })
    );
  }

  // Return 200 for all non-error statuses (invalid, expired, not_configured)
  // These are valid check outcomes, not HTTP errors
  return Response.json({
    status: result.status,
    provider: result.provider,
    phoneVerified: false,
    realVerification: false,
    configured: result.configured,
    message: result.message,
  });
}
