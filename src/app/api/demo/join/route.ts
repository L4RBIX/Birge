import { joinLiveDemoGroup } from "@/lib/live-demo-store";

export const dynamic = "force-dynamic";

interface JoinDemoRequest {
  name?: unknown;
  deviceId?: unknown;
}

export async function POST(request: Request): Promise<Response> {
  let body: JoinDemoRequest;

  try {
    body = (await request.json()) as JoinDemoRequest;
  } catch {
    return Response.json(
      { ok: false, message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const result = joinLiveDemoGroup({
    name: typeof body.name === "string" ? body.name : "",
    deviceId: typeof body.deviceId === "string" ? body.deviceId : undefined,
  });

  if (!result.ok) {
    return Response.json(
      { ok: false, duplicate: result.duplicate ?? false, message: result.message },
      { status: result.status }
    );
  }

  return Response.json({
    ok: true,
    joined: true,
    slot: result.slot,
    state: result.state,
  });
}
