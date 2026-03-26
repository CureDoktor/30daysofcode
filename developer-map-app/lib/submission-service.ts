import { baseJoinedCount } from "@/lib/mock-developers";
import { parseCountryFromText } from "@/lib/country-parser";
import { geocodeCountry } from "@/lib/geocode";
import { publishJoinEvent } from "@/lib/live-events";
import { toDeveloperPin } from "@/lib/pins";
import { prisma } from "@/lib/prisma";
import { Submission } from "@prisma/client";

type ProcessSubmissionInput = {
  username: string;
  text: string;
  source: string;
  sourceRef?: string;
  requireModeration?: boolean;
};

type ProcessSubmissionResult =
  | {
      ok: true;
      pending?: boolean;
      marker: ReturnType<typeof toDeveloperPin>;
      totalJoined: number;
    }
  | {
      ok: false;
      status: 409 | 422 | 429;
      error: string;
    };

const normalizeUsername = (raw: string) => {
  const cleaned = raw.trim().replace(/^@+/, "");
  return `@${cleaned}`.toLowerCase();
};

const getCooldownSeconds = () => {
  const value = Number(process.env.SUBMISSION_COOLDOWN_SECONDS ?? "20");
  return Number.isFinite(value) && value > 0 ? value : 20;
};

const shouldModerateByDefault = () => process.env.MODERATION_MODE === "true";

type AntiSpamState = {
  byUsername: Map<string, number>;
};

const globalAntiSpam = globalThis as unknown as { __antiSpamState?: AntiSpamState };
const antiSpamState = globalAntiSpam.__antiSpamState ?? { byUsername: new Map<string, number>() };
globalAntiSpam.__antiSpamState = antiSpamState;

const buildSourceRef = (username: string, sourceRef?: string) => {
  const encodedUser = encodeURIComponent(username);
  const encodedRef = encodeURIComponent(sourceRef ?? "");
  return `${encodedUser}::${encodedRef}`;
};

const parseSourceRef = (sourceRef: string | null) => {
  if (!sourceRef) {
    return { username: "@unknown", sourceRef: null as string | null };
  }

  const [encodedUser, encodedRef] = sourceRef.split("::");
  if (!encodedUser) {
    return { username: "@unknown", sourceRef };
  }

  return {
    username: decodeURIComponent(encodedUser),
    sourceRef: encodedRef ? decodeURIComponent(encodedRef) : null,
  };
};

async function createOrUpdateDeveloperFromSubmission(submission: Submission) {
  if (
    !submission.detectedCountry ||
    !submission.detectedCountryCode ||
    submission.latitude === null ||
    submission.longitude === null
  ) {
    throw new Error("Submission does not have enough data to approve.");
  }

  const parsedRef = parseSourceRef(submission.sourceRef);
  const username = parsedRef.username;

  const developer = await prisma.developer.upsert({
    where: { username },
    create: {
      username,
      country: submission.detectedCountry,
      countryCode: submission.detectedCountryCode,
      latitude: submission.latitude,
      longitude: submission.longitude,
    },
    update: {
      country: submission.detectedCountry,
      countryCode: submission.detectedCountryCode,
      latitude: submission.latitude,
      longitude: submission.longitude,
      joinedAt: new Date(),
    },
  });

  await prisma.submission.update({
    where: { id: submission.id },
    data: {
      status: "ACCEPTED",
      developerId: developer.id,
    },
  });

  const marker = toDeveloperPin(developer);
  const dbCount = await prisma.developer.count();
  const totalJoined = baseJoinedCount + dbCount;

  publishJoinEvent({
    type: "developer-joined",
    marker,
    totalJoined,
  });

  return { marker, totalJoined };
}

export async function processSubmission(
  input: ProcessSubmissionInput,
): Promise<ProcessSubmissionResult> {
  const normalizedUsername = normalizeUsername(input.username);
  const requireModeration = input.requireModeration ?? shouldModerateByDefault();
  const compositeRef = buildSourceRef(normalizedUsername, input.sourceRef);

  if (input.sourceRef) {
    const duplicate = await prisma.submission.findFirst({
      where: { sourceRef: { endsWith: `::${encodeURIComponent(input.sourceRef)}` } },
      select: { id: true },
    });

    if (duplicate) {
      return {
        ok: false,
        status: 409,
        error: "Duplicate source reference already processed.",
      };
    }
  }

  const cooldownSeconds = getCooldownSeconds();
  const lastSubmittedAt = antiSpamState.byUsername.get(normalizedUsername);
  if (lastSubmittedAt) {
    const secondsSinceLast = (Date.now() - lastSubmittedAt) / 1000;
    if (secondsSinceLast < cooldownSeconds) {
      return {
        ok: false,
        status: 429,
        error: `Rate limit: wait ${Math.ceil(cooldownSeconds - secondsSinceLast)}s before next submission.`,
      };
    }
  }

  const parsedCountry = parseCountryFromText(input.text);

  if (!parsedCountry) {
    await prisma.submission.create({
      data: {
        rawText: input.text,
        sourceRef: compositeRef,
        source: input.source,
        status: "REJECTED",
      },
    });

    return {
      ok: false,
      status: 422,
      error: "Could not detect a valid country in this comment.",
    };
  }

  const geocoded = await geocodeCountry(parsedCountry.country, parsedCountry.countryCode);

  if (!geocoded) {
    await prisma.submission.create({
      data: {
        rawText: input.text,
        sourceRef: compositeRef,
        source: input.source,
        status: "REJECTED",
        detectedCountry: parsedCountry.country,
        detectedCountryCode: parsedCountry.countryCode,
      },
    });

    return {
      ok: false,
      status: 422,
      error: "Country detected, but geocoding failed for this entry.",
    };
  }

  const submission = await prisma.submission.create({
    data: {
      rawText: input.text,
      sourceRef: compositeRef,
      source: input.source,
      status: "PENDING",
      detectedCountry: parsedCountry.country,
      detectedCountryCode: parsedCountry.countryCode,
      latitude: geocoded.latitude,
      longitude: geocoded.longitude,
    },
  });

  if (requireModeration) {
    antiSpamState.byUsername.set(normalizedUsername, Date.now());
    const dbCount = await prisma.developer.count();
    return {
      ok: true,
      pending: true,
      marker: {
        id: submission.id,
        username: normalizedUsername,
        country: parsedCountry.country,
        countryCode: parsedCountry.countryCode,
        coordinates: [geocoded.longitude, geocoded.latitude],
        joinedAt: submission.createdAt.toISOString(),
      },
      totalJoined: baseJoinedCount + dbCount,
    };
  }

  antiSpamState.byUsername.set(normalizedUsername, Date.now());
  const approved = await createOrUpdateDeveloperFromSubmission(submission);

  return { ok: true, marker: approved.marker, totalJoined: approved.totalJoined };
}

export async function approveSubmission(submissionId: string) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    return { ok: false as const, status: 404, error: "Submission not found." };
  }

  if (submission.status !== "PENDING") {
    return { ok: false as const, status: 409, error: "Only pending submissions can be approved." };
  }

  const approved = await createOrUpdateDeveloperFromSubmission(submission);
  return { ok: true as const, marker: approved.marker, totalJoined: approved.totalJoined };
}

export async function rejectSubmission(submissionId: string) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: { id: true, status: true },
  });

  if (!submission) {
    return { ok: false as const, status: 404, error: "Submission not found." };
  }

  if (submission.status !== "PENDING") {
    return { ok: false as const, status: 409, error: "Only pending submissions can be rejected." };
  }

  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: "REJECTED" },
  });

  return { ok: true as const };
}

export async function listPendingSubmissions() {
  const pending = await prisma.submission.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return pending.map((item) => ({
    id: item.id,
    username: parseSourceRef(item.sourceRef).username,
    rawText: item.rawText,
    source: item.source,
    sourceRef: parseSourceRef(item.sourceRef).sourceRef,
    detectedCountry: item.detectedCountry,
    detectedCountryCode: item.detectedCountryCode,
    latitude: item.latitude,
    longitude: item.longitude,
    createdAt: item.createdAt.toISOString(),
  }));
}

export async function recentSubmissionStats() {
  const [pendingCount, acceptedCount, rejectedCount] = await Promise.all([
    prisma.submission.count({ where: { status: "PENDING" } }),
    prisma.submission.count({ where: { status: "ACCEPTED" } }),
    prisma.submission.count({ where: { status: "REJECTED" } }),
  ]);

  return { pendingCount, acceptedCount, rejectedCount };
}
