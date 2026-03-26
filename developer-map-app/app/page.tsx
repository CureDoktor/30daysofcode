"use client";

import { useEffect, useMemo, useState } from "react";
import { ActivityPanel } from "@/components/activity-panel";
import { LiveCounter } from "@/components/live-counter";
import { WorldMap } from "@/components/world-map";
import { DeveloperPin, DevelopersPayload } from "@/lib/types";

type CountryStat = {
  code: string;
  country: string;
  count: number;
};

const intervalMs = 3200;

const getTopCountries = (users: DeveloperPin[]): CountryStat[] => {
  const tally = new Map<string, CountryStat>();

  for (const user of users) {
    const key = user.countryCode;
    const current = tally.get(key);
    if (current) {
      current.count += 1;
      continue;
    }
    tally.set(key, { code: key, country: user.country, count: 1 });
  }

  return Array.from(tally.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
};

export default function HomePage() {
  const [users, setUsers] = useState<DeveloperPin[]>([]);
  const [totalJoined, setTotalJoined] = useState(0);
  const [latestId, setLatestId] = useState<string>();
  const [source, setSource] = useState<DevelopersPayload["source"]>("mock");
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [isSimulationOn, setIsSimulationOn] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const response = await fetch("/api/developers");

        if (!response.ok) {
          const errorPayload = (await response.json()) as { error?: string };
          throw new Error(errorPayload.error ?? "Failed to load developer feed.");
        }

        const payload = (await response.json()) as DevelopersPayload;
        setUsers(payload.activeUsers);
        setTotalJoined(payload.totalJoined);
        setLatestId(payload.activeUsers.at(-1)?.id);
        setSource(payload.source);
        setApiError(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error while loading feed.";
        setApiError(message);
        setIsSimulationOn(false);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (isLoading || apiError) {
      return;
    }

    const eventSource = new EventSource("/api/live/stream");
    const onJoin = (rawEvent: Event) => {
      const event = rawEvent as MessageEvent<string>;
      const payload = JSON.parse(event.data) as {
        marker: DeveloperPin;
        totalJoined: number;
      };

      setUsers((currentUsers) => {
        const withoutExisting = currentUsers.filter((user) => user.id !== payload.marker.id);
        return [...withoutExisting, payload.marker];
      });
      setTotalJoined(payload.totalJoined);
      setLatestId(payload.marker.id);
    };

    eventSource.addEventListener("developer-joined", onJoin);

    return () => {
      eventSource.removeEventListener("developer-joined", onJoin);
      eventSource.close();
    };
  }, [apiError, isLoading]);

  useEffect(() => {
    if (!isSimulationOn || source !== "mock" || isLoading || apiError) {
      return;
    }

    const timer = setInterval(async () => {
      try {
        const response = await fetch("/api/mock/pulse", { method: "POST" });
        const payload = (await response.json()) as { done?: boolean };
        if (payload.done) {
          setIsSimulationOn(false);
        }
      } catch {
        setIsSimulationOn(false);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isSimulationOn, source, isLoading, apiError]);

  const latestUser = useMemo(
    () => users.find((user) => user.id === latestId) ?? users.at(-1),
    [latestId, users],
  );

  const topCountries = useMemo(() => getTopCountries(users), [users]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B0B0F] text-white">
      <div className="stars-layer" />
      <div className="grid-layer" />
      <div className="aurora-layer" />

      <main className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col gap-5 px-4 py-6 sm:px-6">
        <header className="flex flex-wrap items-end justify-between gap-4 rounded-3xl border border-white/15 bg-white/5 px-5 py-4 backdrop-blur-xl">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/80">Global Live Map</p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-4xl">World Map of Developers</h1>
            <p className="mt-2 text-sm text-indigo-100/75 sm:text-base">
              Comment your country on X to join the map 🌍
            </p>
          </div>
          <LiveCounter count={totalJoined} />
        </header>

        {apiError && (
          <div className="rounded-2xl border border-rose-300/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {apiError}
          </div>
        )}

        <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-2 backdrop-blur-md">
            {isLoading ? (
              <div className="flex min-h-[560px] items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-indigo-100/70">
                Loading global activity...
              </div>
            ) : (
              <WorldMap markers={users} latestId={latestId} heatmapEnabled={heatmapEnabled} />
            )}
          </div>

          <ActivityPanel
            latest={latestUser ? { username: latestUser.username, country: latestUser.country } : undefined}
            topCountries={topCountries}
            source={source}
            heatmapEnabled={heatmapEnabled}
            onToggleHeatmap={() => setHeatmapEnabled((current) => !current)}
            isSimulationOn={isSimulationOn}
            onToggleSimulation={() => setIsSimulationOn((current) => !current)}
          />
        </section>
      </main>
    </div>
  );
}
