import { getMlBaseUrl, type MlEventPayload } from "@/lib/ml-api";

export async function POST(request: Request) {
  try {
    const mlBaseUrl = getMlBaseUrl();
    if (!mlBaseUrl) {
      return new Response(null, { status: 204 });
    }

    const event = (await request.json()) as MlEventPayload;
    await fetch(`${mlBaseUrl}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      cache: "no-store",
      signal: AbortSignal.timeout(1200),
    });
  } catch {
    // Event logging must never interrupt navigation, joining, or sharing.
  }

  return new Response(null, { status: 204 });
}
