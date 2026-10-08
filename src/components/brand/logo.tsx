import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * wewillfind.it brand mark (concept 05 — "Bold & Distinctive").
 * A map pin whose hollow + diagonal slit read as a question mark, with a
 * ground shadow beneath. One path, so it works in the header, the favicon,
 * loading screens and OpenGraph cards alike.
 */
export const MARK_VIEWBOX = "150 120 540 700";
export const MARK_ASPECT = 540 / 700;
export const MARK_PATH =
  "M 214.1 551 A 261 261 0 1 1 582.2 590.7 L 437 710 Q 420 724 402.9 710.3 L 290 619.7 L 440 483.5 A 98 98 0 1 0 342.1 450 Z";

type MarkProps = {
  /** Rendered height in px */
  size?: number;
  /** Solid fill instead of the brand gradient (e.g. white on coral) */
  mono?: string;
  /** Hide the ground shadow (tight spaces) */
  noShadow?: boolean;
  className?: string;
};

export function LogoMark({ size = 36, mono, noShadow, className }: MarkProps) {
  const id = useId();
  const grad = `lm-${id.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      viewBox={MARK_VIEWBOX}
      width={size * MARK_ASPECT}
      height={size}
      role="img"
      aria-label="wewillfind.it"
      className={cn("shrink-0", className)}
    >
      {!mono && (
        <defs>
          <linearGradient id={grad} x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0" stopColor="#ff5f7e" />
            <stop offset="1" stopColor="#e5184a" />
          </linearGradient>
        </defs>
      )}
      <path d={MARK_PATH} fill={mono ?? `url(#${grad})`} />
      {!noShadow && (
        <ellipse cx="418" cy="787" rx="128" ry="22" fill={mono ?? "#e5184a"} opacity={mono ? 0.55 : 1} />
      )}
    </svg>
  );
}

type LogoProps = {
  variant?: "horizontal" | "stacked";
  /** Height of the mark in px */
  size?: number;
  /** "light" is for navy / coral surfaces */
  tone?: "default" | "light";
  tagline?: boolean;
  className?: string;
};

export function Logo({ variant = "horizontal", size = 34, tone = "default", tagline, className }: LogoProps) {
  const ink = tone === "light" ? "text-white" : "text-navy-900";
  // The vivid coral only clears 3:1 (large text); small wordmarks use the AA-safe shade.
  const accent = tone === "light" ? "text-coral-300" : size >= 30 ? "text-coral-500" : "text-coral-600";

  if (variant === "stacked") {
    return (
      <span className={cn("inline-flex flex-col items-center gap-3", className)}>
        <span className="inline-flex items-center gap-4">
          <LogoMark size={size * 1.9} mono={tone === "light" ? "#fff" : undefined} />
          <span className={cn("flex flex-col leading-[0.92] font-extrabold tracking-tight", ink)} style={{ fontSize: size * 1.05 }}>
            <span>wewill</span>
            <span>
              find<span className={accent}>.it</span>
            </span>
          </span>
        </span>
        {tagline && (
          <span
            className={cn("font-semibold uppercase tracking-[0.28em] opacity-70", ink)}
            style={{ fontSize: Math.max(9, size * 0.2) }}
          >
            Singapore&rsquo;s lost &amp; found community
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} noShadow mono={tone === "light" ? "#fff" : undefined} />
      <span className={cn("font-extrabold tracking-tight leading-none", ink)} style={{ fontSize: size * 0.62 }}>
        wewillfind<span className={accent}>.it</span>
      </span>
    </span>
  );
}
