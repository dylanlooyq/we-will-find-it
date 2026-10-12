"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { relTime, relTimeShort } from "@/lib/format";
import { useNow } from "@/lib/store/hooks";

/** "2 hours ago" that stays correct as time passes, and never hydration-mismatches. */
export function RelativeTime({ iso, short, className }: { iso: string; short?: boolean; className?: string }) {
  const now = useNow();
  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {short ? relTimeShort(iso, now) : relTime(iso, now)}
    </time>
  );
}

/** Five stars with fractional fill — "⭐⭐⭐⭐⭐ 4.9". */
export function Stars({
  rating,
  reviews,
  size = "sm",
  className,
  showNumber = true,
}: {
  rating: number;
  reviews?: number;
  size?: "sm" | "md";
  className?: string;
  showNumber?: boolean;
}) {
  const dim = size === "sm" ? "size-4" : "size-5";
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="relative inline-flex" role="img" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
        <span className="flex text-navy-200">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className={cn(dim, "fill-current")} aria-hidden />
          ))}
        </span>
        <span className="absolute inset-y-0 left-0 flex overflow-hidden text-gold-400" style={{ width: `${(rating / 5) * 100}%` }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className={cn(dim, "shrink-0 fill-current")} aria-hidden />
          ))}
        </span>
      </span>
      {showNumber && (
        <span className="text-sm font-bold text-navy-900">
          {rating.toFixed(1)}
          {reviews !== undefined && <span className="ml-1 font-medium text-navy-500">({reviews})</span>}
        </span>
      )}
    </span>
  );
}
