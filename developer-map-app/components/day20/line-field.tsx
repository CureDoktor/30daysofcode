"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export type EnergyMode = "product" | "features" | "pricing";
export type ExtendedEnergyMode = EnergyMode | "singularity" | "nova";

type LineFieldProps = {
  mode: ExtendedEnergyMode;
  burstSignal: number;
  className?: string;
};

type LineProfile = {
  amp: number;
  freq: number;
  speed: number;
  chaos: number;
  tension: number;
  straighten: number;
  glow: number;
  jitter: number;
};

type Seed = {
  phase: number;
  laneOffset: number;
  noiseA: number;
  noiseB: number;
};

const WIDTH = 1200;
const HEIGHT = 620;
const LINE_COUNT = 100;
const POINT_COUNT = 18;

const MODE_PROFILE: Record<ExtendedEnergyMode, LineProfile> = {
  product: {
    amp: 13,
    freq: 0.72,
    speed: 0.82,
    chaos: 0.2,
    tension: 0.16,
    straighten: 0.15,
    glow: 0.34,
    jitter: 0.08,
  },
  features: {
    amp: 22,
    freq: 1.08,
    speed: 1.26,
    chaos: 0.88,
    tension: 0.24,
    straighten: 0.04,
    glow: 0.52,
    jitter: 0.24,
  },
  pricing: {
    amp: 4,
    freq: 0.38,
    speed: 0.7,
    chaos: 0.08,
    tension: 0.12,
    straighten: 0.92,
    glow: 0.2,
    jitter: 0.02,
  },
  singularity: {
    amp: 16,
    freq: 1.24,
    speed: 1.2,
    chaos: 0.74,
    tension: 0.32,
    straighten: 0.06,
    glow: 0.58,
    jitter: 0.2,
  },
  nova: {
    amp: 28,
    freq: 1.1,
    speed: 1.38,
    chaos: 1.1,
    tension: 0.38,
    straighten: 0,
    glow: 0.65,
    jitter: 0.3,
  },
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const seededNoise = (index: number, salt: number) => {
  const x = Math.sin(index * 78.233 + salt * 37.719) * 43758.5453123;
  return x - Math.floor(x);
};

const buildSmoothPath = (points: Array<{ x: number; y: number }>) => {
  if (points.length < 2) return "";
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];
    const midX = (current.x + next.x) * 0.5;
    const midY = (current.y + next.y) * 0.5;
    d += ` Q ${current.x.toFixed(2)} ${current.y.toFixed(2)} ${midX.toFixed(2)} ${midY.toFixed(2)}`;
  }
  const last = points[points.length - 1];
  d += ` T ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;
  return d;
};

gsap.registerPlugin(useGSAP);

export function LineField({ mode, burstSignal, className }: LineFieldProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pathsRef = useRef<SVGPathElement[]>([]);
  const rafRef = useRef<number | null>(null);
  const timeRef = useRef(0);

  const profileRef = useRef<LineProfile>({ ...MODE_PROFILE.product });
  const modeRef = useRef<ExtendedEnergyMode>("product");
  const pointerRef = useRef({
    x: WIDTH * 0.5,
    y: HEIGHT * 0.8,
    tx: WIDTH * 0.5,
    ty: HEIGHT * 0.8,
    speed: 0,
  });
  const burstRef = useRef({
    amount: 0,
    x: WIDTH * 0.5,
  });

  const seedsRef = useRef<Seed[]>(
    Array.from({ length: LINE_COUNT }, (_, i) => ({
      phase: (i / LINE_COUNT) * Math.PI * 2,
      laneOffset: (i - LINE_COUNT * 0.5) * 0.18,
      noiseA: seededNoise(i, 1) * Math.PI * 2,
      noiseB: seededNoise(i, 2) * Math.PI * 2,
    })),
  );

  useEffect(() => {
    modeRef.current = mode;
    const target = MODE_PROFILE[mode];
    gsap.to(profileRef.current, {
      ...target,
      duration: 1.15,
      ease: "power3.inOut",
    });
  }, [mode]);

  useEffect(() => {
    burstRef.current.amount = 1;
    burstRef.current.x = pointerRef.current.tx;
    gsap.to(burstRef.current, {
      amount: 0,
      duration: 1.1,
      ease: "power3.out",
    });
  }, [burstSignal]);

  useGSAP(() => {
    const onMove = (event: PointerEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const nx = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const ny = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      pointerRef.current.tx = nx * WIDTH;
      pointerRef.current.ty = ny * HEIGHT;
    };

    window.addEventListener("pointermove", onMove, { passive: true });

    const render = () => {
      timeRef.current += 0.012;
      const t = timeRef.current;
      const profile = profileRef.current;
      const activeMode = modeRef.current;
      const pointer = pointerRef.current;

      const prevX = pointer.x;
      const prevY = pointer.y;
      pointer.x = lerp(pointer.x, pointer.tx, 0.12);
      pointer.y = lerp(pointer.y, pointer.ty, 0.12);
      const moveSpeed = Math.hypot(pointer.x - prevX, pointer.y - prevY);
      pointer.speed = lerp(pointer.speed, clamp(moveSpeed * 0.18, 0, 1.4), 0.2);

      const speedChaos = clamp(pointer.speed * 0.95, 0, 1);
      const pulse = burstRef.current.amount;

      for (let lineIndex = 0; lineIndex < LINE_COUNT; lineIndex += 1) {
        const pathEl = pathsRef.current[lineIndex];
        if (!pathEl) continue;

        const seed = seedsRef.current[lineIndex];
        const laneRatio = lineIndex / (LINE_COUNT - 1);
        const laneY = lerp(HEIGHT * 0.58, HEIGHT * 0.965, laneRatio);
        const points: Array<{ x: number; y: number }> = [];

        if (activeMode === "singularity") {
          const cx = lerp(WIDTH * 0.5, pointer.x, 0.35);
          const cy = lerp(HEIGHT * 0.74, pointer.y, 0.2);
          const baseRadius = 16 + lineIndex * 2.1;
          for (let pointIndex = 0; pointIndex < POINT_COUNT; pointIndex += 1) {
            const p = pointIndex / (POINT_COUNT - 1);
            const theta = p * Math.PI * 2 + t * 0.95 + lineIndex * 0.045;
            const spiral = baseRadius + p * 48 + Math.sin(t * 3.2 + seed.noiseA + p * 8) * 10;
            const magnetic = Math.hypot(cx - pointer.x, cy - pointer.y) * 0.05 * profile.tension;
            const r = spiral + magnetic + pulse * 34 * (1 - p);
            const x = cx + Math.cos(theta) * r;
            const y = cy + Math.sin(theta) * (r * 0.72) + Math.sin(t * 5.4 + lineIndex * 0.3) * 3;
            points.push({ x, y });
          }
        } else if (activeMode === "nova") {
          const cx = lerp(WIDTH * 0.5, pointer.x, 0.5);
          const cy = lerp(HEIGHT * 0.72, pointer.y, 0.4);
          const baseAngle = (lineIndex / LINE_COUNT) * Math.PI * 2 + Math.sin(t + seed.noiseB) * 0.14;
          for (let pointIndex = 0; pointIndex < POINT_COUNT; pointIndex += 1) {
            const p = pointIndex / (POINT_COUNT - 1);
            const blast = pulse * 180;
            const radius = 12 + p * (WIDTH * 0.6 + blast) + Math.sin(t * 7 + p * 12 + seed.phase) * 9;
            const wobble = Math.sin(t * 8.6 + pointIndex + lineIndex * 0.2) * (10 * profile.jitter + 18 * speedChaos);
            const angle = baseAngle + Math.sin(t * 2.6 + p * 7 + seed.noiseA) * 0.16;
            const x = cx + Math.cos(angle) * radius + wobble * 0.22;
            const y = cy + Math.sin(angle) * (radius * 0.66) + wobble * 0.32;
            points.push({ x, y });
          }
        } else {
          for (let pointIndex = 0; pointIndex < POINT_COUNT; pointIndex += 1) {
            const x = (pointIndex / (POINT_COUNT - 1)) * WIDTH;
            const distToPointer = Math.hypot(x - pointer.x, laneY - pointer.y);
            const pointerInfluence = Math.exp(-(distToPointer * distToPointer) / 90000);
            const magneticY = (pointer.y - laneY) * pointerInfluence * profile.tension;

            const waveA =
              Math.sin((x / WIDTH) * Math.PI * 4 * profile.freq + t * profile.speed * 2.4 + seed.phase) *
              profile.amp;
            const waveB =
              Math.cos((x / WIDTH) * Math.PI * 3.2 + t * profile.speed * 1.45 + seed.noiseA) *
              (profile.amp * 0.34);
            const chaos =
              Math.sin((x / WIDTH) * Math.PI * 11.8 + t * 4.2 + seed.noiseB) *
              (18 * profile.chaos + 12 * speedChaos);
            const fragment =
              Math.sin(t * 8.8 + pointIndex * 0.9 + seed.phase) * profile.jitter * 11 * (0.5 + speedChaos);

            const shock = pulse * 30 * Math.exp(-Math.abs(x - burstRef.current.x) / 180);
            const shockWave = shock * Math.sin(t * 12 + lineIndex * 0.24 + pointIndex * 0.34);

            let y = laneY + waveA + waveB + magneticY + chaos + fragment + shockWave + seed.laneOffset;
            const straightY = laneY + seed.laneOffset * 0.3;
            y = lerp(y, straightY, profile.straighten);

            points.push({ x, y });
          }
        }

        pathEl.setAttribute("d", buildSmoothPath(points));
        const baseOpacity = 0.14 + (1 - laneRatio) * 0.16 + profile.glow * 0.18;
        pathEl.setAttribute("opacity", String(clamp(baseOpacity, 0.08, 0.56)));
      }

      rafRef.current = window.requestAnimationFrame(render);
    };

    rafRef.current = window.requestAnimationFrame(render);

    return () => {
      window.removeEventListener("pointermove", onMove);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      className={className}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="energy-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#cfd9ff" stopOpacity="0.2" />
          <stop offset="45%" stopColor="#8aa4ff" stopOpacity="0.7" />
          <stop offset="80%" stopColor="#9ee7ff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#f2f5ff" stopOpacity="0.15" />
        </linearGradient>
        <filter id="energy-glow" x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="1.3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {Array.from({ length: LINE_COUNT }).map((_, index) => (
        <path
          key={index}
          ref={(el) => {
            if (!el) return;
            pathsRef.current[index] = el;
          }}
          d=""
          fill="none"
          stroke="url(#energy-stroke)"
          strokeWidth="1"
          filter="url(#energy-glow)"
          opacity="0.2"
        />
      ))}
    </svg>
  );
}

