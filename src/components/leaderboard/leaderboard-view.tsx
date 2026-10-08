"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Crown, MapPin, Sparkles, Trophy } from "lucide-react";
import { cn } from "@/lib/cn";
import { areaById, areas } from "@/lib/data/taxonomy";
import { formatNumber } from "@/lib/format";
import { POINTS_RULES } from "@/lib/levels";
import { useWorld } from "@/lib/store/hooks";
import type { AreaId, User } from "@/lib/types";
import { leaderboard, type LeaderboardPeriod } from "@/lib/world";
import { SkylineArt } from "../home/hero-art";
import { PointsBadge, UserLevel } from "../community/level";
import { PostButton } from "../layout/post-chooser";
import { UserAvatar } from "../ui/avatar";
import { Chip, Segmented, Tabs } from "../ui/form";
import { Container } from "../ui/section";
import { AreaMap, type AreaLeader } from "./sg-map";
import { LeaderboardRow, RankMedal } from "./leaderboard-row";

type TabId = "season" | "month" | "allTime";

const TAB_COPY: Record<TabId, { label: string; title: string; body: string }> = {
  season: { label: "Singapore", title: "Top Finders in Singapore", body: "Recognising the amazing people who help reunite lost items with their owners — this season (Oct–Dec 2026)." },
  month: { label: "This Month", title: "This month's top finders", body: "Fresh start every month. Who's been out there helping the most in October?" },
  allTime: { label: "All Time", title: "Hall of fame", body: "Every point ever earned. These are Singapore's most dependable finders." },
};

function Podium({ top, period, meId }: { top: User[]; period: LeaderboardPeriod; meId?: string }) {
  const order = [top[1], top[0], top[2]];
  const ranks = [2, 1, 3];
  const heights = ["h-24 sm:h-32", "h-32 sm:h-44", "h-20 sm:h-24"];
  const plinth = [
    "from-navy-100 to-navy-200",
    "from-gold-200 to-gold-300",
    "from-[#f6dcc3] to-[#ecbf93]",
  ];
  return (
    <ol className="grid grid-cols-3 items-end gap-2 sm:gap-5" aria-label="Top three finders">
      {order.map((u, i) =>
        u ? (
          <li key={u.id} className="flex flex-col items-center text-center">
            <div className="relative">
              {ranks[i] === 1 && <Crown className="absolute -top-6 left-1/2 size-7 -translate-x-1/2 fill-gold-400 text-gold-500 drop-shadow animate-float" aria-hidden />}
              <UserAvatar user={u} size={ranks[i] === 1 ? "2xl" : "xl"} ring={ranks[i] === 1 ? "gold" : "white"} tick className={u.id === meId ? "drop-shadow-[0_0_0_#ff3b5c]" : ""} />
            </div>
            <Link href={`/user/${u.handle}`} className="mt-3 max-w-full truncate text-[0.92rem] font-extrabold text-navy-900 hover:underline sm:text-lg">
              {u.name}
              {u.id === meId && <span className="ml-1 text-xs text-coral-700">(you)</span>}
            </Link>
            <UserLevel points={u.points.allTime} tone="plain" className="mt-1 max-sm:hidden" />
            <div className={cn("mt-3 flex w-full flex-col items-center justify-start rounded-t-2xl bg-gradient-to-b pt-3 shadow-soft", heights[i], plinth[i])}>
              <RankMedal rank={ranks[i]} size="lg" />
              <p className="mt-2 text-xl font-extrabold tabular-nums text-navy-900 sm:text-3xl">{formatNumber(u.points[period])}</p>
              <p className="text-[0.68rem] font-bold uppercase tracking-wider text-navy-800">pts</p>
            </div>
          </li>
        ) : (
          <li key={i} />
        ),
      )}
    </ol>
  );
}

export function LeaderboardView() {
  const w = useWorld();
  const me = w.currentUser;
  const [tab, setTab] = useState<TabId>("season");
  const [areaId, setAreaId] = useState<AreaId>(me?.homeArea ?? "orchard");
  const [areaView, setAreaView] = useState<"map" | "list">("map");

  const ranked = useMemo(() => leaderboard(w, tab), [w, tab]);
  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3, 10);
  const myRank = me ? ranked.findIndex((u) => u.id === me.id) + 1 : 0;
  const myPts = me ? me.points[tab] : 0;
  const ahead = myRank > 1 ? ranked[myRank - 2] : null;
  const gap = ahead && me ? ahead.points[tab] - myPts : 0;

  const leaders: AreaLeader[] = useMemo(() => {
    const out: AreaLeader[] = [];
    for (const a of areas) {
      const best = w.users
        .filter((u) => u.role !== "admin" && !u.suspended && (u.areaPoints[a.id] ?? 0) > 0)
        .sort((x, y) => (y.areaPoints[a.id] ?? 0) - (x.areaPoints[a.id] ?? 0))[0];
      if (best) out.push({ areaId: a.id, user: best, points: best.areaPoints[a.id] ?? 0 });
    }
    return out;
  }, [w.users]);

  const areaRank = useMemo(
    () =>
      w.users
        .filter((u) => u.role !== "admin" && !u.suspended && (u.areaPoints[areaId] ?? 0) > 0)
        .sort((a, b) => (b.areaPoints[areaId] ?? 0) - (a.areaPoints[areaId] ?? 0))
        .slice(0, 6),
    [w.users, areaId],
  );

  const copy = TAB_COPY[tab];

  return (
    <>
      <section className="relative isolate overflow-hidden bg-gradient-to-b from-gold-50 via-coral-50/60 to-canvas">
        <div aria-hidden className="absolute inset-y-0 right-0 -z-10 hidden w-1/2 opacity-50 [mask-image:linear-gradient(to_left,black_25%,transparent)] lg:block">
          <SkylineArt />
        </div>
        <Container className="pb-10 pt-10 sm:pb-14 sm:pt-14">
          <p className="eyebrow flex items-center gap-2 text-coral-700">
            <Trophy className="size-4" aria-hidden /> Leaderboard
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight text-navy-900 sm:text-5xl">{copy.title}</h1>
          <p className="mt-3 max-w-xl text-[1.02rem] leading-relaxed text-navy-600">{copy.body}</p>
          <Tabs<TabId>
            label="Leaderboard period"
            idPrefix="lb"
            value={tab}
            onChange={setTab}
            className="mt-8 max-w-lg rounded-2xl border-0 bg-white/80 p-1 shadow-soft backdrop-blur [&>button]:h-11 [&>button]:rounded-xl [&>button>span:last-child]:hidden [&>button[aria-selected=true]]:bg-navy-900 [&>button[aria-selected=true]]:text-white"
            tabs={(Object.keys(TAB_COPY) as TabId[]).map((k) => ({ value: k, label: TAB_COPY[k].label }))}
          />
        </Container>
      </section>

      <Container className="-mt-2 grid gap-8 pb-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div id={`lb-panel-${tab}`} role="tabpanel" aria-labelledby={`lb-${tab}`} className="min-w-0">
          {top3.length === 3 && <Podium top={top3} period={tab} meId={me?.id} />}

          <div className="mt-6 overflow-hidden rounded-card bg-white shadow-soft">
            <ol aria-label={`${copy.label} rankings`} className="divide-y divide-line">
              {rest.map((u, i) => (
                <LeaderboardRow key={u.id} user={u} rank={i + 4} points={u.points[tab]} me={u.id === me?.id} />
              ))}
            </ol>
            {me && myRank > 0 && (
              <div className="border-t-2 border-coral-200 bg-coral-50 px-4 py-4">
                <div className="flex items-center gap-3.5">
                  <RankMedal rank={myRank} />
                  <UserAvatar user={me} size="md" tick />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.98rem] font-extrabold text-navy-900">{me.name}</p>
                    <p className="text-xs font-semibold text-coral-700">Your rank{ahead ? ` · ${formatNumber(gap)} pts behind ${ahead.name}` : " · You're in the lead!"}</p>
                  </div>
                  <p className="text-2xl font-extrabold tabular-nums text-coral-700">{formatNumber(myPts)}</p>
                </div>
              </div>
            )}
          </div>
          {!me && (
            <p className="mt-4 rounded-2xl bg-white p-4 text-sm text-navy-600 shadow-soft">
              <Link href="/signup" className="font-bold text-coral-700 underline underline-offset-4">Sign up</Link> to see where you rank — every returned item earns points.
            </p>
          )}
        </div>

        <aside className="space-y-5" aria-label="How ranking works">
          <section className="rounded-card bg-white p-5 shadow-soft">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-navy-900">
              <Sparkles className="size-5 text-violet-600" aria-hidden /> How to climb
            </h2>
            <ul className="mt-3 divide-y divide-line">
              {POINTS_RULES.map((r) => (
                <li key={r.kind} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="flex-1 font-semibold text-navy-800">{r.label}</span>
                  <PointsBadge points={r.points} />
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-card bg-gradient-to-br from-coral-600 to-coral-800 p-5 text-white shadow-coral">
            <p className="text-lg font-extrabold">Be the next hero</p>
            <p className="mt-1 text-sm leading-relaxed text-white/85">Found something? Post it — it takes 30 seconds and earns you +10 points straight away.</p>
            <PostButton variant="secondary" className="mt-4 !text-coral-700" size="sm">
              Post a found item
            </PostButton>
          </section>
        </aside>
      </Container>

      {/* ── By area ─────────────────────────────────────────── */}
      <Container as="section" className="pt-14 sm:pt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-coral-700">Neighbourhoods</p>
            <h2 className="mt-2 text-3xl font-extrabold text-navy-900">Top Finders by Area</h2>
            <p className="mt-2 max-w-xl text-navy-600">See which neighbourhoods have the most helpful finders this month. The top finder in each area earns <strong className="text-navy-900">+50 points</strong>.</p>
          </div>
          <Segmented<"map" | "list"> label="Area view" value={areaView} onChange={setAreaView} options={[{ value: "map", label: "Map view" }, { value: "list", label: "Area list" }]} />
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div>
            {areaView === "map" ? (
              <AreaMap leaders={leaders} selected={areaId} onSelect={setAreaId} meId={me?.id} />
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {[...leaders]
                  .sort((a, b) => b.points - a.points)
                  .map((l) => (
                    <li key={l.areaId}>
                      <button type="button" onClick={() => setAreaId(l.areaId)} aria-pressed={areaId === l.areaId} className={cn("flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-soft transition-all hover:shadow-lift", areaId === l.areaId && "ring-2 ring-coral-500")}>
                        <UserAvatar user={l.user} size="md" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[0.95rem] font-extrabold text-navy-900">{areaById[l.areaId].name}</span>
                          <span className="block truncate text-xs text-navy-500">{l.user.name}</span>
                        </span>
                        <span className="text-lg font-extrabold tabular-nums text-navy-900">{l.points}</span>
                      </button>
                    </li>
                  ))}
              </ul>
            )}
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="group" aria-label="Choose an area">
              {[...leaders].sort((a, b) => b.points - a.points).map((l) => (
                <Chip key={l.areaId} active={areaId === l.areaId} onClick={() => setAreaId(l.areaId)} className="!h-9 shrink-0 !px-3.5">
                  {areaById[l.areaId].name}
                </Chip>
              ))}
            </div>
          </div>

          <section aria-labelledby="area-h" className="overflow-hidden rounded-card bg-white shadow-soft">
            <header className="flex items-center gap-2.5 border-b border-line px-5 py-4">
              <span className="flex size-9 items-center justify-center rounded-xl bg-coral-50 text-coral-600">
                <MapPin className="size-5" aria-hidden />
              </span>
              <div>
                <h3 id="area-h" className="text-lg font-extrabold text-navy-900">
                  {areaById[areaId].name} Top Finders
                </h3>
                <p className="text-xs font-semibold text-navy-500">This month · {areaById[areaId].region}</p>
              </div>
            </header>
            <ol className="divide-y divide-line">
              {areaRank.length === 0 && <li className="p-6 text-sm text-navy-600">No finders here yet. Be the first!</li>}
              {areaRank.map((u, i) => (
                <LeaderboardRow key={u.id} user={u} rank={i + 1} points={u.areaPoints[areaId] ?? 0} me={u.id === me?.id} />
              ))}
            </ol>
          </section>
        </div>
      </Container>
    </>
  );
}
