// ============================================================
// Birge — SMS OTP Layer
// Mock / Dev-mode OTP provider
//
// No real SMS is ever sent.
// realSmsSent is ALWAYS false.
// realVerification is ALWAYS false.
// configured is ALWAYS false (mock is never a real provider).
//
// When TELECOM_DEV_MODE=true:
//   start → status "sent" with dev-mode label
//   check → code "000000" → "approved" (realVerification: false, labeled)
//           any other code → "invalid"
//
// When TELECOM_DEV_MODE=false:
//   start → "not_configured"
//   check → "not_configured"
// ============================================================

import type {
  OtpProvider,
  OtpStartRequest,
  OtpStartResult,
  OtpCheckRequest,
  OtpCheckResult,
} from "../../otp-types";
import { getTelecomConfig } from "../../config";

export const mockOtpProvider: OtpProvider = {
  name: "mock",

  async startOtp(req: OtpStartRequest): Promise<OtpStartResult> {
    const config = getTelecomConfig();
    const devMode = config.devMode;

    // Suppress unused variable warning — channel is part of the contract
    void req.channel;

    if (devMode) {
      return {
        status: "sent",
        provider: "mock",
        realSmsSent: false,
        configured: false,
        message:
          "SMS provider не настроен. Dev-mode: используйте код 000000.",
      };
    }

    return {
      status: "not_configured",
      provider: "mock",
      realSmsSent: false,
      configured: false,
      message:
        "SMS OTP provider is not configured. Set TELECOM_OTP_PROVIDER and required credentials to enable real SMS verification.",
    };
  },

  async checkOtp(req: OtpCheckRequest): Promise<OtpCheckResult> {
    const config = getTelecomConfig();
    const devMode = config.devMode;

    if (!devMode) {
      return {
        status: "not_configured",
        provider: "mock",
        phoneVerified: false,
        realVerification: false,
        configured: false,
        message:
          "SMS OTP provider is not configured. Set TELECOM_OTP_PROVIDER and required credentials.",
      };
    }

    if (req.code === "000000") {
      return {
        status: "approved",
        provider: "mock",
        phoneVerified: true,
        realVerification: false,
        configured: false,
        message: "Dev-mode verification complete",
      };
    }

    return {
      status: "invalid",
      provider: "mock",
      phoneVerified: false,
      realVerification: false,
      configured: false,
      message:
        "Invalid code. Dev-mode: use code 000000.",
    };
  },
};
