"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/* ── Confetti ─────────────────────────────────────────────── */

const COLORS = ["#ff3b5c", "#2b4fdb", "#fbbf24", "#16b66a", "#8b5cf6", "#ff9fb0"];

/** Deterministic 0–1 value so SSR and client markup match. */
const rnd = (i: number, k: number) => {
  const x = Math.sin((i + 1) * k) * 10000;
  return x - Math.floor(x);
};

export function Confetti({ count = 30, className }: { count?: number; className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden", className)}>
      {Array.from({ length: count }, (_, i) => {
        const size = 6 + rnd(i, 5.31) * 7;
        return (
          <span
            key={i}
            className="absolute top-0 animate-confetti"
            style={
              {
                left: `${(5 + rnd(i, 12.98) * 90).toFixed(1)}%`,
                width: size.toFixed(1),
                height: (i % 3 === 0 ? size : size * 0.45).toFixed(1),
                borderRadius: i % 3 === 0 ? "9999px" : "2px",
                backgroundColor: COLORS[i % COLORS.length],
                animationDelay: `${(rnd(i, 11.13) * 0.4).toFixed(2)}s`,
                "--dx": `${((rnd(i, 78.23) - 0.5) * 170).toFixed(0)}px`,
                "--rot": `${(360 + rnd(i, 39.34) * 540).toFixed(0)}deg`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

/* ── Animated check ───────────────────────────────────────── */

const tones = {
  mint: { ring: "bg-mint-100", fill: "bg-mint-600", glow: "bg-mint-200" },
  coral: { ring: "bg-coral-100", fill: "bg-coral-600", glow: "bg-coral-200" },
  found: { ring: "bg-found-100", fill: "bg-found-600", glow: "bg-found-200" },
  gold: { ring: "bg-gold-100", fill: "bg-gold-500", glow: "bg-gold-200" },
} as const;

export function SuccessCheck({ tone = "mint", size = 88, icon }: { tone?: keyof typeof tones; size?: number; icon?: ReactNode }) {
  const t = tones[tone];
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <span className={cn("absolute inset-0 rounded-full animate-ping-soft", t.glow)} aria-hidden />
      <span className={cn("absolute inset-0 rounded-full", t.ring)} aria-hidden />
      <span className={cn("relative inline-flex items-center justify-center rounded-full text-white animate-pop", t.fill)} style={{ width: size * 0.68, height: size * 0.68 }}>
        {icon ?? (
          <svg viewBox="0 0 24 24" className="size-1/2" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="60" className="animate-draw" />
          </svg>
        )}
      </span>
    </span>
  );
}

/* ── Points counter ───────────────────────────────────────── */

export function PointsCounter({
  to,
  from = 0,
  duration = 900,
  className,
  prefix = "",
  suffix = "",
}: {
  to: number;
  from?: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}) {
  const [value, setValue] = useState(from);
  const start = useRef(from);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || from === to) {
      const id = requestAnimationFrame(() => setValue(to));
      return () => cancelAnimationFrame(id);
    }
    start.current = from;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, from, duration]);

  return (
    <span className={cn("tabular-nums", className)} aria-label={`${prefix}${to.toLocaleString("en-SG")}${suffix}`}>
      <span aria-hidden>
        {prefix}
        {value.toLocaleString("en-SG")}
        {suffix}
      </span>
    </span>
  );
}

/* ── Progress bar ─────────────────────────────────────────── */

export function ProgressBar({
  value,
  tone = "coral",
  className,
  label,
  height = "h-2.5",
}: {
  /** 0–1 */
  value: number;
  tone?: "coral" | "violet" | "gold" | "mint" | "found";
  className?: string;
  label: string;
  height?: string;
}) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(Math.max(0, Math.min(1, value))));
    return () => cancelAnimationFrame(id);
  }, [value]);
  const fill = {
    coral: "bg-gradient-to-r from-coral-400 to-coral-600",
    violet: "bg-gradient-to-r from-violet-400 to-violet-600",
    gold: "bg-gradient-to-r from-gold-300 to-gold-500",
    mint: "bg-gradient-to-r from-mint-400 to-mint-600",
    found: "bg-gradient-to-r from-found-400 to-found-600",
  }[tone];
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      className={cn("w-full overflow-hidden rounded-full bg-navy-100", height, className)}
    >
      <div className={cn("h-full rounded-full transition-[width] duration-1000 ease-out", fill)} style={{ width: `${shown * 100}%` }} />
    </div>
  );
}
