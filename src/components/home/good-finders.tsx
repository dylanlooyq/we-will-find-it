"use client";

import Link from "next/link";
import { ArrowRight, PartyPopper, Sparkles } from "lucide-react";
import { getLocation } from "@/lib/data/taxonomy";
import { useWorld } from "@/lib/store/hooks";
import { leaderboard, pointsFor } from "@/lib/world";
import { UserLevel } from "../community/level";
import { UserAvatar } from "../ui/avatar";
import { VerifiedMark } from "../ui/badges";
import { ItemImage } from "../ui/item-image";
import { RelativeTime } from "../ui/meta";
import { Container, Rail, RailItem, SectionHeader } from "../ui/section";

/** Community members who recently helped return something, plus fresh reunions. */
export function GoodFinders() {
  const w = useWorld();
  const finders = leaderboard(w, "month").slice(0, 4);
  const reunions = w.items
    .filter((i) => i.status === "resolved" && i.moderation === "ok")
    .sort((a, b) => Date.parse(b.resolvedAt ?? b.postedAt) - Date.parse(a.resolvedAt ?? a.postedAt))
    .slice(0, 3);

  return (
    <Container as="section" className="pt-16 sm:pt-24">
      <SectionHeader
        eyebrow="Community"
        title="Good Finders"
        body="Neighbours who recently went out of their way to return someone's things."
        href="/leaderboard"
        hrefLabel="Leaderboard"
      />

      <div className="mt-7">
        <Rail>
          {finders.map((u, i) => {
            const last = pointsFor(w, u.id)[0];
            return (
              <RailItem key={u.id}>
                <article className="group relative h-full rounded-card bg-white p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-lift">
                  <div className="flex items-start justify-between">
                    <UserAvatar user={u} size="xl" tick ring={i === 0 ? "gold" : "none"} />
                    {i === 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2.5 py-1 text-xs font-extrabold text-gold-800">
                        <Sparkles className="size-3" aria-hidden /> Top this month
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 flex items-center gap-1.5 text-lg font-extrabold text-navy-900">
                    <Link href={`/user/${u.handle}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-card">
                      {u.name}
                    </Link>
                    <VerifiedMark />
                  </h3>
                  <UserLevel points={u.points.allTime} className="mt-1.5" />
                  <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
                    <div>
                      <dt className="text-xs font-semibold text-navy-500">Returned</dt>
                      <dd className="text-xl font-extrabold tabular-nums text-navy-900">{u.stats.itemsReturned}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-navy-500">This month</dt>
                      <dd className="text-xl font-extrabold tabular-nums text-mint-700">+{u.points.month}</dd>
                    </div>
                  </dl>
                  {last && <p className="mt-3 line-clamp-2 text-sm leading-snug text-navy-600">{last.label}</p>}
                </article>
              </RailItem>
            );
          })}
        </Rail>
      </div>

      {reunions.length > 0 && (
        <div className="mt-10 rounded-card bg-gradient-to-br from-mint-50 to-white p-5 ring-1 ring-mint-100 sm:p-7">
          <div className="flex items-center gap-2 text-mint-800">
            <PartyPopper className="size-5" aria-hidden />
            <h3 className="text-lg font-extrabold">Reunited this week</h3>
          </div>
          <ul className="mt-5 grid gap-4 md:grid-cols-3">
            {reunions.map((it) => {
              const finder = it.resolvedWithUserId ? w.userById.get(it.resolvedWithUserId) : undefined;
              const loc = getLocation(it.locationId);
              return (
                <li key={it.id} className="group relative flex gap-3 rounded-2xl bg-white p-3 shadow-soft transition-shadow hover:shadow-lift">
                  <ItemImage image={it.images[0]} category={it.category} compact className="size-16 shrink-0 rounded-xl" />
                  <div className="min-w-0">
                    <p className="truncate text-[0.95rem] font-extrabold text-navy-900">
                      <Link href={`/item/${it.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-2xl">
                        {it.pet?.name ?? it.title}
                      </Link>
                    </p>
                    <p className="text-xs leading-snug text-navy-600">
                      {finder ? `Thanks to ${finder.name}` : "Home safe"} · {loc.name}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-mint-700">
                      <RelativeTime iso={it.resolvedAt ?? it.postedAt} />
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          <Link href="/leaderboard" className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-mint-800 hover:underline sm:hidden">
            See the leaderboard <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      )}
    </Container>
  );
}
