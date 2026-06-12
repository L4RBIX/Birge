// ============================================================
// Birge — SMS OTP Verification Layer
// Type definitions — safe to import from server-side code only
// (these reference provider names used only in server routes)
// ============================================================

export type OtpProviderName = "mock" | "twilio" | "vonage" | "custom";

export type OtpStartStatus =
  | "sent"
  | "not_configured"
  | "failed"
  | "rate_limited";

export type OtpCheckStatus =
  | "approved"
  | "pending"
  | "invalid"
  | "expired"
  | "not_configured"
  | "failed";

export interface OtpStartRequest {
  phoneNumber: string;
  channel: "sms";
  consentGiven: boolean;
}

export interface OtpStartResult {
  status: OtpStartStatus;
  provider: OtpProviderName;
  /** true ONLY after an actual provider 2xx response — never for mock */
  realSmsSent: boolean;
  /** false for mock provider always */
  configured: boolean;
  requestId?: string;
  message: string;
}

export interface OtpCheckRequest {
  phoneNumber: string;
  code: string;
  requestId?: string;
}

export interface OtpCheckResult {
  status: OtpCheckStatus;
  provider: OtpProviderName;
  /** true ONLY when provider returns approved AND provider is not mock */
  phoneVerified: boolean;
  /** true ONLY when a real provider (not mock) returns approved */
  realVerification: boolean;
  /** false for mock provider always */
  configured: boolean;
  message: string;
}

// ────────────────────────────────────────────────────────────
// Provider interface
// ────────────────────────────────────────────────────────────

export interface OtpProvider {
  name: OtpProviderName;
  startOtp(req: OtpStartRequest): Promise<OtpStartResult>;
  checkOtp(req: OtpCheckRequest): Promise<OtpCheckResult>;
}
