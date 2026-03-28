"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

type ParticleMeta = {
  angle: number;
  radius: number;
  speed: number;
  offset: number;
  twinkle: number;
  alpha: number;
  scale: number;
};

const PARTICLE_COUNT = 14;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function MagneticOrb() {
  const containerRef = useRef<HTMLDivElement>(null);
  const orbWrapRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const particleRefs = useRef<HTMLDivElement[]>([]);

  const pointerRef = useRef({
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    px: 0,
    py: 0,
    speed: 0,
    lastInput: 0,
    autoDemo: true,
    phase: 0
  });

  const orbRefState = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    centerX: 0,
    centerY: 0,
    proximity: 0,
    blob: 0,
    blobPhase: 0
  });

  const particlesRef = useRef<ParticleMeta[]>([]);

  useGSAP(
    () => {
      const container = containerRef.current;
      const orbWrap = orbWrapRef.current;
      const orb = orbRef.current;
      const glow = glowRef.current;
      const shadow = shadowRef.current;
      if (!container || !orbWrap || !orb || !glow || !shadow) return;

      const ptr = pointerRef.current;
      const orbState = orbRefState.current;
      let width = 0;
      let height = 0;
      let lastMs = performance.now();
      if (ptr.lastInput === 0) {
        ptr.lastInput = performance.now();
      }

      if (particlesRef.current.length === 0) {
        particlesRef.current = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
          angle: (Math.PI * 2 * i) / PARTICLE_COUNT,
          radius: 86 + Math.random() * 36,
          speed: 0.004 + Math.random() * 0.006,
          offset: Math.random() * Math.PI * 2,
          twinkle: 1 + Math.random() * 2.2,
          alpha: 0.3 + Math.random() * 0.45,
          scale: 0.55 + Math.random() * 0.9
        }));
      }

      const setOrbX = gsap.quickSetter(orbWrap, "x", "px");
      const setOrbY = gsap.quickSetter(orbWrap, "y", "px");

      const orbScaleTo = gsap.quickTo(orbWrap, "scale", { duration: 0.45, ease: "power3.out" });
      const orbScaleXTo = gsap.quickTo(orb, "scaleX", { duration: 0.38, ease: "power3.out" });
      const orbScaleYTo = gsap.quickTo(orb, "scaleY", { duration: 0.38, ease: "power3.out" });
      const orbRotateTo = gsap.quickTo(orb, "rotation", { duration: 0.5, ease: "power3.out" });
      const setOrbBorderRadius = gsap.quickSetter(orb, "borderRadius");

      const glowOpacityTo = gsap.quickTo(glow, "opacity", { duration: 0.35, ease: "power3.out" });
      const glowScaleTo = gsap.quickTo(glow, "scale", { duration: 0.45, ease: "power3.out" });

      const shadowOpacityTo = gsap.quickTo(shadow, "opacity", { duration: 0.35, ease: "power3.out" });
      const shadowScaleXTo = gsap.quickTo(shadow, "scaleX", { duration: 0.45, ease: "power3.out" });
      const shadowScaleYTo = gsap.quickTo(shadow, "scaleY", { duration: 0.45, ease: "power3.out" });
      const shadowXTo = gsap.quickTo(shadow, "x", { duration: 0.45, ease: "power3.out" });
      const shadowYTo = gsap.quickTo(shadow, "y", { duration: 0.45, ease: "power3.out" });

      const particleSetters = particleRefs.current.map((el) => ({
        x: gsap.quickSetter(el, "x", "px"),
        y: gsap.quickSetter(el, "y", "px"),
        opacity: gsap.quickSetter(el, "opacity"),
        scale: gsap.quickSetter(el, "scale")
      }));

      const recenter = () => {
        const rect = container.getBoundingClientRect();
        width = rect.width;
        height = rect.height;

        orbState.centerX = width * 0.5;
        orbState.centerY = height * 0.5;

        if (orbState.x === 0 && orbState.y === 0) {
          orbState.x = orbState.centerX;
          orbState.y = orbState.centerY;
        }

        if (ptr.tx === 0 && ptr.ty === 0) {
          ptr.x = orbState.centerX;
          ptr.y = orbState.centerY;
          ptr.tx = orbState.centerX;
          ptr.ty = orbState.centerY;
          ptr.px = orbState.centerX;
          ptr.py = orbState.centerY;
        }
      };

      const onPointerMove = (event: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        ptr.tx = event.clientX - rect.left;
        ptr.ty = event.clientY - rect.top;
        ptr.autoDemo = false;
        ptr.lastInput = performance.now();
      };

      recenter();
      container.addEventListener("pointermove", onPointerMove);
      window.addEventListener("resize", recenter);

      gsap.ticker.add((time, deltaTime) => {
        const now = performance.now();
        const dt = clamp(deltaTime / 16.67, 0.75, 1.9);

        if (now - ptr.lastInput > 2200) {
          ptr.autoDemo = true;
        }

        if (ptr.autoDemo) {
          ptr.phase += dt * 0.015;
          ptr.tx = orbState.centerX + Math.cos(ptr.phase * 1.6) * (width * 0.23);
          ptr.ty = orbState.centerY + Math.sin(ptr.phase * 2.3) * (height * 0.2);
        }

        ptr.x = lerp(ptr.x, ptr.tx, 0.14 * dt);
        ptr.y = lerp(ptr.y, ptr.ty, 0.14 * dt);

        const pdx = ptr.x - ptr.px;
        const pdy = ptr.y - ptr.py;
        ptr.speed = lerp(ptr.speed, Math.hypot(pdx, pdy) / Math.max(now - lastMs, 1), 0.2);
        ptr.px = ptr.x;
        ptr.py = ptr.y;
        lastMs = now;

        const toPointerX = ptr.x - orbState.centerX;
        const toPointerY = ptr.y - orbState.centerY;
        const distToCenter = Math.hypot(toPointerX, toPointerY);
        const maxInfluence = Math.min(width, height) * 0.42;
        const proximity = clamp(1 - distToCenter / maxInfluence, 0, 1);
        orbState.proximity = lerp(orbState.proximity, proximity, 0.12);

        const maxShift = 34;
        const strength = Math.pow(orbState.proximity, 1.6);
        const targetX = orbState.centerX + (distToCenter > 0 ? (toPointerX / distToCenter) * maxShift * strength : 0);
        const targetY = orbState.centerY + (distToCenter > 0 ? (toPointerY / distToCenter) * maxShift * strength : 0);

        const inertiaGain = clamp(ptr.speed * 26, 0, 16);
        const targetWithLagX = targetX + pdx * inertiaGain;
        const targetWithLagY = targetY + pdy * inertiaGain;

        orbState.vx = (orbState.vx + (targetWithLagX - orbState.x) * 0.09 * dt) * 0.83;
        orbState.vy = (orbState.vy + (targetWithLagY - orbState.y) * 0.09 * dt) * 0.83;
        orbState.x += orbState.vx;
        orbState.y += orbState.vy;

        const orbToCursorX = ptr.x - orbState.x;
        const orbToCursorY = ptr.y - orbState.y;
        const orbDist = Math.hypot(orbToCursorX, orbToCursorY);
        const orbNear = clamp(1 - orbDist / 170, 0, 1);

        const deform = 0.08 * orbNear + clamp(ptr.speed * 0.7, 0, 0.08);
        const angle = Math.atan2(orbToCursorY, orbToCursorX);
        const squash = Math.cos(angle * 2) * deform;
        orbState.blob = lerp(orbState.blob, orbNear + clamp(ptr.speed * 0.6, 0, 0.4), 0.14);
        orbState.blobPhase += 0.06 * dt + ptr.speed * 0.04;

        const amp = 8 * orbState.blob;
        const p = orbState.blobPhase;
        const r1 = 50 + Math.sin(p) * amp;
        const r2 = 50 + Math.cos(p * 0.9 + 1.1) * amp * 0.82;
        const r3 = 50 + Math.sin(p * 1.15 + 2.4) * amp * 0.78;
        const r4 = 50 + Math.cos(p * 1.06 + 3.2) * amp * 0.74;
        const r5 = 50 + Math.sin(p * 0.87 + 0.5) * amp * 0.72;
        const r6 = 50 + Math.cos(p * 1.21 + 1.6) * amp * 0.86;
        const r7 = 50 + Math.sin(p * 1.02 + 2.7) * amp * 0.76;
        const r8 = 50 + Math.cos(p * 0.93 + 3.9) * amp * 0.7;
        setOrbBorderRadius(`${r1}% ${r2}% ${r3}% ${r4}% / ${r5}% ${r6}% ${r7}% ${r8}%`);

        setOrbX(orbState.x - orbState.centerX);
        setOrbY(orbState.y - orbState.centerY);
        orbScaleTo(1 + orbNear * 0.08);
        orbScaleXTo(1 + deform + squash);
        orbScaleYTo(1 - deform + squash * 0.35);
        orbRotateTo((angle * 180) / Math.PI * (0.12 + orbNear * 0.1));

        glowOpacityTo(0.07 + orbNear * 0.22);
        glowScaleTo(1 + orbNear * 0.3);

        shadowOpacityTo(0.12 + orbNear * 0.14);
        shadowScaleXTo(1.02 + orbNear * 0.25);
        shadowScaleYTo(1 + orbNear * 0.12);
        shadowXTo((orbState.x - orbState.centerX) * 0.45);
        shadowYTo((orbState.y - orbState.centerY) * 0.28);

        const t = time * 0.9;
        for (let i = 0; i < particlesRef.current.length; i += 1) {
          const p = particlesRef.current[i];
          p.angle += p.speed * (1 + orbNear * 1.1) * dt;

          const jitter = Math.sin(t + p.offset * 2.6) * 4;
          const radius = p.radius + jitter - orbNear * 8;
          let px = orbState.x + Math.cos(p.angle + p.offset) * radius;
          let py = orbState.y + Math.sin(p.angle * 1.04 + p.offset) * (radius * 0.84);

          const dx = px - ptr.x;
          const dy = py - ptr.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 120 && dist > 0.001) {
            const push = (1 - dist / 120) * 10;
            px += (dx / dist) * push;
            py += (dy / dist) * push;
          }

          const twinkle = 0.55 + 0.45 * Math.sin(t * p.twinkle + p.offset);
          const alpha = p.alpha * twinkle * (0.35 + orbNear * 0.95);

          const setter = particleSetters[i];
          if (!setter) continue;
          setter.x(px);
          setter.y(py);
          setter.opacity(alpha);
          setter.scale(p.scale + orbNear * 0.6);
        }
      });

      return () => {
        container.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("resize", recenter);
      };
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="relative h-screen w-screen overflow-hidden bg-white">
      <div
        ref={glowRef}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(90,108,255,0.35),rgba(110,55,255,0.14),transparent_72%)] opacity-0 blur-2xl"
      />

      <div
        ref={shadowRef}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[70px] w-[150px] -translate-x-1/2 translate-y-[74px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(16,24,45,0.28),rgba(16,24,45,0))] blur-xl"
      />

      <div ref={orbWrapRef} className="pointer-events-none absolute left-1/2 top-1/2 will-change-transform">
        <div
          ref={orbRef}
          className="relative h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_30%_26%,#3f58d6_0%,#302275_52%,#121124_100%)] shadow-[inset_-10px_-18px_24px_rgba(0,0,0,0.5),inset_8px_10px_14px_rgba(255,255,255,0.08)] will-change-transform"
        >
          <div className="absolute left-[18%] top-[15%] h-[34%] w-[34%] rounded-full bg-white/30 blur-[2px]" />
          <div className="absolute inset-[12%] rounded-full border border-white/20" />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
          <div
            key={i}
            ref={(node) => {
              if (node) particleRefs.current[i] = node;
            }}
            className="absolute left-0 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-700/80 shadow-[0_0_12px_rgba(93,102,255,0.38)] opacity-0 will-change-transform"
          />
        ))}
      </div>
    </div>
  );
}
