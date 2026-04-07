"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { motion } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import gsap from "gsap";

type CursorState = {
  x: number;
  y: number;
  lastX: number;
  lastY: number;
  dx: number;
  dy: number;
  targetSpeed: number;
  speed: number;
  dirX: number;
  dirY: number;
  idle: number;
  lastMoveAt: number;
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const seededNoise = (index: number, salt: number) => {
  const x = Math.sin(index * 91.137 + salt * 31.553) * 43758.5453123;
  return x - Math.floor(x);
};

function ReactiveField({ cursorRef }: { cursorRef: MutableRefObject<CursorState> }) {
  const pointsRef = useRef<THREE.Points | null>(null);
  const materialRef = useRef<THREE.PointsMaterial | null>(null);
  const { viewport } = useThree();

  const fieldData = useMemo(() => {
    const xCount = 108;
    const yCount = 62;
    const count = xCount * yCount;

    const p = new Float32Array(count * 3);
    const base = new Float32Array(count * 3);
    const n = new Float32Array(count);
    let ptr = 0;

    for (let y = 0; y < yCount; y += 1) {
      for (let x = 0; x < xCount; x += 1) {
        const nx = x / (xCount - 1);
        const ny = y / (yCount - 1);
        // Normalized unit field; real screen coverage is applied via group viewport scale.
        const px = nx - 0.5;
        const py = ny - 0.5;
        const pz = (seededNoise(ptr, 0.3) - 0.5) * 0.12;
        p[ptr * 3 + 0] = px;
        p[ptr * 3 + 1] = py;
        p[ptr * 3 + 2] = pz;
        base[ptr * 3 + 0] = px;
        base[ptr * 3 + 1] = py;
        base[ptr * 3 + 2] = pz;
        n[ptr] = seededNoise(ptr, 0.9);
        ptr += 1;
      }
    }
    return { positions: p, basePositions: base, noise: n };
  }, []);

  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;
    const control = { size: 0.028, opacity: 0.7 };
    const sizeTo = gsap.quickTo(control, "size", { duration: 0.2, ease: "power3.out" });
    const opacityTo = gsap.quickTo(control, "opacity", { duration: 0.3, ease: "power2.out" });

    const tick = () => {
      const c = cursorRef.current;
      const intensity = clamp(c.speed * 0.6 + c.idle * 0.2, 0, 1);
      sizeTo(lerp(0.028, 0.044, intensity));
      opacityTo(lerp(0.68, 0.96, intensity));

      material.size = control.size;
      material.opacity = control.opacity;
      material.color.setHSL(lerp(0.62, 0.55, intensity), 0.92, lerp(0.62, 0.72, intensity));
    };

    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [cursorRef]);

  useFrame((_, delta) => {
    const geometry = pointsRef.current?.geometry;
    if (!geometry) return;
    const attr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const array = attr.array as Float32Array;
    const base = fieldData.basePositions;
    const noise = fieldData.noise;
    const c = cursorRef.current;
    const t = performance.now() * 0.001;
    const speed01 = clamp(c.speed * 0.55, 0, 1.2);
    const cursorX = ((c.x / window.innerWidth) - 0.5) * viewport.width;
    const cursorY = (0.5 - (c.y / window.innerHeight)) * viewport.height;
    const blend = lerp(0.08, 0.22, clamp(speed01, 0, 1));

    // Core cursor intelligence: position + speed + direction + idle.
    for (let i = 0; i < attr.count; i += 1) {
      const i3 = i * 3;
      // Project normalized base field into current full viewport size.
      const bx = base[i3 + 0] * viewport.width;
      const by = base[i3 + 1] * viewport.height;
      const bz = base[i3 + 2];

      const dx = cursorX - bx;
      const dy = cursorY - by;
      const dist = Math.hypot(dx, dy);
      const inv = 1 / Math.max(dist, 0.05);
      const magnetic = clamp(0.5 * inv, 0, 0.55) * (1 + speed01 * 1.25);
      const influence = 1 - smoothstep(0, 2.2, dist);

      const flowX = (dx * inv) * magnetic * influence;
      const flowY = (dy * inv) * magnetic * influence;

      const wave =
        Math.sin((bx * 3.2) + t * 1.9 + noise[i] * 10) * (0.03 * viewport.height) +
        Math.cos((by * 4.1) - t * 1.3 + noise[i] * 7) * (0.02 * viewport.height);

      const chaos = Math.sin(t * (8 + speed01 * 10) + noise[i] * 23) * ((0.05 + speed01 * 0.22) * viewport.height);
      const idleDrift = Math.sin(t * 1.1 + noise[i] * 16) * (0.08 * viewport.height) * c.idle;

      const tx = bx + flowX + chaos * c.dirX * 0.7 + idleDrift;
      const ty = by + flowY + wave + chaos * c.dirY * 0.7;
      const tz = bz + Math.sin(t * 2 + noise[i] * 12) * 0.03 * c.idle;

      array[i3 + 0] = lerp(array[i3 + 0], tx, blend);
      array[i3 + 1] = lerp(array[i3 + 1], ty, blend);
      array[i3 + 2] = lerp(array[i3 + 2], tz, 0.08 + delta * 2.2);
    }
    attr.needsUpdate = true;

    if (pointsRef.current) {
      pointsRef.current.rotation.z = lerp(pointsRef.current.rotation.z, c.dirX * 0.08, 0.08);
      pointsRef.current.rotation.x = lerp(pointsRef.current.rotation.x, -c.dirY * 0.06, 0.08);
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[fieldData.positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        color="#86a0ff"
        size={0.028}
        opacity={0.78}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function AIReactiveCursorField() {
  const cursorRef = useRef<CursorState>({
    x: 0,
    y: 0,
    lastX: 0,
    lastY: 0,
    dx: 0,
    dy: 0,
    targetSpeed: 0,
    speed: 0,
    dirX: 0,
    dirY: 0,
    idle: 0,
    lastMoveAt: 0,
  });

  useEffect(() => {
    cursorRef.current.x = window.innerWidth * 0.5;
    cursorRef.current.y = window.innerHeight * 0.5;
    cursorRef.current.lastX = cursorRef.current.x;
    cursorRef.current.lastY = cursorRef.current.y;
    cursorRef.current.lastMoveAt = performance.now();

    const onPointerMove = (event: PointerEvent) => {
      const c = cursorRef.current;
      const now = performance.now();
      const dt = Math.max(8, now - c.lastMoveAt);

      c.lastX = c.x;
      c.lastY = c.y;
      c.x = event.clientX;
      c.y = event.clientY;
      c.dx = c.x - c.lastX;
      c.dy = c.y - c.lastY;
      c.dirX = lerp(c.dirX, clamp(c.dx / 28, -1, 1), 0.2);
      c.dirY = lerp(c.dirY, clamp(c.dy / 28, -1, 1), 0.2);
      c.targetSpeed = clamp((Math.hypot(c.dx, c.dy) / dt) * 2.1, 0, 2.6);
      c.lastMoveAt = now;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    let raf = 0;
    const update = () => {
      const c = cursorRef.current;
      const now = performance.now();
      const idleElapsed = now - c.lastMoveAt;
      c.speed = lerp(c.speed, c.targetSpeed, 0.16);
      c.targetSpeed *= 0.93;
      c.idle = lerp(c.idle, idleElapsed > 2000 ? 1 : 0, 0.04);
      raf = window.requestAnimationFrame(update);
    };
    raf = window.requestAnimationFrame(update);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#07070a]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_16%,rgba(74,117,255,0.24),transparent_42%),radial-gradient(circle_at_80%_26%,rgba(170,89,255,0.2),transparent_44%),radial-gradient(circle_at_50%_80%,rgba(70,200,255,0.14),transparent_52%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(132,150,255,0.18),transparent_34%,rgba(120,98,255,0.14)_62%,transparent_100%)]" />

      <Canvas
        camera={{ position: [0, 0, 3.2], fov: 48 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        className="pointer-events-none !absolute !inset-0 !z-0"
        style={{ position: "absolute", inset: 0 }}
      >
        <ReactiveField cursorRef={cursorRef} />
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.95} luminanceThreshold={0.06} luminanceSmoothing={0.7} mipmapBlur />
        </EffectComposer>
      </Canvas>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1200px] flex-col px-5 py-7 sm:px-10">
        <div className="pointer-events-none absolute left-1/2 top-18 -translate-x-1/2 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-[#a7b9e8] backdrop-blur">
          Move slowly = smooth • move fast = chaos • idle = breathing
        </div>
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#bdd2ff]"
          >
            Day 20 / 30
          </motion.div>
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.06, ease: "easeOut" }}
            className="rounded-full border border-[#7b8fff]/45 bg-[linear-gradient(135deg,rgba(106,127,255,0.28),rgba(173,82,255,0.24))] px-5 py-2 text-sm font-semibold text-[#e9eeff] backdrop-blur-sm transition-transform hover:scale-[1.02]"
          >
            Engage Field
          </motion.button>
        </div>

        <div className="mt-auto mb-14 max-w-3xl">
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.1, ease: "easeOut" }}
            className="text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-[#eef3ff] sm:text-6xl"
          >
            AI Reactive Cursor Field
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.2, ease: "easeOut" }}
            className="mt-4 max-w-2xl text-balance text-base leading-relaxed text-[#b3c2ea] sm:text-lg"
          >
            Fast motion pushes the system into chaos, slow movement returns fluid cinematic behavior, and idle lets
            the interface breathe on its own.
          </motion.p>
        </div>
      </div>
    </section>
  );
}

