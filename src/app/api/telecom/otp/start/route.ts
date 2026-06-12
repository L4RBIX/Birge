// ============================================================
// Birge — SMS OTP Layer
// POST /api/telecom/otp/start
//
// Starts an OTP flow for the given phone number.
// Validates consent, rate-limits, calls the active OTP provider,
// records audit events, and returns a sanitized response.
//
// Never returns secrets or raw phone numbers.
// ============================================================

import { getOtpProvider } from "@/lib/telecom/otp/provider";
import {
  recordAuditEvent,
  buildAuditEvent,
  hashIdentifier,
} from "@/lib/telecom/audit";

// KZ-friendly E.164: + followed by 7-15 digits
const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

// ── In-memory rate limiter ────────────────────────────────────
// Max 3 start requests per hashed phone per 10 minutes
// Stored in globalThis to survive Next.js dev hot-reloads

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

declare global {
  var __birge_otp_rate_limit: Map<string, RateLimitEntry> | undefined;
}

function getRateLimitMap(): Map<string, RateLimitEntry> {
  if (!globalThis.__birge_otp_rate_limit) {
    globalThis.__birge_otp_rate_limit = new Map();
  }
  return globalThis.__birge_otp_rate_limit;
}

function checkAndIncrementRateLimit(phoneHash: string): boolean {
  const map = getRateLimitMap();
  const now = Date.now();
  const entry = map.get(phoneHash);

  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    // New window
    map.set(phoneHash, { count: 1, windowStart: now });
    return true; // allowed
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false; // rate limited
  }

  entry.count += 1;
  return true; // allowed
}

// ────────────────────────────────────────────────────────────

interface StartRequestBody {
  phoneNumber?: unknown;
  consentGiven?: unknown;
}

export async function POST(request: Request): Promise<Response> {
  let body: StartRequestBody;

  try {
    body = (await request.json()) as StartRequestBody;
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

  if (body.consentGiven !== true) {
    return Response.json(
      {
        error:
          "consentGiven must be true. User consent is required for SMS OTP verification.",
      },
      { status: 400 }
    );
  }

  const phoneNumber = body.phoneNumber;
  const phoneHash = hashIdentifier(phoneNumber);

  // ── Rate limiting ────────────────────────────────────────

  const allowed = checkAndIncrementRateLimit(phoneHash);
  if (!allowed) {
    return Response.json(
      {
        status: "rate_limited",
        message:
          "Too many OTP requests for this phone number. Please wait 10 minutes before trying again.",
      },
      { status: 429 }
    );
  }

  // ── Get provider ─────────────────────────────────────────

  const provider = getOtpProvider();

  // ── Audit: requested ────────────────────────────────────

  recordAuditEvent(
    buildAuditEvent("OTP_SEND_REQUESTED", {
      phone: phoneNumber,
      provider: provider.name,
      realNetworkCheck: false,
    })
  );

  // ── Call provider ────────────────────────────────────────

  const result = await provider.startOtp({
    phoneNumber,
    channel: "sms",
    consentGiven: true,
  });

  // ── Audit: outcome ───────────────────────────────────────

  if (result.status === "sent" && result.realSmsSent) {
    recordAuditEvent(
      buildAuditEvent("OTP_SENT", {
        phone: phoneNumber,
        provider: provider.name,
        realNetworkCheck: false,
      })
    );
  } else if (result.status === "failed") {
    recordAuditEvent(
      buildAuditEvent("OTP_SEND_FAILED", {
        phone: phoneNumber,
        provider: provider.name,
        realNetworkCheck: false,
      })
    );
  }

  // ── Sanitize response ────────────────────────────────────
  // Never echo raw phone number — use masked form
  // Never include requestId in failure cases (nothing to reference)
  // Never include secrets

  const sanitized: Record<string, unknown> = {
    status: result.status,
    provider: result.provider,
    realSmsSent: result.realSmsSent,
    configured: result.configured,
    message: result.message,
  };

  if (result.status === "sent" && result.requestId) {
    sanitized.requestId = result.requestId;
  }

  return Response.json(sanitized);
}
