import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Shimmering placeholder — always aria-hidden; pair with a visible loading label upstream. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded-xl", className)} />;
}

export function ItemCardSkeleton() {
  return (
    <div aria-hidden className="overflow-hidden rounded-card bg-white shadow-soft">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-4 w-2/5" />
      </div>
    </div>
  );
}

type EmptyProps = {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  tone?: "coral" | "found" | "gold" | "neutral";
  className?: string;
};

/** Every list gets a friendly empty state with a way forward. */
export function EmptyState({ icon, title, body, action, tone = "neutral", className }: EmptyProps) {
  const bg = { coral: "bg-coral-50 text-coral-600", found: "bg-found-50 text-found-600", gold: "bg-gold-50 text-gold-600", neutral: "bg-navy-100 text-navy-500" }[tone];
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      <div className={cn("flex size-20 items-center justify-center rounded-full", bg)}>{icon}</div>
      <h3 className="mt-5 text-xl font-extrabold text-navy-900">{title}</h3>
      {body && <p className="mt-2 max-w-sm text-[0.95rem] leading-relaxed text-navy-600">{body}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
