import { cn } from "@/lib/cn";
import type { BadgeProgress } from "@/lib/types";
import { BadgeIcon } from "./badge-icon";

/** A single collectible: full colour when earned, greyed with a progress hint when locked. */
export function BadgeCard({ badge, className }: { badge: BadgeProgress; className?: string }) {
  const { def, earned, progress, goal } = badge;
  const pct = goal > 0 ? Math.round((progress / goal) * 100) : 0;
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-card border p-4 text-center transition-all",
        earned ? "border-line bg-white shadow-soft hover:-translate-y-0.5 hover:shadow-lift" : "border-line/70 bg-navy-50/70",
        className,
      )}
    >
      <BadgeIcon def={def} earned={earned} size="lg" />
      <h3 className={cn("mt-3 text-sm font-extrabold leading-tight", earned ? "text-navy-900" : "text-navy-500")}>{def.name}</h3>
      <p className={cn("mt-1 text-xs leading-snug", earned ? "text-navy-600" : "text-navy-500")}>{def.description}</p>
      {!earned && goal > 1 && (
        <div className="mt-2.5 w-full">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy-200" role="progressbar" aria-label={`${def.name} progress`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-navy-400" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-[0.7rem] font-semibold text-navy-500">
            {progress.toLocaleString("en-SG")} / {goal.toLocaleString("en-SG")}
          </p>
        </div>
      )}
      {earned && <span className="mt-2 rounded-full bg-mint-100 px-2 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide text-mint-800">Earned</span>}
    </div>
  );
}
