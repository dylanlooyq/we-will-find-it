import { Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { LEVELS, levelFor, levelProgress } from "@/lib/levels";
import { formatNumber } from "@/lib/format";
import { ProgressBar } from "../ui/feedback";

/** "Level 5 · Community Hero" */
export function UserLevel({ points, className, tone = "coral" }: { points: number; className?: string; tone?: "coral" | "plain" | "light" }) {
  const lv = levelFor(points);
  const style = {
    coral: "bg-coral-50 text-coral-700",
    plain: "bg-navy-100 text-navy-700",
    light: "bg-white/15 text-white",
  }[tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold", style, className)}>
      <span>Level {lv.level}</span>
      <span aria-hidden className="opacity-50">
        ·
      </span>
      <span>{lv.title}</span>
    </span>
  );
}

/** "+30 pts" — earned points, or a standing total when `plain`. */
export function PointsBadge({ points, plain, className }: { points: number; plain?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold tabular-nums",
        plain ? "bg-violet-100 text-violet-800" : "bg-mint-100 text-mint-800",
        className,
      )}
    >
      {!plain && <Sparkles className="size-3" aria-hidden />}
      {plain ? "" : "+"}
      {formatNumber(points)} pts
    </span>
  );
}

/** Level ladder with the user's position — "Level 5 → 6". */
export function LevelProgress({ points, className, children }: { points: number; className?: string; children?: React.ReactNode }) {
  const p = levelProgress(points);
  return (
    <div className={cn("rounded-card bg-white p-5 shadow-soft", className)}>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow text-coral-700">Level {p.level.level}</p>
          <h3 className="mt-0.5 text-2xl font-extrabold leading-tight text-navy-900">{p.level.title}</h3>
        </div>
        <div className="shrink-0 text-right">
          <p className="whitespace-nowrap text-2xl font-extrabold tabular-nums leading-none text-navy-900">{formatNumber(points)}</p>
          <p className="mt-1 whitespace-nowrap text-xs font-semibold text-navy-500">{p.level.next !== null ? `of ${formatNumber(p.level.next)} pts` : "points"}</p>
        </div>
      </div>
      <ProgressBar value={p.ratio} label={`Progress to ${p.nextTitle ?? "max level"}`} className="mt-4" height="h-3" />
      <p className="mt-2 text-sm text-navy-600">
        {p.toNext !== null ? (
          <>
            <strong className="text-navy-900">{formatNumber(p.toNext)} points</strong> to reach <strong className="text-navy-900">{p.nextTitle}</strong>
          </>
        ) : (
          "You've reached the top level. Legend status unlocked."
        )}
      </p>

      <ol className="mt-6 grid grid-cols-6 gap-1" aria-label="Level ladder">
        {LEVELS.map((l) => {
          const reached = points >= l.min;
          const current = l.level === p.level.level;
          return (
            <li key={l.level} className="flex flex-col items-center text-center" aria-current={current ? "step" : undefined}>
              <span
                title={`${l.title} · ${formatNumber(l.min)} pts`}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-xs font-extrabold ring-2 transition-all",
                  reached ? "bg-coral-600 text-white ring-coral-200" : "bg-navy-100 text-navy-400 ring-transparent",
                  current && "scale-110 ring-4 ring-coral-200",
                )}
              >
                {reached ? l.level : <Lock className="size-3" aria-label="Locked" />}
              </span>
              <span className={cn("mt-2 text-[0.68rem] font-bold tabular-nums", current ? "text-coral-700" : "text-navy-400")}>{l.min >= 1000 ? "1k" : l.min}</span>
              <span className="sr-only">{l.title}</span>
            </li>
          );
        })}
      </ol>
      {children}
    </div>
  );
}
