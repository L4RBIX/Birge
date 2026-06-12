// ============================================================
// Birge — Level 2 Telecom Identity Layer
// GET /api/telecom/status
//
// Returns sanitized provider status — NO secrets, NO credentials.
// ============================================================

import { getTelecomConfig, isProviderConfigured } from "@/lib/telecom/config";
import { getOtpStatusSummary } from "@/lib/telecom/otp/provider";

export async function GET(): Promise<Response> {
  const config = getTelecomConfig();
  const configured = isProviderConfigured(config);
  const otpStatus = getOtpStatusSummary();

  const body: Record<string, unknown> = {
    provider: config.provider,
    configured,
    country: config.country,
    operatorHint: config.operatorHint,
    devMode: config.devMode,
    capabilities: [
      "number_verify",
      "sim_swap_risk",
      "device_binding",
      "trusted_group_slot",
    ],
    otp: otpStatus,
  };

  if (!configured) {
    body.message =
      "Telecom Network API credentials are not configured.";
  }

  return Response.json(body);
}
