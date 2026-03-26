import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { approveSubmission, rejectSubmission } from "@/lib/submission-service";

const actionSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json();
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid moderation action." }, { status: 400 });
  }

  const { id } = await params;

  const result =
    parsed.data.action === "approve"
      ? await approveSubmission(id)
      : await rejectSubmission(id);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result);
}
