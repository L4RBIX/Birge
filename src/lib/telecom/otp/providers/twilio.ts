// ============================================================
// Birge — SMS OTP Layer
// Twilio Verify v2 provider (no SDK — plain fetch)
//
// Honesty rules:
//   realSmsSent: true  ONLY after a real 2xx from Twilio
//   realVerification: true  ONLY when Twilio returns status "approved"
//   configured: true  ONLY when all 3 TWILIO_* vars are present
//   Never crash when credentials missing — return not_configured
//   No secrets in responses or console logs
// ============================================================

import type {
  OtpProvider,
  OtpStartRequest,
  OtpStartResult,
  OtpCheckRequest,
  OtpCheckResult,
} from "../../otp-types";
import { getOtpConfig, isOtpProviderConfigured } from "../../config";

const TWILIO_VERIFY_BASE = "https://verify.twilio.com/v2/Services";
const REQUEST_TIMEOUT_MS = 10_000;

function buildBasicAuth(sid: string, token: string): string {
  const credentials = Buffer.from(`${sid}:${token}`).toString("base64");
  return `Basic ${credentials}`;
}

export const twilioOtpProvider: OtpProvider = {
  name: "twilio",

  async startOtp(req: OtpStartRequest): Promise<OtpStartResult> {
    const config = getOtpConfig();

    if (!isOtpProviderConfigured(config)) {
      return {
        status: "not_configured",
        provider: "twilio",
        realSmsSent: false,
        configured: false,
        message:
          "Twilio Verify credentials are not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID.",
      };
    }

    const url = `${TWILIO_VERIFY_BASE}/${config.twilioVerifyServiceSid}/Verifications`;
    const body = new URLSearchParams({
      To: req.phoneNumber,
      Channel: req.channel,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: buildBasicAuth(
            config.twilioAccountSid,
            config.twilioAuthToken
          ),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.status === 429) {
        return {
          status: "rate_limited",
          provider: "twilio",
          realSmsSent: false,
          configured: true,
          message: "SMS rate limit reached. Please wait before requesting another code.",
        };
      }

      if (!response.ok) {
        return {
          status: "failed",
          provider: "twilio",
          realSmsSent: false,
          configured: true,
          message: `Twilio Verify request failed with HTTP ${response.status}.`,
        };
      }

      const data = (await response.json()) as { sid?: string };

      return {
        status: "sent",
        provider: "twilio",
        realSmsSent: true,
        configured: true,
        requestId: data.sid,
        message: "SMS OTP sent successfully.",
      };
    } catch (err) {
      clearTimeout(timeout);
      const isTimeout =
        err instanceof Error && err.name === "AbortError";
      return {
        status: "failed",
        provider: "twilio",
        realSmsSent: false,
        configured: true,
        message: isTimeout
          ? "Twilio Verify request timed out after 10 seconds."
          : "Twilio Verify request failed. Check network connectivity.",
      };
    }
  },

  async checkOtp(req: OtpCheckRequest): Promise<OtpCheckResult> {
    const config = getOtpConfig();

    if (!isOtpProviderConfigured(config)) {
      return {
        status: "not_configured",
        provider: "twilio",
        phoneVerified: false,
        realVerification: false,
        configured: false,
        message:
          "Twilio Verify credentials are not configured.",
      };
    }

    const url = `${TWILIO_VERIFY_BASE}/${config.twilioVerifyServiceSid}/VerificationCheck`;
    const body = new URLSearchParams({
      To: req.phoneNumber,
      Code: req.code,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: buildBasicAuth(
            config.twilioAccountSid,
            config.twilioAuthToken
          ),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.status === 404) {
        return {
          status: "expired",
          provider: "twilio",
          phoneVerified: false,
          realVerification: false,
          configured: true,
          message: "OTP has expired or was not found. Please request a new code.",
        };
      }

      if (!response.ok) {
        return {
          status: "failed",
          provider: "twilio",
          phoneVerified: false,
          realVerification: false,
          configured: true,
          message: `Twilio VerificationCheck failed with HTTP ${response.status}.`,
        };
      }

      const data = (await response.json()) as { status?: string };

      if (data.status === "approved") {
        return {
          status: "approved",
          provider: "twilio",
          phoneVerified: true,
          realVerification: true,
          configured: true,
          message: "Phone number verified by live SMS OTP.",
        };
      }

      // status === "pending" means wrong code was submitted
      return {
        status: "invalid",
        provider: "twilio",
        phoneVerified: false,
        realVerification: false,
        configured: true,
        message: "Invalid OTP code. Please check the code and try again.",
      };
    } catch (err) {
      clearTimeout(timeout);
      const isTimeout =
        err instanceof Error && err.name === "AbortError";
      return {
        status: "failed",
        provider: "twilio",
        phoneVerified: false,
        realVerification: false,
        configured: true,
        message: isTimeout
          ? "Twilio VerificationCheck timed out after 10 seconds."
          : "Twilio VerificationCheck request failed. Check network connectivity.",
      };
    }
  },
};
