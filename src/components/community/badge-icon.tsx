import {
  BadgeCheck,
  Cpu,
  Crown,
  Flame,
  Heart,
  HandHeart,
  Lock,
  MapPin,
  Package,
  ShieldCheck,
  Star,
  Trophy,
  Zap,
  type LucideProps,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { BadgeDef } from "@/lib/types";

const TONES: Record<BadgeDef["tone"], { from: string; to: string; ink: string; edge: string }> = {
  coral: { from: "#fff3f5", to: "#ffc2cf", ink: "#e11d48", edge: "#ffb0c0" },
  violet: { from: "#f8f4ff", to: "#d4bdff", ink: "#6a2fd0", edge: "#c6a9ff" },
  gold: { from: "#fffbe6", to: "#fcd96b", ink: "#b45309", edge: "#f7c948" },
  blue: { from: "#f1f5ff", to: "#b6c9ff", ink: "#2341b3", edge: "#9db8ff" },
  green: { from: "#effdf5", to: "#9fecc2", ink: "#0f7a4b", edge: "#7fe0ab" },
  navy: { from: "#eef1f8", to: "#b8c2dc", ink: "#1a2850", edge: "#a2aecb" },
};

/** Crescent + five stars — the Singapore flag motif (a Merlion is a lot to ask of 24 px). */
function SgGlyph({ className }: LucideProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M10.2 3.2a8.2 8.2 0 1 0 0 14.6 6.6 6.6 0 1 1 0-14.6Z" />
      {[
        [15.2, 5.6],
        [18.4, 8.1],
        [17.2, 11.9],
        [13.3, 11.9],
        [12.1, 8.1],
      ].map(([x, y], i) => (
        <path key={i} transform={`translate(${x} ${y}) scale(.26)`} d="M0-3 .9-.9 3-.9 1.3.4 2 2.5 0 1.2-2 2.5-1.3.4-3-.9-.9-.9Z" />
      ))}
    </svg>
  );
}

function Glyph({ glyph, className }: { glyph: BadgeDef["glyph"] } & LucideProps) {
  const p = { className, strokeWidth: 2.2, "aria-hidden": true } as const;
  switch (glyph) {
    case "heart":
      return <HandHeart {...p} />;
    case "bolt":
      return <Zap {...p} className={cn(className, "fill-current")} />;
    case "box":
      return <Package {...p} />;
    case "crown-box":
      return (
        <span className="relative inline-flex">
          <Package {...p} />
          <Crown className="absolute -right-1.5 -top-2 size-[45%] fill-current" strokeWidth={2} aria-hidden />
        </span>
      );
    case "trophy":
      return <Trophy {...p} />;
    case "merlion":
      return <SgGlyph className={className} />;
    case "shield":
      return <ShieldCheck {...p} />;
    case "flame":
      return <Flame {...p} className={cn(className, "fill-current")} />;
    case "pin":
      return <MapPin {...p} className={cn(className, "fill-current")} />;
    case "star":
      return <Star {...p} className={cn(className, "fill-current")} />;
    case "check":
      return <BadgeCheck {...p} />;
    case "chip":
      return <Cpu {...p} />;
    case "hand":
      return <Heart {...p} className={cn(className, "fill-current")} />;
  }
}

const SIZES = {
  sm: { box: "size-14", glyph: "size-6", lock: "size-4 -bottom-0.5 -right-0.5" },
  md: { box: "size-[4.5rem]", glyph: "size-8", lock: "size-5 -bottom-0.5 -right-0.5" },
  lg: { box: "size-24", glyph: "size-11", lock: "size-6 bottom-0 right-0" },
  xl: { box: "size-36", glyph: "size-16", lock: "size-8 bottom-1 right-1" },
};

export function BadgeIcon({
  def,
  earned = true,
  size = "md",
  className,
  animate,
}: {
  def: BadgeDef;
  earned?: boolean;
  size?: keyof typeof SIZES;
  className?: string;
  animate?: boolean;
}) {
  const t = TONES[def.tone];
  const s = SIZES[size];
  return (
    <span className={cn("relative inline-flex shrink-0", animate && "animate-pop", className)} role="img" aria-label={`${def.name} badge${earned ? "" : " (locked)"}`}>
      <span
        className={cn("inline-flex items-center justify-center rounded-[1.6rem]", s.box, !earned && "grayscale")}
        style={{
          backgroundImage: earned ? `linear-gradient(145deg, ${t.from}, ${t.to})` : "linear-gradient(145deg, #f1f3f8, #dfe3ee)",
          boxShadow: earned ? `inset 0 0 0 2px ${t.edge}66, 0 8px 18px -8px ${t.edge}` : "inset 0 0 0 2px #e6e9f2",
          color: earned ? t.ink : "#aab3c8",
        }}
      >
        <Glyph glyph={def.glyph} className={s.glyph} />
      </span>
      {!earned && (
        <span className={cn("absolute inline-flex items-center justify-center rounded-full bg-white text-navy-500 shadow", s.lock)}>
          <Lock className="size-[60%]" aria-hidden />
        </span>
      )}
    </span>
  );
}
