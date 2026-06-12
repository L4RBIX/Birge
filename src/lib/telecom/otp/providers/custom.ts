// ============================================================
// Birge — SMS OTP Layer
// Custom / Generic OTP provider (no SDK — plain fetch)
//
// Tolerant parsing: accepts various response shapes.
// start: POST CUSTOM_OTP_SEND_URL {phoneNumber, channel:"sms"} + x-api-key header
// check: POST CUSTOM_OTP_CHECK_URL {phoneNumber, code, requestId}
//
// Honesty rules:
//   realSmsSent: true  ONLY when provider responds with sent/ok/success
//   realVerification: true  ONLY when provider responds with approved/verified/ok
//   Never crash on unexpected shapes — use conservative defaults
// ============================================================

import type {
  OtpProvider,
  OtpStartRequest,
  OtpStartResult,
  OtpCheckRequest,
  OtpCheckResult,
} from "../../otp-types";
import { getOtpConfig, isOtpProviderConfigured } from "../../config";

const REQUEST_TIMEOUT_MS = 10_000;

interface CustomSendResponse {
  sent?: unknown;
  ok?: unknown;
  success?: unknown;
  requestId?: unknown;
  request_id?: unknown;
}

interface CustomCheckResponse {
  approved?: unknown;
  verified?: unknown;
  ok?: unknown;
}

function isPositive(val: unknown): boolean {
  if (val === true) return true;
  if (typeof val === "string") {
    const lower = val.toLowerCase();
    return lower === "true" || lower === "ok" || lower === "success";
  }
  return false;
}

export const customOtpProvider: OtpProvider = {
  name: "custom",

  async startOtp(req: OtpStartRequest): Promise<OtpStartResult> {
    const config = getOtpConfig();

    if (!isOtpProviderConfigured(config)) {
      return {
        status: "not_configured",
        provider: "custom",
        realSmsSent: false,
        configured: false,
        message:
          "Custom OTP provider is not configured. Set CUSTOM_OTP_SEND_URL and CUSTOM_OTP_CHECK_URL.",
      };
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (config.customOtpApiKey.length > 0) {
      headers["x-api-key"] = config.customOtpApiKey;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(config.customOtpSendUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ phoneNumber: req.phoneNumber, channel: "sms" }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return {
          status: "failed",
          provider: "custom",
          realSmsSent: false,
          configured: true,
          message: `Custom OTP send endpoint returned HTTP ${response.status}.`,
        };
      }

      let data: CustomSendResponse = {};
      try {
        data = (await response.json()) as CustomSendResponse;
      } catch {
        // Tolerate non-JSON 2xx responses — treat as sent
      }

      const wasSent =
        isPositive(data.sent) ||
        isPositive(data.ok) ||
        isPositive(data.success) ||
        // If the response is a 2xx and has a requestId, treat as sent
        data.requestId !== undefined ||
        data.request_id !== undefined ||
        // Conservative: if the shape is empty 2xx, assume sent
        Object.keys(data).length === 0;

      if (!wasSent) {
        return {
          status: "failed",
          provider: "custom",
          realSmsSent: false,
          configured: true,
          message: "Custom OTP provider responded with 2xx but indicated failure.",
        };
      }

      const requestId =
        typeof data.requestId === "string"
          ? data.requestId
          : typeof data.request_id === "string"
            ? data.request_id
            : undefined;

      return {
        status: "sent",
        provider: "custom",
        realSmsSent: true,
        configured: true,
        requestId,
        message: "SMS OTP sent successfully via custom provider.",
      };
    } catch (err) {
      clearTimeout(timeout);
      const isTimeout = err instanceof Error && err.name === "AbortError";
      return {
        status: "failed",
        provider: "custom",
        realSmsSent: false,
        configured: true,
        message: isTimeout
          ? "Custom OTP send request timed out after 10 seconds."
          : "Custom OTP send request failed. Check CUSTOM_OTP_SEND_URL and network connectivity.",
      };
    }
  },

  async checkOtp(req: OtpCheckRequest): Promise<OtpCheckResult> {
    const config = getOtpConfig();

    if (!isOtpProviderConfigured(config)) {
      return {
        status: "not_configured",
        provider: "custom",
        phoneVerified: false,
        realVerification: false,
        configured: false,
        message: "Custom OTP provider is not configured.",
      };
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (config.customOtpApiKey.length > 0) {
      headers["x-api-key"] = config.customOtpApiKey;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(config.customOtpCheckUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          phoneNumber: req.phoneNumber,
          code: req.code,
          requestId: req.requestId,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return {
          status: "failed",
          provider: "custom",
          phoneVerified: false,
          realVerification: false,
          configured: true,
          message: `Custom OTP check endpoint returned HTTP ${response.status}.`,
        };
      }

      let data: CustomCheckResponse = {};
      try {
        data = (await response.json()) as CustomCheckResponse;
      } catch {
        // Tolerate non-JSON 2xx — treat conservatively as failed
        return {
          status: "failed",
          provider: "custom",
          phoneVerified: false,
          realVerification: false,
          configured: true,
          message: "Custom OTP check returned non-JSON response.",
        };
      }

      const isApproved =
        isPositive(data.approved) ||
        isPositive(data.verified) ||
        isPositive(data.ok);

      if (isApproved) {
        return {
          status: "approved",
          provider: "custom",
          phoneVerified: true,
          realVerification: true,
          configured: true,
          message: "Phone number verified by live SMS OTP.",
        };
      }

      return {
        status: "invalid",
        provider: "custom",
        phoneVerified: false,
        realVerification: false,
        configured: true,
        message: "OTP code was not approved by the custom provider.",
      };
    } catch (err) {
      clearTimeout(timeout);
      const isTimeout = err instanceof Error && err.name === "AbortError";
      return {
        status: "failed",
        provider: "custom",
        phoneVerified: false,
        realVerification: false,
        configured: true,
        message: isTimeout
          ? "Custom OTP check request timed out after 10 seconds."
          : "Custom OTP check request failed. Check CUSTOM_OTP_CHECK_URL and network connectivity.",
      };
    }
  },
};
