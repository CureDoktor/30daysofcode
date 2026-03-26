import { NextResponse } from "next/server";
import { processSubmission } from "@/lib/submission-service";

type XSearchResponse = {
  data?: Array<{
    id: string;
    text: string;
    author_id: string;
  }>;
  includes?: {
    users?: Array<{
      id: string;
      username: string;
    }>;
  };
};

export async function POST(request: Request) {
  const internalToken = process.env.INGEST_API_TOKEN;
  const authHeader = request.headers.get("authorization");
  if (!internalToken || authHeader !== `Bearer ${internalToken}`) {
    return NextResponse.json({ error: "Unauthorized sync request." }, { status: 401 });
  }

  const bearer = process.env.X_BEARER_TOKEN;
  const targetTweetId = process.env.X_TARGET_TWEET_ID;
  if (!bearer || !targetTweetId) {
    return NextResponse.json(
      { error: "Missing X_BEARER_TOKEN or X_TARGET_TWEET_ID in environment." },
      { status: 503 },
    );
  }

  const query = encodeURIComponent(`conversation_id:${targetTweetId} -is:retweet -is:quote`);
  const url = `https://api.twitter.com/2/tweets/search/recent?query=${query}&tweet.fields=author_id&expansions=author_id&user.fields=username&max_results=50`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${bearer}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    return NextResponse.json(
      { error: "X sync failed.", details: body.slice(0, 300) },
      { status: 502 },
    );
  }

  const payload = (await response.json()) as XSearchResponse;
  const users = new Map(payload.includes?.users?.map((user) => [user.id, user.username]) ?? []);

  const accepted = [];
  const rejected = [];

  for (const tweet of payload.data ?? []) {
    const username = users.get(tweet.author_id);
    if (!username) {
      continue;
    }

    const result = await processSubmission({
      username: `@${username}`,
      text: tweet.text,
      source: "x-sync",
      sourceRef: tweet.id,
      requireModeration: true,
    });

    if (result.ok) {
      accepted.push({
        username: `@${username}`,
        submissionId: result.marker.id,
        pending: Boolean(result.pending),
      });
      continue;
    }

    rejected.push({
      username: `@${username}`,
      reason: result.error,
    });
  }

  return NextResponse.json({
    ok: true,
    scanned: payload.data?.length ?? 0,
    accepted,
    rejected,
  });
}
