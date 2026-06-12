// ============================================================
// Birge — SMS OTP Layer
// OTP Provider selector — server-side only
// ============================================================

import type { OtpProvider } from "../otp-types";
import { getOtpConfig, isOtpProviderConfigured } from "../config";
import { mockOtpProvider } from "./providers/mock";
import { twilioOtpProvider } from "./providers/twilio";
import { vonageOtpProvider } from "./providers/vonage";
import { customOtpProvider } from "./providers/custom";

/**
 * Returns the active OtpProvider based on the
 * TELECOM_OTP_PROVIDER environment variable.
 *
 * Falls back to mock with a warning when the env value is unknown.
 */
export function getOtpProvider(): OtpProvider {
  const config = getOtpConfig();

  switch (config.provider) {
    case "twilio":
      return twilioOtpProvider;
    case "vonage":
      return vonageOtpProvider;
    case "custom":
      return customOtpProvider;
    case "mock":
      return mockOtpProvider;
    default: {
      console.warn(
        `[Birge/otp] Unknown TELECOM_OTP_PROVIDER "${config.provider}". ` +
          `Falling back to mock dev-mode OTP provider.`
      );
      return mockOtpProvider;
    }
  }
}

/**
 * Returns a sanitized summary of the OTP provider status.
 * Safe to include in API responses — no secrets.
 */
export function getOtpStatusSummary(): {
  provider: string;
  enabled: boolean;
  configured: boolean;
  capability: "sms_otp";
} {
  const config = getOtpConfig();
  const configured = isOtpProviderConfigured(config);

  return {
    provider: config.provider,
    enabled: config.enabled,
    configured,
    capability: "sms_otp",
  };
}
