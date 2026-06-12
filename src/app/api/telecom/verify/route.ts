// ============================================================
// Birge — Level 2 Telecom Identity Layer
// POST /api/telecom/verify
//
// Validates input, calls the active telecom provider, records
// audit events, and returns a sanitized response.
//
// Never returns secrets or raw provider payloads.
// Phone number in response is always masked.
// ============================================================

import { getTelecomProvider } from "@/lib/telecom/provider";
import { calculateCommerceTrustScore } from "@/lib/telecom/risk";
import {
  recordAuditEvent,
  buildAuditEvent,
  maskPhone,
} from "@/lib/telecom/audit";
import type { TelecomIdentityResult } from "@/lib/telecom/types";

// KZ-friendly E.164: +7 followed by 10 digits (covers KZ 700-771 ranges)
// Also accepts international numbers in +XXXXXXXX format (7-15 digits after +)
const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

interface VerifyRequestBody {
  phoneNumber?: unknown;
  deviceId?: unknown;
  consentGiven?: unknown;
}

export async function POST(request: Request): Promise<Response> {
  let body: VerifyRequestBody;

  try {
    body = (await request.json()) as VerifyRequestBody;
  } catch {
    return Response.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  // ── Validation ──────────────────────────────────────────

  if (typeof body.phoneNumber !== "string" || !PHONE_REGEX.test(body.phoneNumber)) {
    return Response.json(
      {
        error:
          "Invalid phone number. Must be E.164 format (e.g. +77001234567).",
      },
      { status: 400 }
    );
  }

  if (body.consentGiven !== true) {
    return Response.json(
      {
        error:
          "consentGiven must be true. User consent is required for telecom identity verification.",
      },
      { status: 400 }
    );
  }

  const phoneNumber = body.phoneNumber;
  const deviceId =
    typeof body.deviceId === "string" ? body.deviceId : "";

  // ── Extract request metadata ─────────────────────────────

  const userAgent = request.headers.get("user-agent") ?? undefined;
  const ipAddress =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    undefined;

  // ── Call provider ────────────────────────────────────────

  const provider = getTelecomProvider();

  // Audit: requested
  recordAuditEvent(
    buildAuditEvent("TELECOM_VERIFY_REQUESTED", {
      phone: phoneNumber,
      deviceId,
      provider: provider.name,
      realNetworkCheck: false,
    })
  );

  const result: TelecomIdentityResult = await provider.verifyNumber({
    phoneNumber,
    deviceId,
    userAgent,
    ipAddress,
    consentGiven: true,
  });

  const trust = calculateCommerceTrustScore(result);

  // ── Audit: outcome ───────────────────────────────────────

  if (result.status === "verified" || result.status === "pending") {
    recordAuditEvent(
      buildAuditEvent("TELECOM_VERIFY_SUCCESS", {
        phone: phoneNumber,
        deviceId,
        provider: result.provider,
        realNetworkCheck: result.realNetworkCheck,
        riskScore: trust.trustScore,
        decision: trust.decision,
      })
    );
  } else if (result.status === "not_configured") {
    recordAuditEvent(
      buildAuditEvent("TELECOM_VERIFY_NOT_CONFIGURED", {
        phone: phoneNumber,
        deviceId,
        provider: result.provider,
        realNetworkCheck: false,
      })
    );
  }

  if (result.simSwapRisk === "high") {
    recordAuditEvent(
      buildAuditEvent("SIM_SWAP_RISK_HIGH", {
        phone: phoneNumber,
        deviceId,
        provider: result.provider,
        realNetworkCheck: result.realNetworkCheck,
        decision: "block",
      })
    );
  }

  // ── Sanitize response ────────────────────────────────────
  // - Mask phone number
  // - Remove rawProviderReference (may contain internal IDs — safe but
  //   we omit it to keep the surface small; include only when verified)
  // - Never include any credentials or secrets

  const sanitized = {
    status: result.status,
    provider: result.provider,
    phoneNumber: maskPhone(phoneNumber),
    operator: result.operator,
    country: result.country,
    simVerified: result.simVerified,
    numberVerified: result.numberVerified,
    deviceBound: result.deviceBound,
    simSwapRisk: result.simSwapRisk,
    simSwapDetected: result.simSwapDetected,
    riskScore: result.riskScore,
    reason: result.reason,
    checkedAt: result.checkedAt,
    realNetworkCheck: result.realNetworkCheck,
    configured: result.configured,
    trust: {
      trustScore: trust.trustScore,
      decision: trust.decision,
      reasons: trust.reasons,
    },
  };

  return Response.json(sanitized);
}
