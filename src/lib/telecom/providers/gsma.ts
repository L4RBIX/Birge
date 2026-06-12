// ============================================================
// Birge — Level 2 Telecom Identity Layer
// GSMA Open Gateway / CAMARA-style Number Verification adapter
//
// Server-side only.  Requires TELECOM_NUMBER_VERIFY_URL,
// TELECOM_CLIENT_ID, and TELECOM_CLIENT_SECRET.
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

/** Build a Basic auth header value from clientId:clientSecret */
function basicAuth(clientId: string, clientSecret: string): string {
  const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );
  return `Basic ${encoded}`;
}

/**
 * Safe JSON parse — returns null on any parse failure so we
 * never crash on unexpected provider responses.
 */
function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Extract a boolean `verified` field from an unknown CAMARA-style response.
 * Returns false on anything unexpected (conservative default).
 */
function extractVerified(body: unknown): boolean {
  if (body !== null && typeof body === "object" && !Array.isArray(body)) {
    const obj = body as Record<string, unknown>;
    if (typeof obj["numberVerified"] === "boolean") return obj["numberVerified"];
    if (typeof obj["verified"] === "boolean") return obj["verified"];
    if (typeof obj["phoneNumberVerified"] === "boolean")
      return obj["phoneNumberVerified"];
  }
  return false;
}

export const gsmaProvider: TelecomIdentityProvider = {
  name: "gsma",

  async verifyNumber(
    request: TelecomIdentityRequest
  ): Promise<TelecomIdentityResult> {
    const config = getTelecomConfig();
    const now = new Date().toISOString();

    if (!isProviderConfigured(config)) {
      return {
        status: "not_configured",
        provider: "gsma",
        simVerified: false,
        numberVerified: false,
        deviceBound: false,
        simSwapRisk: "unknown",
        riskScore: 0,
        reason:
          "GSMA provider is not configured. TELECOM_NUMBER_VERIFY_URL, TELECOM_CLIENT_ID, and TELECOM_CLIENT_SECRET are required.",
        checkedAt: now,
        realNetworkCheck: false,
        configured: false,
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      // CAMARA Number Verification API: POST with phone number in E.164 format
      const response = await fetch(config.numberVerifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: basicAuth(config.clientId, config.clientSecret),
          "X-Correlator": crypto.randomUUID(),
        },
        body: JSON.stringify({ phoneNumber: request.phoneNumber }),
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timer);

      if (!response.ok) {
        // Non-2xx: provider call failed — realNetworkCheck stays false
        return {
          status: "failed",
          provider: "gsma",
          simVerified: false,
          numberVerified: false,
          deviceBound: false,
          simSwapRisk: "unknown",
          riskScore: 0,
          reason: `GSMA provider returned HTTP ${response.status}. Check credentials and endpoint URL.`,
          checkedAt: now,
          realNetworkCheck: false,
          configured: true,
        };
      }

      // 2xx response — parse safely, never dump raw body
      const text = await response.text();
      const body = safeJson(text);
      const numberVerified = extractVerified(body);

      return {
        status: numberVerified ? "verified" : "failed",
        provider: "gsma",
        phoneNumber: request.phoneNumber,
        operator: config.operatorHint,
        country: config.country,
        simVerified: numberVerified,
        numberVerified,
        deviceBound: request.deviceId.length > 0,
        simSwapRisk: "low",
        simSwapDetected: false,
        riskScore: numberVerified ? 90 : 10,
        reason: numberVerified
          ? "GSMA Open Gateway Number Verification confirmed."
          : "GSMA provider could not verify this phone number.",
        checkedAt: now,
        realNetworkCheck: true,
        configured: true,
      };
    } catch (err) {
      clearTimeout(timer);
      const isTimeout =
        err instanceof Error && err.name === "AbortError";
      return {
        status: "failed",
        provider: "gsma",
        simVerified: false,
        numberVerified: false,
        deviceBound: false,
        simSwapRisk: "unknown",
        riskScore: 0,
        reason: isTimeout
          ? "GSMA provider request timed out after 8 seconds."
          : "GSMA provider request failed. Check network connectivity and endpoint.",
        checkedAt: now,
        realNetworkCheck: false,
        configured: true,
      };
    }
  },

  async checkSimSwap(
    request: TelecomIdentityRequest
  ): Promise<TelecomIdentityResult> {
    const config = getTelecomConfig();
    const now = new Date().toISOString();

    if (!config.simSwapUrl) {
      return {
        status: "not_configured",
        provider: "gsma",
        simVerified: false,
        numberVerified: false,
        deviceBound: false,
        simSwapRisk: "unknown",
        riskScore: 0,
        reason:
          "SIM swap check not configured. Set TELECOM_SIM_SWAP_URL to enable.",
        checkedAt: now,
        realNetworkCheck: false,
        configured: false,
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(config.simSwapUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: basicAuth(config.clientId, config.clientSecret),
          "X-Correlator": crypto.randomUUID(),
        },
        body: JSON.stringify({ phoneNumber: request.phoneNumber }),
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timer);

      if (!response.ok) {
        return {
          status: "failed",
          provider: "gsma",
          simVerified: false,
          numberVerified: false,
          deviceBound: false,
          simSwapRisk: "unknown",
          riskScore: 0,
          reason: `GSMA SIM swap check returned HTTP ${response.status}.`,
          checkedAt: now,
          realNetworkCheck: false,
          configured: true,
        };
      }

      const text = await response.text();
      const body = safeJson(text);

      let swapped = false;
      let risk: "low" | "medium" | "high" | "unknown" = "unknown";

      if (body !== null && typeof body === "object" && !Array.isArray(body)) {
        const obj = body as Record<string, unknown>;
        if (typeof obj["swapped"] === "boolean") swapped = obj["swapped"];
        if (typeof obj["simSwapped"] === "boolean") swapped = obj["simSwapped"];
        const rawRisk = obj["riskLevel"] ?? obj["risk"];
        if (rawRisk === "low" || rawRisk === "medium" || rawRisk === "high") {
          risk = rawRisk;
        } else {
          risk = swapped ? "high" : "low";
        }
      }

      return {
        status: swapped ? "risk_blocked" : "verified",
        provider: "gsma",
        phoneNumber: request.phoneNumber,
        operator: config.operatorHint,
        country: config.country,
        simVerified: !swapped,
        numberVerified: !swapped,
        deviceBound: request.deviceId.length > 0,
        simSwapRisk: risk,
        simSwapDetected: swapped,
        riskScore: swapped ? 10 : 85,
        reason: swapped
          ? "SIM swap detected. Active deals frozen until re-verification."
          : "No SIM swap detected.",
        checkedAt: now,
        realNetworkCheck: true,
        configured: true,
      };
    } catch (err) {
      clearTimeout(timer);
      const isTimeout =
        err instanceof Error && err.name === "AbortError";
      return {
        status: "failed",
        provider: "gsma",
        simVerified: false,
        numberVerified: false,
        deviceBound: false,
        simSwapRisk: "unknown",
        riskScore: 0,
        reason: isTimeout
          ? "GSMA SIM swap check timed out after 8 seconds."
          : "GSMA SIM swap check failed.",
        checkedAt: now,
        realNetworkCheck: false,
        configured: true,
      };
    }
  },
};
