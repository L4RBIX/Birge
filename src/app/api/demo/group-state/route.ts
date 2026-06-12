import { getLiveDemoState } from "@/lib/live-demo-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const state = getLiveDemoState();
  return Response.json(
    {
      ok: true,
      ...state,
      serverNow: Date.now(),
      requestHost: request.headers.get("host") ?? "",
    },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  );
}
