import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { listPendingSubmissions, recentSubmissionStats } from "@/lib/submission-service";

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const [pending, stats] = await Promise.all([listPendingSubmissions(), recentSubmissionStats()]);
  return NextResponse.json({ pending, stats });
}
