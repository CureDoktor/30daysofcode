"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

type LiveCounterProps = {
  count: number;
};

export function LiveCounter({ count }: LiveCounterProps) {
  const spring = useSpring(count, { stiffness: 70, damping: 18 });
  const display = useTransform(spring, (value) => Math.round(value).toLocaleString());

  useEffect(() => {
    spring.set(count);
  }, [count, spring]);

  return (
    <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-md">
      <p className="text-[0.65rem] uppercase tracking-[0.2em] text-cyan-200/80">Live Counter</p>
      <motion.p className="text-2xl font-semibold text-white sm:text-3xl">{display}</motion.p>
      <p className="text-sm text-indigo-100/70">developers joined</p>
    </div>
  );
}
