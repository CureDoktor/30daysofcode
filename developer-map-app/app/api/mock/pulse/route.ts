import { NextResponse } from "next/server";
import { nextMockComment } from "@/lib/mock-pulse";
import { processSubmission } from "@/lib/submission-service";

export async function POST() {
  const next = nextMockComment();

  if (!next) {
    return NextResponse.json({ ok: false, done: true });
  }

  const result = await processSubmission({
    username: next.username,
    text: next.text,
    sourceRef: next.sourceRef,
    source: "mock-sim",
    requireModeration: false,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
