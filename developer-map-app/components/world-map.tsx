"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { DeveloperPin } from "@/lib/types";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type Cluster = {
  id: string;
  coordinates: [number, number];
  count: number;
  countries: string[];
  countryCodes: string[];
  usernames: string[];
  includesLatest: boolean;
};

type WorldMapProps = {
  markers: DeveloperPin[];
  latestId?: string;
  heatmapEnabled: boolean;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const createClusters = (markers: DeveloperPin[], zoom: number, latestId?: string): Cluster[] => {
  const bucket = zoom < 1.8 ? 8 : zoom < 2.6 ? 5 : 3;
  const grouped = new Map<string, Cluster>();

  for (const marker of markers) {
    const [lng, lat] = marker.coordinates;
    const key = `${Math.round(lng / bucket)}:${Math.round(lat / bucket)}`;
    const current = grouped.get(key);

    if (!current) {
      grouped.set(key, {
        id: key,
        coordinates: marker.coordinates,
        count: 1,
        countries: [marker.country],
        countryCodes: [marker.countryCode],
        usernames: [marker.username],
        includesLatest: marker.id === latestId,
      });
      continue;
    }

    current.count += 1;
    current.countries.push(marker.country);
    current.countryCodes.push(marker.countryCode);
    current.usernames.push(marker.username);
    current.includesLatest = current.includesLatest || marker.id === latestId;
    current.coordinates = [
      (current.coordinates[0] * (current.count - 1) + lng) / current.count,
      (current.coordinates[1] * (current.count - 1) + lat) / current.count,
    ];
  }

  return Array.from(grouped.values());
};

export function WorldMap({ markers, latestId, heatmapEnabled }: WorldMapProps) {
  const [position, setPosition] = useState({ coordinates: [0, 15] as [number, number], zoom: 1.25 });
  const [hovered, setHovered] = useState<Cluster | null>(null);

  const clusters = useMemo(
    () => createClusters(markers, position.zoom, latestId),
    [markers, position.zoom, latestId],
  );

  const countryCounts = useMemo(() => {
    const countMap = new Map<string, number>();
    for (const marker of markers) {
      countMap.set(marker.countryCode, (countMap.get(marker.countryCode) ?? 0) + 1);
    }
    return countMap;
  }, [markers]);

  const handleZoomIn = () => {
    setPosition((prev) => ({ ...prev, zoom: clamp(prev.zoom * 1.26, 1.1, 6.5) }));
  };

  const handleZoomOut = () => {
    setPosition((prev) => ({ ...prev, zoom: clamp(prev.zoom / 1.26, 1.1, 6.5) }));
  };

  return (
    <div className="relative h-full min-h-[560px] overflow-hidden rounded-3xl border border-white/12 bg-[#090C18]/70 shadow-[0_22px_80px_rgba(25,34,87,0.45)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(99,102,241,0.25),transparent_34%),radial-gradient(circle_at_90%_80%,rgba(34,211,238,0.2),transparent_38%)]" />

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 150 }}
        className="relative z-10 h-full w-full"
      >
        <ZoomableGroup
          center={position.coordinates}
          zoom={position.zoom}
          onMoveEnd={(state) => {
            setPosition({ coordinates: state.coordinates as [number, number], zoom: state.zoom });
          }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const code = (geo.properties.ISO_A2 as string) ?? "";
                const count = countryCounts.get(code) ?? 0;
                const fill = heatmapEnabled
                  ? count > 0
                    ? `rgba(56, 189, 248, ${Math.min(0.75, 0.2 + count * 0.12)})`
                    : "rgba(30, 41, 68, 0.78)"
                  : "rgba(30, 41, 68, 0.78)";

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="rgba(148, 163, 184, 0.28)"
                    strokeWidth={0.45}
                    style={{
                      default: { outline: "none" },
                      hover: { fill: "rgba(99, 102, 241, 0.68)", outline: "none" },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {clusters.map((cluster) => {
            const pulseSize = cluster.count > 1 ? 8 + cluster.count * 1.8 : 8;
            const coreRadius = cluster.count > 1 ? 3 + Math.min(7, cluster.count * 0.8) : 3.6;

            return (
              <Marker
                key={cluster.id}
                coordinates={cluster.coordinates}
                onMouseEnter={() => setHovered(cluster)}
                onMouseLeave={() => setHovered(null)}
              >
                <motion.g
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                  className="cursor-pointer"
                >
                  <motion.circle
                    r={pulseSize}
                    fill="rgba(52, 211, 255, 0.55)"
                    animate={{ opacity: [0.6, 0], scale: [0.9, 2.6] }}
                    transition={{ duration: 2.3, repeat: Infinity, ease: "easeOut" }}
                  />

                  <circle r={coreRadius} fill={cluster.count > 1 ? "#a5b4fc" : "#22d3ee"} />

                  {cluster.includesLatest && (
                    <motion.circle
                      r={coreRadius + 2}
                      stroke="#a78bfa"
                      strokeWidth={1.2}
                      fill="transparent"
                      animate={{ opacity: [0.95, 0], scale: [1, 4] }}
                      transition={{ duration: 1.2, repeat: 2, ease: "easeOut" }}
                    />
                  )}

                  {cluster.count > 1 && (
                    <text
                      y={1}
                      textAnchor="middle"
                      className="fill-slate-950 text-[8px] font-bold"
                    >
                      {cluster.count}
                    </text>
                  )}
                </motion.g>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      <div className="absolute right-4 top-4 z-20 flex gap-2">
        <button
          onClick={handleZoomIn}
          className="rounded-xl border border-white/20 bg-black/45 px-3 py-2 text-white transition hover:border-cyan-300/70 hover:bg-indigo-500/30"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="rounded-xl border border-white/20 bg-black/45 px-3 py-2 text-white transition hover:border-cyan-300/70 hover:bg-indigo-500/30"
        >
          -
        </button>
      </div>

      {hovered && (
        <div className="absolute bottom-4 left-4 z-20 max-w-xs rounded-2xl border border-white/20 bg-black/60 px-4 py-3 text-sm text-indigo-100 backdrop-blur-md">
          {hovered.count > 1 ? (
            <>
              <p className="font-semibold text-white">{hovered.count} developers nearby</p>
              <p className="mt-1 text-indigo-100/80">
                {Array.from(new Set(hovered.countries)).slice(0, 3).join(", ")}
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-white">{hovered.usernames[0]}</p>
              <p className="mt-1 text-indigo-100/80">{hovered.countries[0]}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
