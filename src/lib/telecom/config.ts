// ============================================================
// Birge — Level 2 Telecom Identity Layer
// SERVER-ONLY configuration reader.
//
// ⚠️  DO NOT import this module from any client component or
//     client-side code. It reads env vars that must stay on the
//     server.  The `server-only` package is not installed; this
//     comment acts as the guard.  Route handlers and server
//     components only.
// ============================================================

import type { TelecomProviderName } from "./types";
import type { OtpProviderName } from "./otp-types";

export interface TelecomConfig {
  provider: TelecomProviderName;
  country: string;
  operatorHint: string;
  numberVerifyUrl: string;
  simSwapUrl: string;
  clientId: string;
  clientSecret: string;
  apiKey: string;
  apiSecret: string;
  redirectUri: string;
  callbackSecret: string;
  devMode: boolean;
}

// ────────────────────────────────────────────────────────────
// OTP configuration interface
// ────────────────────────────────────────────────────────────

export interface OtpConfig {
  provider: OtpProviderName;
  enabled: boolean;
  // Twilio Verify v2
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioVerifyServiceSid: string;
  // Vonage Verify (legacy JSON API)
  vonageApiKey: string;
  vonageApiSecret: string;
  vonageBrandName: string;
  // Custom OTP endpoint
  customOtpSendUrl: string;
  customOtpCheckUrl: string;
  customOtpApiKey: string;
}

/**
 * Read OTP configuration from environment variables.
 * Call only from server-side code.
 */
export function getOtpConfig(): OtpConfig {
  const rawProvider = process.env.TELECOM_OTP_PROVIDER ?? "mock";
  const validOtpProviders: OtpProviderName[] = [
    "mock",
    "twilio",
    "vonage",
    "custom",
  ];
  const provider: OtpProviderName = validOtpProviders.includes(
    rawProvider as OtpProviderName
  )
    ? (rawProvider as OtpProviderName)
    : "mock";

  return {
    provider,
    enabled: (process.env.TELECOM_OTP_ENABLED ?? "false") === "true",
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
    twilioVerifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID ?? "",
    vonageApiKey: process.env.VONAGE_API_KEY ?? "",
    vonageApiSecret: process.env.VONAGE_API_SECRET ?? "",
    vonageBrandName: process.env.VONAGE_BRAND_NAME ?? "Birge",
    customOtpSendUrl: process.env.CUSTOM_OTP_SEND_URL ?? "",
    customOtpCheckUrl: process.env.CUSTOM_OTP_CHECK_URL ?? "",
    customOtpApiKey: process.env.CUSTOM_OTP_API_KEY ?? "",
  };
}

/**
 * Returns true only when the selected OTP provider has the minimum required
 * credentials present.  The mock provider is NEVER considered configured.
 *
 * twilio → TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_VERIFY_SERVICE_SID
 * vonage → VONAGE_API_KEY + VONAGE_API_SECRET
 * custom → CUSTOM_OTP_SEND_URL + CUSTOM_OTP_CHECK_URL
 * mock   → always false
 */
export function isOtpProviderConfigured(config: OtpConfig): boolean {
  switch (config.provider) {
    case "twilio":
      return (
        config.twilioAccountSid.length > 0 &&
        config.twilioAuthToken.length > 0 &&
        config.twilioVerifyServiceSid.length > 0
      );

    case "vonage":
      return (
        config.vonageApiKey.length > 0 && config.vonageApiSecret.length > 0
      );

    case "custom":
      return (
        config.customOtpSendUrl.length > 0 &&
        config.customOtpCheckUrl.length > 0
      );

    case "mock":
    default:
      return false;
  }
}

/**
 * Read telecom configuration from environment variables.
 * Call only from server-side code (API routes, server components, etc.).
 */
export function getTelecomConfig(): TelecomConfig {
  const rawProvider = process.env.TELECOM_IDENTITY_PROVIDER ?? "mock";

  const validProviders: TelecomProviderName[] = [
    "mock",
    "gsma",
    "vonage",
    "custom",
  ];
  const provider: TelecomProviderName = validProviders.includes(
    rawProvider as TelecomProviderName
  )
    ? (rawProvider as TelecomProviderName)
    : "mock";

  return {
    provider,
    country: process.env.TELECOM_COUNTRY ?? "KZ",
    operatorHint: process.env.TELECOM_OPERATOR_HINT ?? "Beeline",
    numberVerifyUrl: process.env.TELECOM_NUMBER_VERIFY_URL ?? "",
    simSwapUrl: process.env.TELECOM_SIM_SWAP_URL ?? "",
    clientId: process.env.TELECOM_CLIENT_ID ?? "",
    clientSecret: process.env.TELECOM_CLIENT_SECRET ?? "",
    apiKey: process.env.TELECOM_API_KEY ?? "",
    apiSecret: process.env.TELECOM_API_SECRET ?? "",
    redirectUri: process.env.TELECOM_REDIRECT_URI ?? "",
    callbackSecret: process.env.TELECOM_CALLBACK_SECRET ?? "",
    devMode: (process.env.TELECOM_DEV_MODE ?? "true") !== "false",
  };
}

/**
 * Returns true only when the selected provider has the minimum required
 * credentials present.  The mock provider is NEVER considered configured.
 *
 * gsma   → TELECOM_NUMBER_VERIFY_URL + TELECOM_CLIENT_ID + TELECOM_CLIENT_SECRET
 * vonage → TELECOM_API_KEY + TELECOM_API_SECRET
 * custom → TELECOM_NUMBER_VERIFY_URL + at least one auth credential
 * mock   → always false
 */
export function isProviderConfigured(config: TelecomConfig): boolean {
  switch (config.provider) {
    case "gsma":
      return (
        config.numberVerifyUrl.length > 0 &&
        config.clientId.length > 0 &&
        config.clientSecret.length > 0
      );

    case "vonage":
      return config.apiKey.length > 0 && config.apiSecret.length > 0;

    case "custom": {
      const hasUrl = config.numberVerifyUrl.length > 0;
      const hasAuth =
        config.apiKey.length > 0 ||
        config.clientId.length > 0 ||
        config.callbackSecret.length > 0;
      return hasUrl && hasAuth;
    }

    case "mock":
    default:
      // Mock is NEVER configured — it is always dev/sandbox only
      return false;
  }
}
