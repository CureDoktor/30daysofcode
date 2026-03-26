"use client";

import { motion } from "framer-motion";

type CountryStat = {
  code: string;
  country: string;
  count: number;
};

type ActivityPanelProps = {
  latest?: { username: string; country: string };
  topCountries: CountryStat[];
  source: "mock" | "x-live";
  heatmapEnabled: boolean;
  onToggleHeatmap: () => void;
  isSimulationOn: boolean;
  onToggleSimulation: () => void;
};

export function ActivityPanel({
  latest,
  topCountries,
  source,
  heatmapEnabled,
  onToggleHeatmap,
  isSimulationOn,
  onToggleSimulation,
}: ActivityPanelProps) {
  return (
    <aside className="space-y-4">
      <div className="rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/80">Global Movement</p>
        <h2 className="mt-2 text-xl font-semibold text-white">World Map of Developers</h2>
        <p className="mt-2 text-sm text-indigo-100/80">
          Comment your country on X to join the map 🌍
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-indigo-200/60">
          Mode: {source === "x-live" ? "X Live Ingest" : "Mock Simulation"}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={onToggleSimulation}
            disabled={source === "x-live"}
            className="rounded-xl border border-cyan-300/40 bg-cyan-400/15 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/25 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {source === "x-live"
              ? "Simulation Disabled"
              : isSimulationOn
                ? "Pause Live Feed"
                : "Resume Live Feed"}
          </button>
          <button
            onClick={onToggleHeatmap}
            className="rounded-xl border border-indigo-300/35 bg-indigo-400/15 px-3 py-2 text-sm font-medium text-indigo-100 transition hover:bg-indigo-400/25"
          >
            {heatmapEnabled ? "Heatmap: On" : "Heatmap: Off"}
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.2em] text-violet-200/80">Latest Join</p>
        <motion.div
          key={`${latest?.username}-${latest?.country}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3"
        >
          <p className="text-sm font-semibold text-white">{latest?.username ?? "Waiting..."}</p>
          <p className="text-sm text-indigo-100/75">{latest?.country ?? "No updates yet"}</p>
        </motion.div>
      </div>

      <div className="rounded-3xl border border-white/15 bg-white/5 p-5 backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Top Countries</p>
        <ul className="mt-3 space-y-2">
          {topCountries.map((item, index) => (
            <li
              key={item.code}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm"
            >
              <span className="text-indigo-100">
                {index + 1}. {item.country}
              </span>
              <span className="font-semibold text-cyan-200">{item.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
