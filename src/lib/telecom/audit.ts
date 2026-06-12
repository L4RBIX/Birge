// ============================================================
// Birge — Level 2 Telecom Identity Layer
// Audit event store
//
// Dual-environment:
//   Server  → module-level ring buffer (max 100), globalThis-cached
//             so Next.js dev hot-reload preserves events across
//             module re-evaluations.
//   Browser → localStorage "birge_telecom_audit" (max 50 events).
//
// NEVER store raw phone numbers.  Use hashIdentifier() before
// storing any PII.  Raw phone numbers must be masked (e.g., …4567)
// before any display use.
// ============================================================

import type {
  TelecomAuditEvent,
  TelecomAuditEventType,
  TelecomProviderName,
} from "./types";
import type { OtpProviderName } from "./otp-types";

// Re-export for convenience
export type { TelecomAuditEvent, TelecomAuditEventType };

const SERVER_RING_BUFFER_MAX = 100;
const CLIENT_STORAGE_MAX = 50;
const CLIENT_STORAGE_KEY = "birge_telecom_audit";

// ────────────────────────────────────────────────────────────
// Server-side ring buffer (globalThis-cached for hot-reload)
// ────────────────────────────────────────────────────────────

declare global {
  var __birge_telecom_audit_buffer: TelecomAuditEvent[] | undefined;
}

function getServerBuffer(): TelecomAuditEvent[] {
  if (!globalThis.__birge_telecom_audit_buffer) {
    globalThis.__birge_telecom_audit_buffer = [];
  }
  return globalThis.__birge_telecom_audit_buffer;
}

function pushToServerBuffer(event: TelecomAuditEvent): void {
  const buf = getServerBuffer();
  buf.push(event);
  // Trim to ring buffer max (drop oldest)
  if (buf.length > SERVER_RING_BUFFER_MAX) {
    buf.splice(0, buf.length - SERVER_RING_BUFFER_MAX);
  }
}

// ────────────────────────────────────────────────────────────
// Hashing helpers
// ────────────────────────────────────────────────────────────

/**
 * Hash an identifier (phone number, device ID, etc.) for safe audit storage.
 *
 * Server: sha256 hex via node:crypto.
 * Client: FNV-1a 32-bit non-reversible hash, prefixed "demo-" to make
 *         it clear this is not a cryptographic hash.
 *
 * NEVER store raw phone numbers.
 */
export function hashIdentifier(value: string): string {
  if (typeof window === "undefined") {
    // Server path — use node:crypto (synchronous createHash)
    // Dynamic require keeps this file importable from client bundles
    // (Next.js tree-shakes server-only branches in client builds)
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const crypto = require("node:crypto") as {
        createHash: (alg: string) => { update: (s: string) => { digest: (enc: string) => string } };
      };
      return crypto.createHash("sha256").update(value).digest("hex");
    } catch {
      // Fallback if somehow node:crypto is unavailable
      return `fallback-${value.slice(-4)}`;
    }
  }

  // Browser path — FNV-1a 32-bit
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return `demo-${hash.toString(16).padStart(8, "0")}`;
}

/**
 * Mask a phone number for safe display.
 * "+77001234567" → "+7700***4567"
 */
export function maskPhone(phone: string): string {
  if (phone.length < 4) return "***";
  const last4 = phone.slice(-4);
  const prefix = phone.slice(0, Math.max(0, phone.length - 7));
  return `${prefix}***${last4}`;
}

// ────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────

/**
 * Record a telecom audit event.
 * Works on both server and client.
 */
export function recordAuditEvent(event: TelecomAuditEvent): void {
  if (typeof window === "undefined") {
    // Server
    pushToServerBuffer(event);
    return;
  }

  // Client — localStorage
  try {
    const raw = localStorage.getItem(CLIENT_STORAGE_KEY);
    let events: TelecomAuditEvent[] = [];

    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        events = parsed as TelecomAuditEvent[];
      }
    }

    events.push(event);

    // Trim to max
    if (events.length > CLIENT_STORAGE_MAX) {
      events = events.slice(events.length - CLIENT_STORAGE_MAX);
    }

    localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify(events));
  } catch {
    // localStorage unavailable — silently drop in demo mode
  }
}

/**
 * Retrieve recent audit events.
 * Works on both server and client.
 */
export function getRecentAuditEvents(limit = 20): TelecomAuditEvent[] {
  if (typeof window === "undefined") {
    // Server — return from ring buffer (most recent last)
    const buf = getServerBuffer();
    return buf.slice(-limit);
  }

  // Client — localStorage
  try {
    const raw = localStorage.getItem(CLIENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const events = parsed as TelecomAuditEvent[];
    return events.slice(-limit);
  } catch {
    return [];
  }
}

// ────────────────────────────────────────────────────────────
// Convenience builder
// ────────────────────────────────────────────────────────────

export function buildAuditEvent(
  eventType: TelecomAuditEventType,
  opts: {
    userId?: string;
    phone?: string;
    deviceId?: string;
    dealId?: string;
    provider: TelecomProviderName | OtpProviderName;
    realNetworkCheck: boolean;
    riskScore?: number;
    decision?: "allow" | "step_up" | "block";
  }
): TelecomAuditEvent {
  return {
    eventType,
    userId: opts.userId,
    phoneHash: opts.phone ? hashIdentifier(opts.phone) : undefined,
    deviceIdHash: opts.deviceId ? hashIdentifier(opts.deviceId) : undefined,
    dealId: opts.dealId,
    provider: opts.provider,
    realNetworkCheck: opts.realNetworkCheck,
    riskScore: opts.riskScore,
    decision: opts.decision,
    createdAt: new Date().toISOString(),
  };
}
