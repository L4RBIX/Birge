// ============================================================
// Birge — Level 2 Telecom Identity Layer
// Device binding helpers — CLIENT-SAFE (no server-only imports)
//
// JSDoc: The device ID generated here is a demo-level binding
// only.  It ties a browser session to a group deal slot.
// It does NOT prove SIM/eSIM identity unless a real telecom
// provider (GSMA, Vonage, or custom operator) confirms the
// phone number is associated with this device.
// ============================================================

const DEVICE_ID_KEY = "birge_device_id";
const JOINED_DEALS_KEY = "birge_joined_deals";

/** Returns true if we are running in a browser context. */
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Generate a reasonably unique ID without relying on crypto.randomUUID
 * availability in older runtimes.
 */
function generateFallbackId(): string {
  const timestamp = Date.now().toString(36);
  const rand1 = Math.random().toString(36).slice(2, 8);
  const rand2 = Math.random().toString(36).slice(2, 8);
  return `${timestamp}-${rand1}-${rand2}`;
}

/**
 * Return the stored device ID, or create and store a new one.
 *
 * SSR-safe: returns an empty string when called outside a browser context
 * (e.g., during Next.js server rendering).
 *
 * @remarks
 * Device ID is a demo-level binding only.  Production identity requires
 * a real telecom provider to confirm the phone number matches this device.
 */
export function getOrCreateDeviceId(): string {
  if (!isBrowser()) return "";

  try {
    const stored = localStorage.getItem(DEVICE_ID_KEY);
    if (stored && stored.length > 0) return stored;

    // Prefer crypto.randomUUID when available
    const newId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : generateFallbackId();

    localStorage.setItem(DEVICE_ID_KEY, newId);
    return newId;
  } catch {
    // localStorage may be blocked (private mode, permissions policy, etc.)
    return generateFallbackId();
  }
}

/**
 * Returns true if this device has already joined the given deal.
 * Used to prevent duplicate group-slot binding in demo mode.
 */
export function hasJoinedDeal(dealId: string): boolean {
  if (!isBrowser()) return false;

  try {
    const raw = localStorage.getItem(JOINED_DEALS_KEY);
    if (!raw) return false;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return false;
    return (parsed as string[]).includes(dealId);
  } catch {
    return false;
  }
}

/**
 * Record that this device has joined the given deal.
 * Idempotent — safe to call multiple times for the same dealId.
 */
export function markDealJoined(dealId: string): void {
  if (!isBrowser()) return;

  try {
    const raw = localStorage.getItem(JOINED_DEALS_KEY);
    let deals: string[] = [];

    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        deals = parsed as string[];
      }
    }

    if (!deals.includes(dealId)) {
      deals.push(dealId);
      localStorage.setItem(JOINED_DEALS_KEY, JSON.stringify(deals));
    }
  } catch {
    // localStorage unavailable — silently ignore in demo mode
  }
}

/**
 * Clear the demo device binding.  Useful for testing the onboarding
 * flow repeatedly, or when a user logs out.
 *
 * Does NOT affect real provider-level identity — that lives server-side.
 */
export function clearDemoDeviceBinding(): void {
  if (!isBrowser()) return;

  try {
    localStorage.removeItem(DEVICE_ID_KEY);
    localStorage.removeItem(JOINED_DEALS_KEY);
  } catch {
    // Silently ignore
  }
}
