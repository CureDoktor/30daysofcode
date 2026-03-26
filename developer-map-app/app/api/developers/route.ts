import { NextResponse } from "next/server";
import { baseJoinedCount, incomingDevelopers, seedDevelopers } from "@/lib/mock-developers";
import { toDeveloperPin } from "@/lib/pins";
import { prisma } from "@/lib/prisma";
import { DevelopersPayload } from "@/lib/types";

export async function GET() {
  const xLiveMode = process.env.X_LIVE_MODE === "true";
  const hasBearerToken = Boolean(process.env.X_BEARER_TOKEN);

  if (xLiveMode && !hasBearerToken) {
    return NextResponse.json(
      {
        error:
          "X live mode is enabled, but X_BEARER_TOKEN is missing. Add it to .env.local or disable X_LIVE_MODE.",
      },
      { status: 503 },
    );
  }

  let databasePins = [] as ReturnType<typeof toDeveloperPin>[];

  try {
    const developers = await prisma.developer.findMany({
      orderBy: { joinedAt: "asc" },
    });
    databasePins = developers.map(toDeveloperPin);
  } catch {
    databasePins = [];
  }

  const activeUsers = xLiveMode ? databasePins : [...seedDevelopers, ...databasePins];

  const payload: DevelopersPayload = {
    totalJoined: baseJoinedCount + databasePins.length,
    activeUsers,
    incomingQueue: xLiveMode ? [] : incomingDevelopers,
    source: xLiveMode ? "x-live" : "mock",
  };

  return NextResponse.json(payload);
}
