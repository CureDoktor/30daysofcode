"use client";

import { useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ExtendedEnergyMode, LineField } from "@/components/day20/line-field";

const NAV_ITEMS: Array<{ id: ExtendedEnergyMode; label: string }> = [
  { id: "product", label: "Product" },
  { id: "features", label: "Features" },
  { id: "pricing", label: "Pricing" },
  { id: "singularity", label: "Singularity" },
  { id: "nova", label: "Nova" },
];

const COPY: Record<ExtendedEnergyMode, { title: string; body: string }> = {
  product: {
    title: "Calm intelligence for product teams",
    body: "Balanced motion, elegant rhythm, and premium control for your next-gen product experience.",
  },
  features: {
    title: "Adaptive systems with controlled chaos",
    body: "Watch the interface destabilize in a refined way as features reveal dynamic complexity.",
  },
  pricing: {
    title: "Precision that feels engineered",
    body: "Structured, rigid, and sharp energy behavior tuned for clarity and decision-making.",
  },
  singularity: {
    title: "Singularity mode bends the entire field",
    body: "Lines collapse into orbital spirals and fluid vortices, then stretch into a new geometry in real time.",
  },
  nova: {
    title: "Nova mode erupts from a living core",
    body: "A central ring ignites and pushes dynamic rays outward, creating a premium controlled explosion system.",
  },
};

gsap.registerPlugin(useGSAP);

export function EnergySwitchingHero() {
  const [activeMode, setActiveMode] = useState<ExtendedEnergyMode>("product");
  const [hoverMode, setHoverMode] = useState<ExtendedEnergyMode | null>(null);
  const [burstSignal, setBurstSignal] = useState(0);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const badgeRef = useRef<HTMLSpanElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const bodyRef = useRef<HTMLParagraphElement | null>(null);
  const ctaRef = useRef<HTMLButtonElement | null>(null);

  const displayMode = hoverMode ?? activeMode;
  const copy = useMemo(() => COPY[displayMode], [displayMode]);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".d20-nav-shell", { y: -20, opacity: 0, duration: 0.7 })
        .from([badgeRef.current, titleRef.current, bodyRef.current], { y: 24, opacity: 0, stagger: 0.1, duration: 0.8 }, "-=0.35")
        .from(ctaRef.current, { y: 18, opacity: 0, duration: 0.65 }, "-=0.4");
    },
    { scope: rootRef },
  );

  useGSAP(() => {
    gsap.fromTo(
      [titleRef.current, bodyRef.current],
      { y: 8, opacity: 0.4, filter: "blur(6px)" },
      { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.6, ease: "power3.out", stagger: 0.05 },
    );
  }, [displayMode]);

  const triggerBurst = () => setBurstSignal((prev) => prev + 1);

  const handleNavHover = (mode: ExtendedEnergyMode) => {
    setHoverMode(mode);
    triggerBurst();
  };

  const handleNavClick = (mode: ExtendedEnergyMode) => {
    setActiveMode(mode);
    setHoverMode(null);
    triggerBurst();
  };

  return (
    <section
      ref={rootRef}
      className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_12%_16%,#edf1ff,transparent_42%),radial-gradient(circle_at_82%_8%,#e5fbff,transparent_40%),#f8faff] text-[#111629]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.6)_28%,rgba(248,250,255,0.06)_58%,rgba(248,250,255,0)_100%)]" />
      <LineField
        mode={displayMode}
        burstSignal={burstSignal}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />

      <div className="d20-nav-shell relative z-20 mx-auto flex w-full max-w-[1220px] items-center justify-between gap-3 px-4 pt-6 sm:px-8">
        <div className="rounded-full border border-[#dce5ff] bg-white/75 px-4 py-2 text-sm font-semibold tracking-[0.02em] text-[#202845] shadow-[0_6px_28px_rgba(101,124,194,0.14)] backdrop-blur-md">
          FluxFrame
        </div>
        <nav className="flex items-center gap-1 rounded-full border border-[#dae3ff] bg-white/78 p-1 shadow-[0_10px_30px_rgba(105,124,194,0.12)] backdrop-blur-md">
          {NAV_ITEMS.map((item) => {
            const isSelected = displayMode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onMouseEnter={() => handleNavHover(item.id)}
                onFocus={() => handleNavHover(item.id)}
                onMouseLeave={() => setHoverMode(null)}
                onBlur={() => setHoverMode(null)}
                onClick={() => handleNavClick(item.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  isSelected
                    ? "bg-[#121a32] text-[#f6f9ff] shadow-[0_10px_24px_rgba(13,22,48,0.26)]"
                    : "text-[#4a5578] hover:text-[#212a47]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
        <button
          ref={ctaRef}
          type="button"
          className="rounded-full border border-[#cfdcff] bg-[linear-gradient(135deg,#ffffff,#edf3ff_46%,#dfeaff)] px-5 py-2.5 text-sm font-semibold text-[#1d2643] shadow-[0_10px_28px_rgba(110,138,208,0.2)] transition-all duration-300 hover:translate-y-[-1px] hover:shadow-[0_14px_32px_rgba(100,132,212,0.28)]"
        >
          Start Building
        </button>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[76vh] w-full max-w-[980px] flex-col items-center justify-center px-6 text-center sm:px-10">
        <span
          ref={badgeRef}
          className="mb-5 rounded-full border border-[#dbe4ff] bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#4e5a82] shadow-[0_4px_24px_rgba(118,137,195,0.18)]"
        >
          Energy Switching UI
        </span>
        <h1
          ref={titleRef}
          className="max-w-4xl text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-[#10182f] sm:text-6xl"
        >
          {copy.title}
        </h1>
        <p
          ref={bodyRef}
          className="mt-5 max-w-2xl text-balance text-base leading-relaxed text-[#4c587f] sm:text-lg"
        >
          {copy.body}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            className="rounded-full bg-[#131d37] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_36px_rgba(21,31,56,0.36)] transition-all duration-300 hover:translate-y-[-1px] hover:bg-[#1a2544]"
          >
            Explore Product
          </button>
          <button
            type="button"
            className="rounded-full border border-[#cedafe] bg-white/75 px-6 py-3 text-sm font-semibold text-[#1c2748] shadow-[0_10px_24px_rgba(121,143,205,0.18)] transition-all duration-300 hover:translate-y-[-1px] hover:border-[#bfcdff]"
          >
            View Live Demo
          </button>
        </div>
      </div>
    </section>
  );
}

