// ============================================================
// Birge — Level 2 Telecom Identity Layer
// GET /api/telecom/audit
//
// Returns recent server-side audit events.
// Phone numbers are already hashed/masked by the audit module
// — no raw PII is stored or returned.
// ============================================================

import { getRecentAuditEvents } from "@/lib/telecom/audit";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 20, 100) : 20;

  const events = getRecentAuditEvents(limit);

  return Response.json({
    events,
    count: events.length,
  });
}
