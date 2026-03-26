import { NextResponse } from "next/server";
import { z } from "zod";
import { processSubmission } from "@/lib/submission-service";

const submissionSchema = z.object({
  username: z.string().min(2).max(40),
  text: z.string().min(2).max(280),
  sourceRef: z.string().max(120).optional(),
});

export async function POST(request: Request) {
  const payload = await request.json();
  const parsedInput = submissionSchema.safeParse(payload);

  if (!parsedInput.success) {
    return NextResponse.json(
      { error: "Invalid payload. Expected username and text fields." },
      { status: 400 },
    );
  }

  const { username, text, sourceRef } = parsedInput.data;
  const result = await processSubmission({
    username,
    text,
    sourceRef,
    source: "x-comment",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result);
}
