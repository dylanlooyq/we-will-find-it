"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, MapPin, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { getLocation } from "@/lib/data/taxonomy";
import { formatDistance } from "@/lib/geo";
import { useMatches, useWorld } from "@/lib/store/hooks";
import { actions } from "@/lib/store/store";
import type { Item } from "@/lib/types";
import { Button } from "../ui/button";
import { ItemImage } from "../ui/item-image";
import { RelativeTime } from "../ui/meta";
import { StatusBadge } from "../ui/badges";

/** Circular score — 95% reads at a glance, colour tells you how strong. */
export function MatchScore({ score, size = 56 }: { score: number; size?: number }) {
  const tone = score >= 90 ? "#12935a" : score >= 75 ? "#f59e0b" : "#8793b3";
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={`${score}% match`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e9edf6" strokeWidth="5" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />
      </svg>
      <span className="absolute text-[0.82rem] font-extrabold tabular-nums text-navy-900">{score}%</span>
    </span>
  );
}

/**
 * "Potential Matches" for a listing. Powered by the pluggable matching service
 * (see src/lib/matching.ts) — swap in a real engine without touching this UI.
 */
export function MatchesSection({ item, owner }: { item: Item; owner: boolean }) {
  const matches = useMatches(item);
  const w = useWorld();
  const router = useRouter();
  if (matches.length === 0) return null;

  return (
    <section aria-labelledby="matches-h" className="rounded-card bg-gradient-to-br from-violet-50 to-white p-5 ring-1 ring-violet-100 sm:p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <div>
          <h2 id="matches-h" className="text-lg font-extrabold text-navy-900">
            Potential matches
          </h2>
          <p className="text-sm text-navy-600">{owner ? "We found listings that could be yours." : "Listings that look related to this one."}</p>
        </div>
      </div>
      <ul className="mt-5 space-y-3">
        {matches.map((m) => {
          const confirmed = w.points.some((p) => p.kind === "confirm_match" && p.itemId === m.foundItemId);
          const foundIsOther = item.type === "lost";
          return (
            <li key={m.id} className="group relative flex items-center gap-3.5 rounded-2xl bg-white p-3 shadow-soft transition-shadow hover:shadow-lift">
              <MatchScore score={m.score} />
              <ItemImage image={m.other.images[0]} category={m.other.category} compact className="size-16 shrink-0 rounded-xl max-sm:hidden" />
              <div className="min-w-0 flex-1">
                <StatusBadge type={m.other.type} variant="soft" />
                <p className="mt-1 truncate text-[0.95rem] font-extrabold text-navy-900">
                  <Link href={`/item/${m.other.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-2xl">
                    {m.other.title}
                  </Link>
                </p>
                <p className="flex items-center gap-1 truncate text-xs text-navy-600">
                  <MapPin className="size-3 shrink-0 text-coral-600" aria-hidden />
                  {getLocation(m.other.locationId).name} · {formatDistance(m.distanceKm)} · <RelativeTime iso={m.other.postedAt} />
                </p>
                {m.reasons.length > 0 && <p className="mt-1 hidden truncate text-[0.7rem] font-semibold text-violet-700 sm:block">{m.reasons.join(" · ")}</p>}
              </div>
              {owner && foundIsOther && (
                <Button
                  size="sm"
                  variant={confirmed ? "secondary" : "dark"}
                  className={cn("relative z-10 shrink-0", confirmed && "text-mint-700")}
                  iconLeft={confirmed ? <Check className="size-4" /> : undefined}
                  onClick={() => {
                    const id = actions.confirmMatch(item.id, m.foundItemId);
                    if (id) router.push(`/messages/${id}`);
                  }}
                >
                  {confirmed ? "Confirmed" : "It's mine"}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
