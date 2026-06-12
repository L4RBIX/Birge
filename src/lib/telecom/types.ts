// ============================================================
// Birge — Level 2 Telecom Identity Layer
// Core type definitions — safe to import from both server and client
// (no secrets, no server-only modules here)
// ============================================================

export type TelecomProviderName = "mock" | "gsma" | "vonage" | "custom";

export type TelecomVerificationStatus =
  | "verified"
  | "not_configured"
  | "pending"
  | "failed"
  | "risk_blocked";

export interface TelecomIdentityRequest {
  phoneNumber: string;
  deviceId: string;
  userAgent?: string;
  ipAddress?: string;
  consentGiven: boolean;
}

export interface TelecomIdentityResult {
  status: TelecomVerificationStatus;
  provider: TelecomProviderName;
  phoneNumber?: string;
  operator?: string;
  country?: string;
  simVerified: boolean;
  numberVerified: boolean;
  deviceBound: boolean;
  simSwapRisk: "low" | "medium" | "high" | "unknown";
  simSwapDetected?: boolean;
  riskScore: number;
  reason: string;
  checkedAt: string;
  /** true ONLY when an actual HTTP request to a real provider completed with a 2xx response */
  realNetworkCheck: boolean;
  configured: boolean;
  rawProviderReference?: string;
}

export interface TelecomIdentityProvider {
  name: TelecomProviderName;
  verifyNumber(request: TelecomIdentityRequest): Promise<TelecomIdentityResult>;
  checkSimSwap?(
    request: TelecomIdentityRequest
  ): Promise<TelecomIdentityResult>;
}

// ────────────────────────────────────────────────────────────
// Audit event types
// ────────────────────────────────────────────────────────────

export type TelecomAuditEventType =
  | "TELECOM_VERIFY_REQUESTED"
  | "TELECOM_VERIFY_SUCCESS"
  | "TELECOM_VERIFY_NOT_CONFIGURED"
  | "SIM_SWAP_RISK_HIGH"
  | "GROUP_SLOT_BOUND"
  | "DUPLICATE_DEVICE_BLOCKED"
  | "ESCROW_RISK_CHECK_PASSED"
  // ── SMS OTP events ──
  | "OTP_SEND_REQUESTED"
  | "OTP_SENT"
  | "OTP_SEND_FAILED"
  | "OTP_CHECK_REQUESTED"
  | "OTP_VERIFIED"
  | "OTP_INVALID_CODE";

export interface TelecomAuditEvent {
  eventType: TelecomAuditEventType;
  userId?: string;
  /** sha256/FNV hash of phone number — never raw phone */
  phoneHash?: string;
  /** sha256/FNV hash of device ID */
  deviceIdHash?: string;
  dealId?: string;
  /** Telecom or OTP provider name — widened to string to accept both provider namespaces */
  provider: TelecomProviderName | "twilio";
  realNetworkCheck: boolean;
  riskScore?: number;
  decision?: "allow" | "step_up" | "block";
  createdAt: string;
}

// ────────────────────────────────────────────────────────────
// Trust decision types
// ────────────────────────────────────────────────────────────

export interface TrustDecision {
  trustScore: number;
  decision: "allow" | "step_up" | "block";
  reasons: string[];
}
