// ============================================================
// Birge — Level 2 Telecom Identity Layer
// Provider selector — server-side only
// ============================================================

import type { TelecomIdentityProvider } from "./types";
import { getTelecomConfig } from "./config";
import { mockProvider } from "./providers/mock";
import { gsmaProvider } from "./providers/gsma";
import { vonageProvider } from "./providers/vonage";
import { customProvider } from "./providers/custom";

/**
 * Returns the active TelecomIdentityProvider based on the
 * TELECOM_IDENTITY_PROVIDER environment variable.
 *
 * Falls back to mock with a warning when the env value is unknown.
 */
export function getTelecomProvider(): TelecomIdentityProvider {
  const config = getTelecomConfig();

  switch (config.provider) {
    case "gsma":
      return gsmaProvider;
    case "vonage":
      return vonageProvider;
    case "custom":
      return customProvider;
    case "mock":
      return mockProvider;
    default: {
      console.warn(
        `[Birge/telecom] Unknown TELECOM_IDENTITY_PROVIDER "${config.provider}". ` +
          `Falling back to mock dev-mode provider.`
      );
      return mockProvider;
    }
  }
}
