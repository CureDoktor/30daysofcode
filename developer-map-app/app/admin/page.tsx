"use client";

import { useEffect, useMemo, useState } from "react";

type PendingItem = {
  id: string;
  username: string;
  rawText: string;
  source: string;
  sourceRef: string | null;
  detectedCountry: string | null;
  detectedCountryCode: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
};

type Stats = {
  pendingCount: number;
  acceptedCount: number;
  rejectedCount: number;
};

export default function AdminModerationPage() {
  const [adminToken, setAdminToken] = useState("");
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [stats, setStats] = useState<Stats>({ pendingCount: 0, acceptedCount: 0, rejectedCount: 0 });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const canLoad = useMemo(() => adminToken.trim().length > 0, [adminToken]);

  useEffect(() => {
    const stored = window.localStorage.getItem("admin-token");
    if (stored) {
      setAdminToken(stored);
    }
  }, []);

  const loadQueue = async () => {
    if (!canLoad) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/submissions", {
        headers: {
          "x-admin-token": adminToken,
        },
      });

      const payload = (await response.json()) as {
        pending?: PendingItem[];
        stats?: Stats;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load moderation queue.");
      }

      setPending(payload.pending ?? []);
      setStats(payload.stats ?? { pendingCount: 0, acceptedCount: 0, rejectedCount: 0 });
      window.localStorage.setItem("admin-token", adminToken);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unknown moderation error.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const moderate = async (id: string, action: "approve" | "reject") => {
    if (!canLoad) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify({ action }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to apply moderation action.");
      }

      await loadQueue();
    } catch (moderateError) {
      const message =
        moderateError instanceof Error ? moderateError.message : "Unknown moderation action error.";
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-[#090A0F] px-4 py-6 text-white sm:px-8">
      <main className="mx-auto max-w-5xl space-y-5">
        <header className="rounded-3xl border border-white/15 bg-white/5 px-5 py-4 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Admin Moderation</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">World Map Queue Control</h1>
          <p className="mt-2 text-sm text-indigo-100/75">
            Approve or reject incoming country comments before they hit the live map.
          </p>
        </header>

        <section className="rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="password"
              value={adminToken}
              onChange={(event) => setAdminToken(event.target.value)}
              placeholder="Enter ADMIN_API_TOKEN"
              className="w-full rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-cyan-300/35 transition focus:ring-2"
            />
            <button
              onClick={loadQueue}
              disabled={!canLoad || isLoading}
              className="rounded-xl border border-cyan-300/45 bg-cyan-400/20 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/30 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isLoading ? "Loading..." : "Load Queue"}
            </button>
          </div>

          {error && (
            <p className="mt-3 rounded-xl border border-rose-300/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              {error}
            </p>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-indigo-200/70">Pending</p>
              <p className="mt-1 text-xl font-semibold">{stats.pendingCount}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-indigo-200/70">Accepted</p>
              <p className="mt-1 text-xl font-semibold">{stats.acceptedCount}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-indigo-200/70">Rejected</p>
              <p className="mt-1 text-xl font-semibold">{stats.rejectedCount}</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          {pending.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{item.username}</p>
                  <p className="mt-1 text-sm text-indigo-100/80">{item.rawText}</p>
                  <p className="mt-2 text-xs text-indigo-200/65">
                    {item.detectedCountry ?? "Unknown"} ({item.detectedCountryCode ?? "--"}) |{" "}
                    {item.source}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => moderate(item.id, "approve")}
                    className="rounded-lg border border-emerald-300/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/25"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => moderate(item.id, "reject")}
                    className="rounded-lg border border-rose-300/40 bg-rose-500/15 px-3 py-1.5 text-xs font-medium text-rose-100 transition hover:bg-rose-500/25"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </article>
          ))}

          {pending.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-indigo-100/70">
              No pending submissions right now.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
