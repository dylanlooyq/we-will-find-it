import { BadgeCheck, Coins, HandHeart, PartyPopper, PawPrint, Search } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import type { ItemType } from "@/lib/types";

/* ── Generic pill ─────────────────────────────────────────── */

const tones = {
  neutral: "bg-navy-100 text-navy-700",
  coral: "bg-coral-100 text-coral-800",
  found: "bg-found-100 text-found-800",
  gold: "bg-gold-100 text-gold-800",
  mint: "bg-mint-100 text-mint-800",
  violet: "bg-violet-100 text-violet-800",
  dark: "bg-navy-900 text-white",
} as const;

export function Pill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: keyof typeof tones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}

/* ── Lost / Found / Pet / Reunited ────────────────────────── */

type StatusProps = {
  type: ItemType;
  pet?: boolean;
  resolved?: boolean;
  /** "solid" sits on photos; "soft" sits on white */
  variant?: "solid" | "soft";
  size?: "sm" | "md";
  className?: string;
};

/**
 * Status is always communicated with a text label AND an icon, never colour
 * alone — "LOST" vs "FOUND" survives greyscale and colour-blindness.
 */
export function StatusBadge({ type, pet, resolved, variant = "solid", size = "sm", className }: StatusProps) {
  const lost = type === "lost";
  let label = lost ? (pet ? "Lost pet" : "Lost") : pet ? "Found pet" : "Found";
  let Icon = pet ? PawPrint : lost ? Search : HandHeart;
  let style =
    variant === "solid"
      ? lost
        ? "bg-coral-600 text-white"
        : "bg-found-600 text-white"
      : lost
        ? "bg-coral-100 text-coral-800"
        : "bg-found-100 text-found-800";

  if (resolved) {
    label = pet ? "Reunited" : "Reunited";
    Icon = PartyPopper;
    style = variant === "solid" ? "bg-mint-700 text-white" : "bg-mint-100 text-mint-800";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg font-bold uppercase tracking-wide",
        size === "sm" ? "px-2 py-1 text-[0.68rem]" : "px-3 py-1.5 text-xs",
        style,
        className,
      )}
    >
      <Icon className={size === "sm" ? "size-3" : "size-3.5"} aria-hidden strokeWidth={2.5} />
      {label}
    </span>
  );
}

/* ── Bounty ───────────────────────────────────────────────── */

export function BountyBadge({
  amount,
  variant = "solid",
  size = "sm",
  label = true,
  className,
}: {
  amount: number;
  variant?: "solid" | "soft";
  size?: "sm" | "md" | "lg";
  label?: boolean;
  className?: string;
}) {
  const sizes = {
    sm: "px-2 py-1 text-[0.72rem] gap-1",
    md: "px-3 py-1.5 text-sm gap-1.5",
    lg: "px-4 py-2 text-base gap-2",
  }[size];
  const icon = { sm: "size-3.5", md: "size-4", lg: "size-5" }[size];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg font-extrabold",
        sizes,
        variant === "solid" ? "bg-gold-300 text-navy-900 shadow-soft" : "bg-gold-100 text-gold-800",
        className,
      )}
    >
      <Coins className={cn(icon, "text-gold-700")} aria-hidden strokeWidth={2.5} />
      <span>{formatMoney(amount)}</span>
      {label && <span className="font-bold opacity-80">Bounty</span>}
    </span>
  );
}

/* ── Verified tick ────────────────────────────────────────── */

export function VerifiedMark({ className, label = "Verified" }: { className?: string; label?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-found-700", className)}>
      <BadgeCheck className="size-4 fill-found-100" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}
