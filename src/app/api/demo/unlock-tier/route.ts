import { unlockLiveDemoTier } from "@/lib/live-demo-store";

export const dynamic = "force-dynamic";

export async function POST(): Promise<Response> {
  return Response.json({
    ok: true,
    state: unlockLiveDemoTier(),
  });
}
