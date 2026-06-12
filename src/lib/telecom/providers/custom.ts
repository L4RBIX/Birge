// ============================================================
// Birge — Level 2 Telecom Identity Layer
// Generic / custom operator adapter
//
// Server-side only.  Requires TELECOM_NUMBER_VERIFY_URL and at
// least one auth credential (TELECOM_API_KEY or TELECOM_CLIENT_ID).
//
// Accepts any JSON response; conservatively defaults on unknown fields.
// realNetworkCheck: true ONLY on a real 2xx provider response.
// ============================================================

import type {
  TelecomIdentityProvider,
  TelecomIdentityRequest,
  TelecomIdentityResult,
} from "../types";
import { getTelecomConfig, isProviderConfigured } from "../config";

const TIMEOUT_MS = 8_000;

/** Safe JSON parse — returns null on any parse failure. */
function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Build auth headers from whatever credentials are present. */
function buildAuthHeaders(
  apiKey: string,
  clientId: string,
  clientSecret: string
): Record<string, string> {
  const headers: Record<string, string> = {};

  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  if (clientId && clientSecret) {
    const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64"
    );
    headers["Authorization"] = `Basic ${encoded}`;
  } else if (clientId) {
    headers["Authorization"] = `Bearer ${clientId}`;
  }

  return headers;
}

/**
 * Extract verified boolean from an unknown operator response.
 * Conservative: defaults to false unless a clear positive signal.
 */
function extractVerified(body: unknown): boolean {
  if (body !== null && typeof body === "object" && !Array.isArray(body)) {
    const obj = body as Record<string, unknown>;
    if (typeof obj["verified"] === "boolean") return obj["verified"];
    if (typeof obj["numberVerified"] === "boolean") return obj["numberVerified"];
    if (typeof obj["success"] === "boolean") return obj["success"];
    if (obj["result"] === "match" || obj["result"] === "verified") return true;
  }
  return false;
}

/**
 * Extract simSwapRisk from an unknown operator response.
 * Conservative: defaults to "unknown".
 */
function extractSimSwapRisk(
  body: unknown
): "low" | "medium" | "high" | "unknown" {
  if (body !== null && typeof body === "object" && !Array.isArray(body)) {
    const obj = body as Record<string, unknown>;
    const raw = obj["simSwapRisk"] ?? obj["risk"] ?? obj["riskLevel"];
    if (raw === "low" || raw === "medium" || raw === "high") return raw;
  }
  return "unknown";
}

/**
 * Extract optional operator name from response.
 */
function extractOperator(body: unknown): string | undefined {
  if (body !== null && typeof body === "object" && !Array.isArray(body)) {
    const obj = body as Record<string, unknown>;
    const raw = obj["operator"] ?? obj["carrier"] ?? obj["network"];
    if (typeof raw === "string" && raw.length > 0) return raw;
  }
  return undefined;
}

export const customProvider: TelecomIdentityProvider = {
  name: "custom",

  async verifyNumber(
    request: TelecomIdentityRequest
  ): Promise<TelecomIdentityResult> {
    const config = getTelecomConfig();
    const now = new Date().toISOString();

    if (!isProviderConfigured(config)) {
      return {
        status: "not_configured",
        provider: "custom",
        simVerified: false,
        numberVerified: false,
        deviceBound: false,
        simSwapRisk: "unknown",
        riskScore: 0,
        reason:
          "Custom provider is not configured. TELECOM_NUMBER_VERIFY_URL and at least one auth credential are required.",
        checkedAt: now,
        realNetworkCheck: false,
        configured: false,
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const authHeaders = buildAuthHeaders(
        config.apiKey,
        config.clientId,
        config.clientSecret
      );

      const response = await fetch(config.numberVerifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          phoneNumber: request.phoneNumber,
          deviceId: request.deviceId,
        }),
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timer);

      if (!response.ok) {
        return {
          status: "failed",
          provider: "custom",
          simVerified: false,
          numberVerified: false,
          deviceBound: false,
          simSwapRisk: "unknown",
          riskScore: 0,
          reason: `Custom operator returned HTTP ${response.status}. Check endpoint and credentials.`,
          checkedAt: now,
          realNetworkCheck: false,
          configured: true,
        };
      }

      const text = await response.text();
      const body = safeJson(text);

      const numberVerified = extractVerified(body);
      const simSwapRisk = extractSimSwapRisk(body);
      const operator = extractOperator(body) ?? config.operatorHint;

      return {
        status: numberVerified ? "verified" : "failed",
        provider: "custom",
        phoneNumber: request.phoneNumber,
        operator,
        country: config.country,
        simVerified: numberVerified,
        numberVerified,
        deviceBound: request.deviceId.length > 0,
        simSwapRisk,
        simSwapDetected: simSwapRisk === "high",
        riskScore: numberVerified ? 80 : 10,
        reason: numberVerified
          ? "Custom operator number verification confirmed."
          : "Custom operator could not verify this phone number.",
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
        provider: "custom",
        simVerified: false,
        numberVerified: false,
        deviceBound: false,
        simSwapRisk: "unknown",
        riskScore: 0,
        reason: isTimeout
          ? "Custom operator request timed out after 8 seconds."
          : "Custom operator request failed. Check network connectivity and endpoint.",
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
        provider: "custom",
        simVerified: false,
        numberVerified: false,
        deviceBound: false,
        simSwapRisk: "unknown",
        riskScore: 0,
        reason: "SIM swap URL not configured. Set TELECOM_SIM_SWAP_URL.",
        checkedAt: now,
        realNetworkCheck: false,
        configured: false,
      };
    }

    const authHeaders = buildAuthHeaders(
      config.apiKey,
      config.clientId,
      config.clientSecret
    );
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(config.simSwapUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ phoneNumber: request.phoneNumber }),
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timer);

      if (!response.ok) {
        return {
          status: "failed",
          provider: "custom",
          simVerified: false,
          numberVerified: false,
          deviceBound: false,
          simSwapRisk: "unknown",
          riskScore: 0,
          reason: `Custom SIM swap check returned HTTP ${response.status}.`,
          checkedAt: now,
          realNetworkCheck: false,
          configured: true,
        };
      }

      const text = await response.text();
      const body = safeJson(text);
      const simSwapRisk = extractSimSwapRisk(body);
      const swapped = simSwapRisk === "high";

      return {
        status: swapped ? "risk_blocked" : "verified",
        provider: "custom",
        phoneNumber: request.phoneNumber,
        operator: config.operatorHint,
        country: config.country,
        simVerified: !swapped,
        numberVerified: !swapped,
        deviceBound: request.deviceId.length > 0,
        simSwapRisk,
        simSwapDetected: swapped,
        riskScore: swapped ? 5 : 80,
        reason: swapped
          ? "SIM swap detected by custom operator. Deals frozen until re-verification."
          : "No SIM swap detected by custom operator.",
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
        provider: "custom",
        simVerified: false,
        numberVerified: false,
        deviceBound: false,
        simSwapRisk: "unknown",
        riskScore: 0,
        reason: isTimeout
          ? "Custom SIM swap check timed out after 8 seconds."
          : "Custom SIM swap check failed.",
        checkedAt: now,
        realNetworkCheck: false,
        configured: true,
      };
    }
  },
};
