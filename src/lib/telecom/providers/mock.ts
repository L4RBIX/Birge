// ============================================================
// Birge — Level 2 Telecom Identity Layer
// Mock / Dev-mode provider
//
// Dev/sandbox only.  Returns a clearly labeled dev-mode result.
// realNetworkCheck is ALWAYS false — no real HTTP calls are made.
// ============================================================

import type {
  TelecomIdentityProvider,
  TelecomIdentityRequest,
  TelecomIdentityResult,
} from "../types";
import { getTelecomConfig } from "../config";

export const mockProvider: TelecomIdentityProvider = {
  name: "mock",

  async verifyNumber(
    request: TelecomIdentityRequest
  ): Promise<TelecomIdentityResult> {
    const config = getTelecomConfig();

    // UX delay — simulates async network feel; purely cosmetic, not real latency
    await new Promise((resolve) => setTimeout(resolve, 400));

    const now = new Date().toISOString();

    if (config.devMode) {
      return {
        status: "verified",
        provider: "mock",
        phoneNumber: request.phoneNumber,
        operator: config.operatorHint,
        country: config.country,
        simVerified: true, // dev-mode only — not a real SIM check
        numberVerified: true, // dev-mode only — not a real number verification
        deviceBound: request.deviceId.length > 0,
        simSwapRisk: "unknown",
        simSwapDetected: false,
        riskScore: 55,
        reason:
          "Dev-mode telecom identity. Production requires Network API credentials.",
        checkedAt: now,
        realNetworkCheck: false,
        configured: false,
      };
    }

    // TELECOM_DEV_MODE=false: explicitly not configured, no credentials present
    return {
      status: "not_configured",
      provider: "mock",
      simVerified: false,
      numberVerified: false,
      deviceBound: false,
      simSwapRisk: "unknown",
      riskScore: 0,
      reason:
        "Telecom provider is not configured. Set TELECOM_IDENTITY_PROVIDER and required credentials to enable real SIM/number verification.",
      checkedAt: now,
      realNetworkCheck: false,
      configured: false,
    };
  },
};
