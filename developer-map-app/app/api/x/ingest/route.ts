import { NextResponse } from "next/server";
import { z } from "zod";
import { processSubmission } from "@/lib/submission-service";

const ingestSchema = z.object({
  events: z
    .array(
      z.object({
        username: z.string().min(2).max(40),
        text: z.string().min(2).max(280),
        tweetId: z.string().max(120).optional(),
      }),
    )
    .min(1),
});

export async function POST(request: Request) {
  const internalToken = process.env.INGEST_API_TOKEN;
  const authHeader = request.headers.get("authorization");

  if (!internalToken || authHeader !== `Bearer ${internalToken}`) {
    return NextResponse.json({ error: "Unauthorized ingest request." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = ingestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid ingest payload." }, { status: 400 });
  }

  const accepted = [];
  const rejected = [];

  for (const event of parsed.data.events) {
    const result = await processSubmission({
      username: event.username,
      text: event.text,
      source: "x-ingest",
      sourceRef: event.tweetId,
      requireModeration: true,
    });

    if (result.ok) {
      accepted.push({
        username: event.username,
        submissionId: result.marker.id,
        pending: Boolean(result.pending),
      });
      continue;
    }

    rejected.push({
      username: event.username,
      reason: result.error,
    });
  }

  return NextResponse.json({
    ok: true,
    accepted,
    rejected,
  });
}
