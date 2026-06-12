// ============================================================
// Birge — SMS OTP Layer
// Vonage Verify (legacy JSON API, no SDK — plain fetch)
//
// Honesty rules:
//   realSmsSent: true  ONLY after JSON status "0" (success)
//   realVerification: true  ONLY when check JSON status "0"
//   configured: true  ONLY when VONAGE_API_KEY + VONAGE_API_SECRET present
//   requestId REQUIRED for check — if absent return "failed" with clear message
//   No secrets in responses
// ============================================================

import type {
  OtpProvider,
  OtpStartRequest,
  OtpStartResult,
  OtpCheckRequest,
  OtpCheckResult,
} from "../../otp-types";
import { getOtpConfig, isOtpProviderConfigured } from "../../config";

const VONAGE_VERIFY_URL = "https://api.nexmo.com/verify/json";
const VONAGE_CHECK_URL = "https://api.nexmo.com/verify/check/json";
const REQUEST_TIMEOUT_MS = 10_000;

interface VonageStartResponse {
  status?: string;
  request_id?: string;
  error_text?: string;
}

interface VonageCheckResponse {
  status?: string;
  error_text?: string;
}

export const vonageOtpProvider: OtpProvider = {
  name: "vonage",

  async startOtp(req: OtpStartRequest): Promise<OtpStartResult> {
    const config = getOtpConfig();

    if (!isOtpProviderConfigured(config)) {
      return {
        status: "not_configured",
        provider: "vonage",
        realSmsSent: false,
        configured: false,
        message:
          "Vonage Verify credentials are not configured. Set VONAGE_API_KEY and VONAGE_API_SECRET.",
      };
    }

    // Vonage expects the number without the leading + sign
    const number = req.phoneNumber.startsWith("+")
      ? req.phoneNumber.slice(1)
      : req.phoneNumber;

    const body = new URLSearchParams({
      api_key: config.vonageApiKey,
      api_secret: config.vonageApiSecret,
      number,
      brand: config.vonageBrandName,
      code_length: "6",
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(VONAGE_VERIFY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return {
          status: "failed",
          provider: "vonage",
          realSmsSent: false,
          configured: true,
          message: `Vonage Verify HTTP error ${response.status}.`,
        };
      }

      const data = (await response.json()) as VonageStartResponse;

      // Vonage status "0" means success
      if (data.status === "0") {
        return {
          status: "sent",
          provider: "vonage",
          realSmsSent: true,
          configured: true,
          requestId: data.request_id,
          message: "SMS OTP sent successfully via Vonage.",
        };
      }

      // Status "10" = concurrent verifications (rate limit)
      if (data.status === "10") {
        return {
          status: "rate_limited",
          provider: "vonage",
          realSmsSent: false,
          configured: true,
          message:
            "A verification is already in progress for this number. Please wait before requesting another code.",
        };
      }

      return {
        status: "failed",
        provider: "vonage",
        realSmsSent: false,
        configured: true,
        message: `Vonage Verify returned error status ${data.status ?? "unknown"}.`,
      };
    } catch (err) {
      clearTimeout(timeout);
      const isTimeout = err instanceof Error && err.name === "AbortError";
      return {
        status: "failed",
        provider: "vonage",
        realSmsSent: false,
        configured: true,
        message: isTimeout
          ? "Vonage Verify request timed out after 10 seconds."
          : "Vonage Verify request failed. Check network connectivity.",
      };
    }
  },

  async checkOtp(req: OtpCheckRequest): Promise<OtpCheckResult> {
    const config = getOtpConfig();

    if (!isOtpProviderConfigured(config)) {
      return {
        status: "not_configured",
        provider: "vonage",
        phoneVerified: false,
        realVerification: false,
        configured: false,
        message: "Vonage Verify credentials are not configured.",
      };
    }

    // requestId is mandatory for Vonage check
    if (!req.requestId || req.requestId.trim().length === 0) {
      return {
        status: "failed",
        provider: "vonage",
        phoneVerified: false,
        realVerification: false,
        configured: true,
        message:
          "requestId is required for Vonage OTP check. Start an OTP flow first to obtain a requestId.",
      };
    }

    const body = new URLSearchParams({
      api_key: config.vonageApiKey,
      api_secret: config.vonageApiSecret,
      request_id: req.requestId,
      code: req.code,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(VONAGE_CHECK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return {
          status: "failed",
          provider: "vonage",
          phoneVerified: false,
          realVerification: false,
          configured: true,
          message: `Vonage VerificationCheck HTTP error ${response.status}.`,
        };
      }

      const data = (await response.json()) as VonageCheckResponse;

      // Status "0" = success / approved
      if (data.status === "0") {
        return {
          status: "approved",
          provider: "vonage",
          phoneVerified: true,
          realVerification: true,
          configured: true,
          message: "Phone number verified by live SMS OTP.",
        };
      }

      // Status "16" = wrong code
      if (data.status === "16") {
        return {
          status: "invalid",
          provider: "vonage",
          phoneVerified: false,
          realVerification: false,
          configured: true,
          message: "Invalid OTP code. Please check and try again.",
        };
      }

      // Status "6" = expired / already verified / cancelled
      if (data.status === "6") {
        return {
          status: "expired",
          provider: "vonage",
          phoneVerified: false,
          realVerification: false,
          configured: true,
          message: "OTP has expired or was already used. Please request a new code.",
        };
      }

      return {
        status: "failed",
        provider: "vonage",
        phoneVerified: false,
        realVerification: false,
        configured: true,
        message: `Vonage check returned error status ${data.status ?? "unknown"}.`,
      };
    } catch (err) {
      clearTimeout(timeout);
      const isTimeout = err instanceof Error && err.name === "AbortError";
      return {
        status: "failed",
        provider: "vonage",
        phoneVerified: false,
        realVerification: false,
        configured: true,
        message: isTimeout
          ? "Vonage VerificationCheck timed out after 10 seconds."
          : "Vonage VerificationCheck request failed. Check network connectivity.",
      };
    }
  },
};
