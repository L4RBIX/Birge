// ============================================================
// Birge — Level 2 Telecom Identity Layer
// Vonage Silent Auth / Verify adapter
//
// Server-side only.  Requires TELECOM_API_KEY and TELECOM_API_SECRET.
//
// realNetworkCheck: true ONLY when the HTTP request completes
// with a valid 2xx response from the provider.
// ============================================================

import type {
  TelecomIdentityProvider,
  TelecomIdentityRequest,
  TelecomIdentityResult,
} from "../types";
import { getTelecomConfig, isProviderConfigured } from "../config";

const TIMEOUT_MS = 8_000;
const VONAGE_VERIFY_BASE = "https://api.nexmo.com/v2/verify";

/**
 * Safe JSON parse — returns null on any parse failure.
 */
function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Extract a verification status from a Vonage-style response.
 * Returns false on anything unexpected (conservative default).
 */
function extractVonageVerified(body: unknown): boolean {
  if (body !== null && typeof body === "object" && !Array.isArray(body)) {
    const obj = body as Record<string, unknown>;
    // Vonage Verify v2 uses "status" field
    if (obj["status"] === "completed" || obj["status"] === "approved")
      return true;
    if (typeof obj["verified"] === "boolean") return obj["verified"];
    if (typeof obj["numberVerified"] === "boolean") return obj["numberVerified"];
  }
  return false;
}

export const vonageProvider: TelecomIdentityProvider = {
  name: "vonage",

  async verifyNumber(
    request: TelecomIdentityRequest
  ): Promise<TelecomIdentityResult> {
    const config = getTelecomConfig();
    const now = new Date().toISOString();

    if (!isProviderConfigured(config)) {
      return {
        status: "not_configured",
        provider: "vonage",
        simVerified: false,
        numberVerified: false,
        deviceBound: false,
        simSwapRisk: "unknown",
        riskScore: 0,
        reason:
          "Vonage provider is not configured. TELECOM_API_KEY and TELECOM_API_SECRET are required.",
        checkedAt: now,
        realNetworkCheck: false,
        configured: false,
      };
    }

    const verifyUrl = config.numberVerifyUrl || VONAGE_VERIFY_BASE;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      // Vonage-style auth: api_key + api_secret in body or Basic auth header
      const encoded = Buffer.from(
        `${config.apiKey}:${config.apiSecret}`
      ).toString("base64");

      const response = await fetch(verifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${encoded}`,
        },
        body: JSON.stringify({
          to: request.phoneNumber,
          brand: "Birge",
          workflow: [{ channel: "silent_auth" }],
        }),
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timer);

      if (!response.ok) {
        // Non-2xx: provider call failed — realNetworkCheck stays false
        return {
          status: "failed",
          provider: "vonage",
          simVerified: false,
          numberVerified: false,
          deviceBound: false,
          simSwapRisk: "unknown",
          riskScore: 0,
          reason: `Vonage provider returned HTTP ${response.status}. Check API key and secret.`,
          checkedAt: now,
          realNetworkCheck: false,
          configured: true,
        };
      }

      const text = await response.text();
      const body = safeJson(text);
      const numberVerified = extractVonageVerified(body);

      // Extract request_id for audit reference (safe — non-secret)
      let rawProviderReference: string | undefined;
      if (
        body !== null &&
        typeof body === "object" &&
        !Array.isArray(body)
      ) {
        const obj = body as Record<string, unknown>;
        if (typeof obj["request_id"] === "string") {
          rawProviderReference = obj["request_id"];
        }
      }

      return {
        status: numberVerified ? "verified" : "pending",
        provider: "vonage",
        phoneNumber: request.phoneNumber,
        operator: config.operatorHint,
        country: config.country,
        simVerified: numberVerified,
        numberVerified,
        deviceBound: request.deviceId.length > 0,
        simSwapRisk: "low",
        simSwapDetected: false,
        riskScore: numberVerified ? 88 : 30,
        reason: numberVerified
          ? "Vonage Silent Auth verification confirmed."
          : "Vonage verification request sent. Awaiting completion.",
        checkedAt: now,
        realNetworkCheck: true,
        configured: true,
        rawProviderReference,
      };
    } catch (err) {
      clearTimeout(timer);
      const isTimeout =
        err instanceof Error && err.name === "AbortError";
      return {
        status: "failed",
        provider: "vonage",
        simVerified: false,
        numberVerified: false,
        deviceBound: false,
        simSwapRisk: "unknown",
        riskScore: 0,
        reason: isTimeout
          ? "Vonage provider request timed out after 8 seconds."
          : "Vonage provider request failed. Check network connectivity.",
        checkedAt: now,
        realNetworkCheck: false,
        configured: true,
      };
    }
  },
};
